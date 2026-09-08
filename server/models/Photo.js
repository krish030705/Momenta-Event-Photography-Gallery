// models/Photo.js
// Stores METADATA about a photo only. The actual image bytes live on
// Cloudinary -- we just keep the URL (and the Cloudinary public ID, which
// we need if we ever want to delete or transform the image later).

import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    storageUrl: {
      type: String,
      required: true, // full Cloudinary URL used to actually display the image
    },
    storagePublicId: {
      type: String,
      required: true, // Cloudinary's internal ID, needed to delete/transform later
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number, // bytes
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false, // set to true when an Admin selects it for the gallery
    },
    uploadStatus: {
      type: String,
      enum: ["uploading", "success", "failed"],
      default: "success",
    },
  },
  { timestamps: true }
);

// Curation workspace filters heavily by event + selection state + uploader,
// so these indexes keep those queries fast even with thousands of photos.
photoSchema.index({ eventId: 1, isSelected: 1 });
photoSchema.index({ eventId: 1, uploadedBy: 1 });

export default mongoose.model("Photo", photoSchema);
