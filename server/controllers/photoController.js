import {
  deleteFromCloudinary,
  buildThumbnailUrl,
} from "../utils/cloudinaryUpload.js";

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