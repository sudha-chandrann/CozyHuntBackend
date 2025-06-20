import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import UserRouter from "./routes/user.route.js"
dotenv.config();
const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
  credentials: true,
}));

app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

app.use("/api/v1/users", UserRouter);

export {app}