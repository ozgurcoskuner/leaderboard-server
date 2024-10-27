import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL || "");
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

export default connectDB;
