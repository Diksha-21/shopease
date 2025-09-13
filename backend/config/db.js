import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const con_data = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};

export default con_data;