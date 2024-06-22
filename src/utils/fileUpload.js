//through cloudinary
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

// Configuration
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
 });
   
//filepath config
const fileOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath) return null

        //uplaod file on cloudinary
        const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        //if success 
        console.log("File uploaded on cloudinary successfully",response.url)
        return response
    } catch (error) {
        //remove the locally saved file as the upload operation is failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {fileOnCloudinary}