// routes/eventRoutes.js
import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addTeamMember,
  removeTeamMember,
} from "../controllers/eventController.js";
import { getPhotos, bulkSelectPhotos, savePhotoMetadata } from "../controllers/photoController.js";
import { createGallery, getGalleryForEvent } from "../controllers/galleryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", authorize("admin"), createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);

router.put("/:id", authorize("admin"), updateEvent);
router.delete("/:id", authorize("admin"), deleteEvent);

router.post("/:id/members", authorize("admin"), addTeamMember);
router.delete("/:id/members/:userId", authorize("admin"), removeTeamMember);

router.post("/:id/photos/metadata", savePhotoMetadata);
router.get("/:id/photos", getPhotos);
router.patch("/:id/photos/bulk-select", authorize("admin"), bulkSelectPhotos);

router.post("/:id/gallery", authorize("admin"), createGallery);
router.get("/:id/gallery", authorize("admin"), getGalleryForEvent);

export default router;