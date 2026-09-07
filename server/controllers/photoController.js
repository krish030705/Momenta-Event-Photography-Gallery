// controllers/photoController.js
// Handles uploading photos to an event, listing them, and deleting them.
//
// Access rules: Upload/View = event's Admin (owner) OR assigned team
// member. Delete = the uploader, OR the event's Admin (owner) only.

import Event from "../models/Event.js";
import Photo from "../models/Photo.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  buildThumbnailUrl,
} from "../utils/cloudinaryUpload.js";

const getEventIfAuthorized = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = event.createdBy.equals(user._id);
  const isMember = event.teamMembers.some((id) => id.equals(user._id));

  if (!isOwner && !isMember) {
    const error = new Error("You do not have access to this event");
    error.statusCode = 403;
    throw error;
  }

  return { event, isOwner };
};

// @route  POST /api/events/:id/photos
export const uploadPhotos = async (req, res, next) => {
  try {
    const { event } = await getEventIfAuthorized(req.params.id, req.user);

    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("No files were uploaded");
    }

    const results = await Promise.allSettled(
      req.files.map(async (file) => {
        const cloudinaryResult = await uploadBufferToCloudinary(
          file.buffer,
          `vistara/${event._id}`
        );

        return Photo.create({
          eventId: event._id,
          uploadedBy: req.user._id,
          filename: file.originalname,
          storageUrl: cloudinaryResult.secure_url,
          storagePublicId: cloudinaryResult.public_id,
          thumbnailUrl: buildThumbnailUrl(cloudinaryResult.secure_url),
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadStatus: "success",
        });
      })
    );

    const uploaded = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r, i) => ({ filename: req.files[i]?.originalname, reason: r.reason?.message }));

    await Promise.all(
      uploaded.map((p) => p.populate("uploadedBy", "name email"))
    );

    res.status(201).json({
      success: true,
      uploadedCount: uploaded.length,
      failedCount: failed.length,
      photos: uploaded,
      failures: failed,
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @route  GET /api/events/:id/photos
export const getPhotos = async (req, res, next) => {
  try {
    await getEventIfAuthorized(req.params.id, req.user);

    const photos = await Photo.find({ eventId: req.params.id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, photos });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @route  DELETE /api/photos/:id
export const deletePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id).populate("eventId");

    if (!photo) {
      res.status(404);
      throw new Error("Photo not found");
    }

    const event = photo.eventId;
    const isUploader = photo.uploadedBy.equals(req.user._id);
    const isEventOwner = event.createdBy.equals(req.user._id);

    if (!isUploader && !isEventOwner) {
      res.status(403);
      throw new Error("You can only delete your own photos");
    }

    try {
      await deleteFromCloudinary(photo.storagePublicId);
    } catch (cloudErr) {
      console.error(`Cloudinary deletion failed for ${photo.storagePublicId}:`, cloudErr.message);
    }

    await photo.deleteOne();

    res.status(200).json({ success: true, message: "Photo deleted" });
  } catch (error) {
    next(error);
  }
};