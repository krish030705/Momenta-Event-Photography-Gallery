// middleware/uploadMiddleware.js
// Configures Multer to hold uploaded files IN MEMORY (as a Buffer),
// not on disk. We never want images touching our own server's disk --
// they go straight from memory to Cloudinary in the controller.

import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only images are allowed.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB per photo
  },
});

export default upload;