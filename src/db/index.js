import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB= async()=>{
    try{
      const connectionInstance=  await mongoose.connect(`${process.env.DATABASE_URL}`)
      console.log(` the mongoDb is connected !! DB HOST : ${connectionInstance.connection.host} `)
    }
    catch(error){
        console.log("MONGODB connection error ",error);
        process.exit(1)
    }
}

export default connectDB;