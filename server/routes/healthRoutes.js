// routes/healthRoutes.js
// A simple "is the API alive and connected to the database" endpoint.
// Phase 1 uses this to prove the frontend and backend can talk to each
// other before we build any real features on top.

import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // Mongoose connection states: 0 = disconnected, 1 = connected,
  // 2 = connecting, 3 = disconnecting
  const dbStatus = ["disconnected", "connected", "connecting", "disconnecting"][dbState];

  res.status(200).json({
    success: true,
    message: "Momenta API is running",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
