import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import cloudinaryImageUploader from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import fs from "fs";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Token generate not succes");
  }
};
const register = asyncHandler(async (req, res) => {
    try {
      const { userName, password } = req.body;
      if (
        [userName, password].some((value) => {
          return !value?.trim();
        })
      ) {
        throw new ApiError(400, "All feilds are required");
      }
      const isUser = await User.findOne({
       userName
      });
        if (isUser) {
        if(req.file?.path){
        fs.unlinkSync(req?.file?.path);
        }
        
        throw new ApiError(400, "User already registered");
      }
    
      const user = await User.create({
        userName: userName.toLowerCase(),
        password,
      });
      if (!user) {
        throw new ApiError(500, "user register not success");
      }
      const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );
      if (!createUser) {
        throw new ApiError(500, "User register not success");
      }
      res
        .status(201)
        .json(new ApiResponse(200, {userName:createUser.userName,created:createUser.createdAt,updated:createUser.updatedAt}, "Registered successfully"));
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "user register not success",
        error.error
      );
    }
  });
const login = asyncHandler(async (req, res) => {
    console.log('login route');
  try {
    const { userName, password } = req.body;
    if (!userName||!password) {
      throw new ApiError(400, "All feilds are required");
    }
    const user = await User.findOne({userName}).select("-refreshToken")
    if (!user) throw new ApiError(400, "User not registered");
    const isUser = await user.isPassword(password);
    if (!isUser) {
      throw new ApiError(400, "Invalid credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    console.log(accessToken, refreshToken);
    const data = await User.findById(user._id).select("-password -refreshToken");
  
    const options = { httpOnly: true, secure: true ,sameSite:'none'};
    res.setHeader('token', accessToken)
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(201,{userName:data.userName,created:data.createdAt,updated:data.updatedAt}, "user login success"));  
  } catch (error) {
    throw new ApiError(error.statusCode||500,error.message||"user login not success", error.error);
    
  } 
});
const logout = asyncHandler(async (req, res, next) => {
  try {
    const id = req.user._id;
    await User.findByIdAndUpdate(id, {
      $set: { refreshToken: undefined },
    });
    const options = { httpOnly: true, secure: true,sameSite:'none' };
    res
      .status(201)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Logout Successfull!"));
  } catch (error) {
    throw new ApiError(error.statusCode||500,error.message, error.error);
    
  }
}); 

const getUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new ApiError(400, "user not found");
    }
    return res.status(200).json(new ApiResponse(200, {id:user._id,userName:user.userName,created:user.createdAt,updated:user.updatedAt}, "succesfully get user"));
  } catch (error) {
    throw new ApiError(error.statusCode||500,error.message, error.error);

  }
});



export {
  register,
  login,
  logout,
  getUser,
};
