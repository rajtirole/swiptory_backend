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
    //   const avatarLocalFile = req.file?.path;
    //   if (!avatarLocalFile) {
    //     throw new ApiError(400, "Avatar image not found");
    //   }
    //   const avatarImage = await cloudinaryImageUploader(avatarLocalFile);
    //   if (!avatarImage) {
    //     throw new ApiError(400, "Avatar image upload error");
    //   }
      const user = await User.create({
        userName: userName.toLowerCase(),
        // avatar: avatarImage.url,
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
    if (!user) throw new ApiError(400, "user not found");
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
const refreshToken = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req?.body?.refreshToken;
    if (!token) {
      throw new ApiError(400, "refresh token required");
    }
    const userToken = await jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if (!userToken) {
      throw new ApiError(400, "refresh token not verify");
    }
    const id = userToken._id;
    const user = await User.findById(id).select("-password");
    if (!user) {
      throw new ApiError(400, "user not register");
    }
    if (token !== user?.refreshToken) {
      throw new ApiError(400, "refresh token not verify");
    }
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(id);
    if (!refreshToken || !accessToken) {
      throw new ApiError(500, "refresh token generate not success");
    }
    const options = { httpOnly: true, secure: true };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, user, "refresh token generate success"));
  } catch (error) {
    throw new ApiError(error.statusCode||500,error.message||"refresh token generate not success", error.error);
    
  }
});
const changePassword = asyncHandler(async (req, res) => {
 try {
   const { password, newPasssword } = req?.body;
   if (!password || !newPasssword) {
     throw new ApiError(400, "All feilds are required");
   }
   const id = req?.user?._id;
   const user = await User.findById(id);
   if (!user) {
     throw new ApiError(400, "user not found");
   }
   const isPassword = await user.isPassword(password);
   if (!isPassword) {
     throw new ApiError(400, "Invalid credentials");
   }
   user.password = newPasssword;
   await user.save({ validateBeforeSave: false });
   res.status(200).json(new ApiResponse(200, {}, "password change success"));
 } catch (error) {
  throw new ApiError(error.statusCode||500,error.message||"password change success", error.error);
  
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
const updateUser = asyncHandler(async (req, res) => {
try {
    const { userName, email, fullName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullName,
          userName,
          email,
        },
      },
      { new: true }
    ).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(400, "user not found");
    }
    await user.save();
    return res
      .status(200)
      .json(new ApiResponse(200, user, "user data update success"));
} catch (error) {
  throw new ApiError(error.statusCode||500,error.message, error.error);
  
}
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarImageLocalFile = req.file?.path;
    if (!avatarImageLocalFile) {
      throw new ApiError(500, "avatar image not found");
    }
    const avatar = await cloudinaryImageUploader(avatarImageLocalFile);
    if (!avatar?.url) {
      throw new ApiError(500, "avatar image change not success");
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(400, "user not found");
    }
    user.save();
    return res
      .status(200)
      .json(new ApiResponse(200, user, "user avatar update success"));
  } catch (error) {
    throw new ApiError(error.statusCode||500,error.message, error.error);

  }
});
const updateUsercover = asyncHandler(async (req, res) => {
  try {
    const updateUsercoverLocalFile = req.file?.path;
    if (!updateUsercoverLocalFile) {
      throw new ApiError(500, "coverImage not found");
    }
    const coverImage = await cloudinaryImageUploader(updateUsercoverLocalFile);
    if (!coverImage?.url) {
      throw new ApiError(500, "coverImage change not success");
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(400, "user not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "user coverImage update success"));
  } catch (error) {
    throw new ApiError(error.statusCode||500,error.message, error.error);
    
  }
});
const getUserChannel = asyncHandler(async (req, res) => {
  try {
    const { userName } = req.params;
    if (!userName) {
      throw new ApiError(400, "All feilds are required");
    }
    const channel = await User.aggregate([
      {
        $match: {
          userName: userName.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedChannel",
        },
      },
      {
        $addFields: {
          subscribers: {
            $size: "$subscribers",
          },
          subscribedChannels: {
            $size: "$subscribedChannel",
          },
          isSubscribed: {
            $cond: {
              if: {
                $in: [req.user?._id, "$subscribers.subscriber"],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          userName: 1,
          subscribers: 1,
          subscribedChannels: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);
    if (!channel.length) {
      throw new ApiError(400, "channel not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, channel[0], "channel get success"));
  } catch (error) {
    throw new ApiError(error.statusCode||500,error.message, error.error);
    
  }
});
const watchHistory = asyncHandler(async (req, res) => {
 try {
   const id = req.user._id;
   if (!id) {
     throw new ApiError(400, "user not found");
   }
   const watchHistory = await User.aggregate([
     {
       $match: {
         _id: id,
       },
     },
     {
       $lookup: {
         from: "videos",
         localField: "watchHistory",
         foreignField: "_id",
         as: "watchHistory",
         pipeline: [
           {
             $lookup: {
               from: "users",
               localField: "owner",
               foreignField: "_id",
               as: "owner",
               pipeline: [
                 {
                   $project: {
                     fullName: 1,
                     userName: 1,
                     avatar: 1,
                     coverImage: 1,
                   },
                 },
                 {
                   $addFields: {
                     owner: {
                       $first: "$owner",
                     },
                   },
                 },
               ],
             },
           },
         ],
       },
     },
   ]);
   if (!watchHistory) {
     throw new ApiError(500, "watchHistory not found");
   }
   res
     .status(200)
     .json(
       new ApiResponse(
         200,
         watchHistory[0].watchHistory,
         "watch history get success"
       )
     );
 } catch (error) {
  throw new ApiError(error.statusCode||500,error.message, error.error);
  
 }
});

export {
  register,
  login,
  logout,
  refreshToken,
  getUser,
  updateUser,
  updateUserAvatar,
  changePassword,
};
