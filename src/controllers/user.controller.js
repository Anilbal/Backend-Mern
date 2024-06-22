import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const registerUser=asyncHandler(async(req,res)=>{
    const {fullName,email,username,password}=req.body

    //validation
    if(username==="" || email==="" || fullName==="" || password===""){
        return res.status(400).json({message:"All fields are required"})
    }

    //checks if user already exits or not based on email and username both
    const userExists=await User.findOne({
        $or:[{username},{email}]
    })

    if(userExists){
        return res.status(400).json({message:"User already exists"})
    }

})

export {registerUser}