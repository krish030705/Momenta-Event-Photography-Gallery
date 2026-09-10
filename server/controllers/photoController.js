// controllers/photoController.js
// Handles saving uploaded photo metadata, listing, selecting, and
// deleting photos.
//
// Access rules: Upload/View = event's Admin (owner) OR assigned team
// member. Delete = the uploader, OR the event's Admin (owner) only.
// Select/bulk-select = Admin (owner) only.

import Event from "../models/Event.js";
import Photo from "../models/Photo.js";
import {
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

// @route  POST /api/events/:id/photos/metadata
// @access Admin (owner) or assigned Team Member
// The image bytes never touch this server -- the browser uploads
// directly to Cloudinary and this endpoint just records the resulting
// URLs as Photo documents.
export const savePhotoMetadata = async (req, res, next) => {
  try {
    const { event } = await getEventIfAuthorized(req.params.id, req.user);

    const { photos } = req.body;
    if (!Array.isArray(photos) || photos.length === 0) {
      res.status(400);
      throw new Error("No photo metadata provided");
    }

    const results = await Promise.allSettled(
      photos.map((p) =>
        Photo.create({
          eventId: event._id,
          uploadedBy: req.user._id,
          filename: p.filename,
          storageUrl: p.storageUrl,
          storagePublicId: p.storagePublicId,
          thumbnailUrl: buildThumbnailUrl(p.storageUrl),
          fileSize: p.fileSize,
          mimeType: p.mimeType,
          uploadStatus: "success",
        })
      )
    );

    const saved = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

    await Promise.all(saved.map((p) => p.populate("uploadedBy", "name email")));

    res.status(201).json({
      success: true,
      savedCount: saved.length,
      photos: saved,
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @route  GET /api/events/:id/photos
// @access Admin (owner) or assigned Team Member
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
// @access The uploader, or the event's Admin (owner)
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

// @route  PATCH /api/photos/:id/select
// @access Admin only, and only the event's owner
export const selectPhoto = async (req, res, next) => {
  try {
    const { isSelected } = req.body;

    if (typeof isSelected !== "boolean") {
      res.status(400);
      throw new Error("isSelected (true/false) is required");
    }

    const photo = await Photo.findById(req.params.id).populate("eventId");
    if (!photo) {
      res.status(404);
      throw new Error("Photo not found");
    }

    const event = photo.eventId;
    if (!event.createdBy.equals(req.user._id)) {
      res.status(403);
      throw new Error("Only the event's Admin can select photos for the gallery");
    }

    photo.isSelected = isSelected;
    await photo.save();

    res.status(200).json({ success: true, photo });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/events/:id/photos/bulk-select
// @access Admin only, and only the event's owner
export const bulkSelectPhotos = async (req, res, next) => {
  try {
    const { photoIds, isSelected } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      res.status(400);
      throw new Error("photoIds must be a non-empty array");
    }
    if (typeof isSelected !== "boolean") {
      res.status(400);
      throw new Error("isSelected (true/false) is required");
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }
    if (!event.createdBy.equals(req.user._id)) {
      res.status(403);
      throw new Error("Only the event's Admin can select photos for the gallery");
    }

    await Photo.updateMany(
      { _id: { $in: photoIds }, eventId: event._id },
      { $set: { isSelected } }
    );

    const updatedPhotos = await Photo.find({ eventId: event._id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, photos: updatedPhotos });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};