import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    // Open mongoose connection to mongodb
    const DB_connect_instance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    // Check if app is connected to proper DB server
    console.log(
      "MongoDB connected !! DB Host :: ",
      DB_connect_instance.connection.host
    );
  } catch (error) {
    console.log("MongoDB connection Failed !! ", error);
    process.exit(1);
  }
};

export default connectDB;
