import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRoutes from './routes/user.route.js'
import storiesRoutes from './routes/stories.routes.js'
const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.get('/api/v1/test',(req,res)=>{
    res.status(200).json({
        success:true,
        message:"server running"
    })
})
//routes for user 
app.use('/api/v1/user',userRoutes)
app.use('/api/v1/stories',storiesRoutes)
export default app;