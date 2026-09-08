// routes/galleryRoutes.js
import express from "express";
import rateLimit from "express-rate-limit";
import {
  updateGallery,
  publishGallery,
  unpublishGallery,
  getPublicGalleryInfo,
  verifyGalleryPin,
} from "../controllers/galleryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Limits PIN-guessing: 10 attempts per 15 minutes per IP address.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Public (Customer) routes ---
router.get("/:slug", getPublicGalleryInfo);
router.post("/:slug/verify", verifyLimiter, verifyGalleryPin);

// --- Admin routes ---
router.patch("/:id", protect, authorize("admin"), updateGallery);
router.post("/:id/publish", protect, authorize("admin"), publishGallery);
router.post("/:id/unpublish", protect, authorize("admin"), unpublishGallery);

export default router;