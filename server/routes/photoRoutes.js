// routes/photoRoutes.js
import express from "express";
import { deletePhoto } from "../controllers/photoController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.delete("/:id", deletePhoto);

export default router;