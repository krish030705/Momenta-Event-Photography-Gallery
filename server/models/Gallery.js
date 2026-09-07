// models/Gallery.js
// Represents the published, customer-facing version of an Event.
// The PIN is never stored in plain text -- only its bcrypt hash
// (pinHash), the same way we hash user passwords.

import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true, // one gallery per event
    },
    slug: {
      type: String,
      required: true,
      unique: true, // this is what appears in the public URL: /gallery/:slug
      index: true,
    },
    pinHash: {
      type: String,
      required: true,
      select: false, // never return this field by default
    },
    selectedPhotos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photo",
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null, // optional -- null means the gallery never expires
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);
