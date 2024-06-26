import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/fileUpload.js'
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

//generating access and refresh token
const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generatingAccessToken()
        const refreshToken=user.generatingRefreshToken()

        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave: false });

        return {accessToken,refreshToken}

    } catch (error) {
        console.log("Token not generated",error.message)
    }
}

//user Register
const registerUser=asyncHandler(async(req,res)=>{
    const {fullName,email,username,password}=req.body

    //validation
    if(username==="" || email==="" || fullName==="" || password===""){
        return res.status(400).json({message:"All fields are required"})
    }

    //checks if user already exits or not based on email and username both
    // $or:[{username},{email}] => it checks multiple fields
    const userExists=await User.findOne({email})
    if(userExists){
        return res.status(400).json({message:"User already exists"})
    }

    //image files
    const avatarLocalPath=req.files?.avatar[0]?.path
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenght>0) return coverImageLocalPath =req.files.coverImage[0].path

    if(!avatarLocalPath){
        return res.status(400).json({message:"Avatar file is required"})
    }
    //uploading in cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        return res.status(400).json({message:"Avatar is required"})
    }

   const user =await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        return res.status(500).json({message:"Register failed"})
    }
    return res.status(201).json({
        createdUser,
        message:"User registered successfully"
    })
})

//user Login
const loginUser=asyncHandler(async(req,res)=>{
    //ask user to enter email and password
    //check if login user exists or not
    //check password is correct or not

    const {email,username,password}=req.body

    if(!email){
        return res.status(400).json({message:"Email is required"})
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        return res.status(400).json({message:"User not registered"})
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        return res.status(400).json({message:"Password incorrect"})
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    const loggedUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json({
        user:loggedUser,
        refreshToken,
        accessToken,
        message:"User logged in"
    })
})

//user logout
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },{
        new:true
    })

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({message:"User logout successfully"})
})

//refreshing Access token
const refreshAccessToken=asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomingRefreshToken){
            return res.status(401).json({message:"Unauthorized access"})
        }
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET_KEY)
        const user=await User.findById(decodedToken?._id)
        if(!user){
            return res.status(401).json({message:"Invalid refresh token"})
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            return res.status(401).json({message:"Refresh token is expired"})
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json({
            accessToken,
            refreshToken:newRefreshToken,
            message:"Access Token refreshed"
        })
    } catch (error) {
        console.log(error.message)
    }
})

//change password
const changePassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user=await User.findById(req.user?._id)
    const isOldPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isOldPasswordCorrect){
        return res.status(400).json({message:"Password is incorrect"})
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json({message:"Password changed successfuly"})
})


//get current user
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(req.user)
})

//user update
const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
    return res.status(200).json({message:"All field are required"})
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullName,
            email
        }
    },{new:true}).select("-password")

    return res.status(200).json({user,message:"Account details updated successfully"})
})

//user profile update
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const localPath=req.file?.path
    if(!localPath){
        return res.status(400).json({message:"Avatar file is missing"})
    }

    const avatar=await uploadOnCloudinary(localPath)
    if(!avatar){
        return res.status(400).json({message:"Error on uploading"})
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select("-password")

    return res.status(200).json({
        user,
        message:"Avatar changed succssfully"
    })
})


//user profile update
const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        return res.status(400).json({message:"Image file is missing"})
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        return res.status(400).json({message:"Error on uploading"})
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select("-password")

    return res.status(200).json({
        user,
        message:"Cover image changed succssfully"
    })
})

//User profile
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        return res.status(401).json({message:"Username not found"})
    }   

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelSubscribedCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }
    ])

    // console.log(channel)
    if(!channel.length){
        return res.status(401).json({message:"Channel not found"})
    }

    return res.status(200).json({
        channel:channel[0],
        message:"User channel got successfully"
    })
})

//watch history
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[{
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                            }
                        }]
                    }
                },{
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }]
            }
        }
    ])

    return res.status(200).json({
        user:user[0].watchHistory,
        message:"Wtach history fetched"
    })
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}