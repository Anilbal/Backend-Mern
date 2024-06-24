import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    avatar:{
        type:String,
        required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    refreshToken:{
        type:String
    }

},{timestamps:true})

//middleware for hasing passowrd
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10)
        next()
    }else{
        return next()
    }
})

//method for comparing password
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

//method for generating access token
userSchema.methods.generatingAccessToken=function(){
    return jwt.sign({
        _id:this._id,
        username:this.username,
        email:this.email,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}

//method for generating Refresh token
userSchema.methods.generatingRefreshToken=function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    {expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
}

export const User=mongoose.model("User",userSchema)