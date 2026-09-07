// config/cloudinary.js
// Sets up the Cloudinary SDK using credentials from environment variables.
// This is used by the upload middleware (Phase 5) to send photo files
// straight to Cloudinary instead of storing them on our own server or
// inside MongoDB.

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
