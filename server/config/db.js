// config/db.js
// Handles connecting to MongoDB Atlas using Mongoose.
// Keeping this in its own file (instead of inline in server.js) means
// we can reuse the same connection logic in test files later.

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Exit the process if we can't connect to the DB -- there's no point
    // running an API server that has no database behind it.
    process.exit(1);
  }
};

export default connectDB;
