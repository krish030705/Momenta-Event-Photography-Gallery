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
import { uploadPhotos, getPhotos } from "../controllers/photoController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", authorize("admin"), createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);

router.put("/:id", authorize("admin"), updateEvent);
router.delete("/:id", authorize("admin"), deleteEvent);

router.post("/:id/members", authorize("admin"), addTeamMember);
router.delete("/:id/members/:userId", authorize("admin"), removeTeamMember);

router.post("/:id/photos", upload.array("photos", 20), uploadPhotos);
router.get("/:id/photos", getPhotos);

export default router;