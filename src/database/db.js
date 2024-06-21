import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGO_DB}/${DB_NAME}`)
        console.log(`Database connected !! DB host :${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDb connection failed",error)
    }
}
export default connectDB