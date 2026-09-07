// routes/photoRoutes.js
import express from "express";
import { deletePhoto, selectPhoto } from "../controllers/photoController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.delete("/:id", deletePhoto);
router.patch("/:id/select", selectPhoto);

export default router;