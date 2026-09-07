import Photo from "../models/Photo.js";
import Event from "../models/Event.js";

// @route POST /api/events/:id/photos
// @access Protected
export const uploadPhotos = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }

    // Add your existing upload/cloudinary logic here.
    // Keep your current uploadPhotos implementation if you already have one.

  } catch (error) {
    next(error);
  }
};


// @route GET /api/events/:id/photos
// @access Protected
export const getPhotos = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }

    const photos = await Photo.find({
      eventId: req.params.id,
    })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      photos,
    });
  } catch (error) {
    next(error);
  }
};


// @route PATCH /api/photos/:id/select
// @access Admin only, event owner
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
      throw new Error(
        "Only the event's Admin can select photos for the gallery"
      );
    }

    photo.isSelected = isSelected;

    await photo.save();

    res.status(200).json({
      success: true,
      photo,
    });
  } catch (error) {
    next(error);
  }
};


// @route PATCH /api/events/:id/photos/bulk-select
// @access Admin only, event owner
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
      throw new Error(
        "Only the event's Admin can select photos for the gallery"
      );
    }

    await Photo.updateMany(
      {
        _id: { $in: photoIds },
        eventId: event._id,
      },
      {
        $set: { isSelected },
      }
    );

    const updatedPhotos = await Photo.find({
      eventId: event._id,
    })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      photos: updatedPhotos,
    });
  } catch (error) {
    next(error);
  }
};
// @route DELETE /api/photos/:id
// @access Admin only, event owner
export const deletePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id).populate("eventId");

    if (!photo) {
      res.status(404);
      throw new Error("Photo not found");
    }

    const event = photo.eventId;

    if (!event.createdBy.equals(req.user._id)) {
      res.status(403);
      throw new Error(
        "Only the event's Admin can delete photos"
      );
    }

    await Photo.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};