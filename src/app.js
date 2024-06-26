import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
const app=express()

//middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRoutes from './routes/user.route.js'

//routes 
app.use('/api/users',userRoutes)


export {app}