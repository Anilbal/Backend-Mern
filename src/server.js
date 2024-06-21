import dotenv from 'dotenv'
import { app } from "./app.js"
import connectDB from './database/db.js'

dotenv.config()
const port=process.env.PORT || 8000

connectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log(`Server started at http://localhost:${port}`)
    })
})
.catch((error)=>{
    console.log("Mongo error",error)
})