import { configDotenv } from "dotenv";
import express from 'express'
import morgan from "morgan";
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'
import cookieParser from "cookie-parser";
import cors from 'cors'
import perfectExpressSanitizer from "perfect-express-sanitizer";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.route.js"

export const app=express()

if(process.env.NODE_ENV=="DEVELOPMENT"){
app.use(morgan('dev'))

}

//global rate limiting
const limiter=rateLimit({
    windowMs:15*60*1000,
    limit:100,
    message:"Error!! To many requests detected ! please try later"
})

//security
app.use(hpp())
app.use(limiter)
app.use(helmet())
app.set('trust proxy', 1)
app.use(cookieParser())
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true,
    methods:["GET","POST","PUT","DELETE","PATCH","HEAD","OPTIONS"],
    allowedHeaders:[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "device-remember-token",
        "Access-Control-Allow-Origin",
        "Origin",
        "Accept",
    ]
}))

app.use(express.json({limit:'10kb'}))
app.use(express.urlencoded({extended:true,limit:'10kb'}))
app.use(
  perfectExpressSanitizer.clean({
    xss: true,
    noSql: true,
    sql: true,
  })
);



app.get('/health', (req, res) => {
    res.status(200).send(" Auth-System is healthy");
});
app.use('/api/v1/auth', authRoutes);


//404 route 
app.use((req,res)=>{
    res.status(404).json({
        status:'error',
        message:'Route not found'
    })
})

app.use(errorHandler)
