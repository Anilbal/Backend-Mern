import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/fileUpload.js'
import jwt from 'jsonwebtoken'

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



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}