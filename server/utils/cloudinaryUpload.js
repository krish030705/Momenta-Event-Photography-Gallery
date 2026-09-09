// utils/cloudinaryUpload.js
// Uploads a single file BUFFER (from Multer's memory storage) to
// Cloudinary using upload_stream + streamifier.

import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

export const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    // Safety net: if Cloudinary never calls back (a dropped connection,
    // a network hiccup between Render and Cloudinary, etc.), this
    // rejects after 45s instead of letting the request hang forever.
    const timeout = setTimeout(() => {
      reject(new Error("Upload timed out -- please try again"));
    }, 45000);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        clearTimeout(timeout);
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export const buildThumbnailUrl = (secureUrl) => {
  return secureUrl.replace("/upload/", "/upload/c_fill,w_400,h_400,q_auto/");
};