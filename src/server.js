// import { configDotenv } from "dotenv"
import express from 'express'

const app=express()

const port=process.env.PORT || 8000

app.listen(port,()=>{
    console.log(`Server started at http://localhost:${port}`)
})