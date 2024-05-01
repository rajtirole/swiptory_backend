import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const auth=asyncHandler(async(req,res,next)=>{
    try {
        //get token form user in req cookies or header
        const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        //if no token found show error
        throw new ApiError(400,"not valid token")
    }
    const user=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET) 
    if(!user){
        throw new ApiError(400,"Invalid access token")
    }
    const data=await User.findById(user?._id).select("-password -refreshToken")
    if(!data){
        throw new ApiError(400,"user not found")

    }
    req.user=data;
    next()
    } catch (error) {
        throw new ApiError(400,"Please Login/Register",error)
        
    }

})
export default auth