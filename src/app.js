import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import UserRouter from "./routes/user.route.js";
import ListingRouter from "./routes/list.route.js";
import AdminRouter from "./routes/admin.route.js"
import { handleMulterError } from "./middleware/multer.js";
dotenv.config();
const app = express()


app.use(cors({
  origin: process.env.CORS_ORIGIN,
  // origin:'http://localhost:5173', 
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
app.use(handleMulterError);
app.use(cookieParser())

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/listings",ListingRouter);
app.use("/api/v1/admins",AdminRouter);
export {app}