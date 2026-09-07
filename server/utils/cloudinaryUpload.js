// utils/cloudinaryUpload.js
// Uploads a single file BUFFER (from Multer's memory storage) to
// Cloudinary using upload_stream + streamifier -- avoids the
// multer-storage-cloudinary dependency conflict we hit earlier.

import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

export const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
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

// Cloudinary can generate a resized thumbnail on the fly just by
// inserting a transformation string into the original URL.
export const buildThumbnailUrl = (secureUrl) => {
  return secureUrl.replace("/upload/", "/upload/c_fill,w_400,h_400,q_auto/");
};