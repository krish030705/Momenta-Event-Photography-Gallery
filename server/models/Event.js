// models/Event.js
// An Event is the container for a shoot (e.g. a wedding). It has one
// creator (the Admin who made it) and a list of team members who are
// allowed to upload photos to it.

import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Speeds up "find all events created by this admin" and
// "find all events this team member belongs to" queries.
eventSchema.index({ createdBy: 1 });
eventSchema.index({ teamMembers: 1 });

export default mongoose.model("Event", eventSchema);
