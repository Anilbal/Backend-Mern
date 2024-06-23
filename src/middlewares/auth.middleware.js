import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

export const verifyJwt=asyncHandler(async(req,res,next)=>{
     try {
        const token=await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
           return res.status(401).json({message:"Unauthoraized request"})
        }
   
       const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET_KEY)
       const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
   
       if(!user){
           return res.status(400).json({message:"Invalid access token"})
       }
       req.user=user;
       next()
     } catch (error) {
        console.log(error.message)
     }
})