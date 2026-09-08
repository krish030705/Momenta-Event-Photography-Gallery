// controllers/galleryController.js
// Handles gallery creation, PIN management, publish/unpublish (Admin
// side) and the public PIN-verification flow (Customer side).
//
// Security notes, matching the spec's requirements:
//   - The PIN is NEVER stored in plain text -- only its bcrypt hash.
//   - Customers never see pinHash, and unpublished galleries return
//     404 to anyone without an Admin session, so guessing a slug alone
//     reveals nothing.
//   - selectedPhotos is refreshed from the live Photo.isSelected state
//     every time the gallery is created/updated/published, so what
//     gets published always matches what the Admin most recently chose
//     in the Curation Workspace.

import crypto from "crypto";
import bcrypt from "bcryptjs";
import Event from "../models/Event.js";
import Photo from "../models/Photo.js";
import Gallery from "../models/Gallery.js";

// Turns "Arjun & Priya Wedding" into "arjun-priya-wedding-a1b2c3" --
// human-readable but still unique thanks to the random suffix.
const generateSlug = (eventName) => {
  const base = eventName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
};

// Re-reads which photos are currently marked isSelected in the
// Curation Workspace and stores that as the gallery's snapshot.
const refreshSelectedPhotos = async (eventId) => {
  const selected = await Photo.find({ eventId, isSelected: true }).select("_id");
  return selected.map((p) => p._id);
};

// Shared ownership check for all Admin-side gallery actions.
const requireEventOwner = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error("Event not found");
    error.statusCode = 404;
    throw error;
  }
  if (!event.createdBy.equals(user._id)) {
    const error = new Error("Only the event's Admin can manage its gallery");
    error.statusCode = 403;
    throw error;
  }
  return event;
};

// ============ ADMIN SIDE ============

// @route  POST /api/events/:id/gallery
export const createGallery = async (req, res, next) => {
  try {
    const event = await requireEventOwner(req.params.id, req.user);

    const existing = await Gallery.findOne({ eventId: event._id });
    if (existing) {
      res.status(400);
      throw new Error("A gallery already exists for this event. Use update instead.");
    }

    const { pin } = req.body;
    if (!pin || pin.length < 4) {
      res.status(400);
      throw new Error("A PIN of at least 4 characters is required");
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const slug = generateSlug(event.name);
    const selectedPhotos = await refreshSelectedPhotos(event._id);

    const gallery = await Gallery.create({
      eventId: event._id,
      slug,
      pinHash,
      selectedPhotos,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      gallery: {
        _id: gallery._id,
        slug: gallery.slug,
        isPublished: gallery.isPublished,
        selectedPhotoCount: gallery.selectedPhotos.length,
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @route  GET /api/events/:id/gallery
export const getGalleryForEvent = async (req, res, next) => {
  try {
    await requireEventOwner(req.params.id, req.user);

    const gallery = await Gallery.findOne({ eventId: req.params.id });
    if (!gallery) {
      return res.status(200).json({ success: true, gallery: null });
    }

    res.status(200).json({
      success: true,
      gallery: {
        _id: gallery._id,
        slug: gallery.slug,
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt,
        selectedPhotoCount: gallery.selectedPhotos.length,
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @route  PATCH /api/gallery/:id
export const updateGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      res.status(404);
      throw new Error("Gallery not found");
    }

    await requireEventOwner(gallery.eventId, req.user);

    const { pin } = req.body;
    if (pin) {
      if (pin.length < 4) {
        res.status(400);
        throw new Error("A PIN of at least 4 characters is required");
      }
      gallery.pinHash = await bcrypt.hash(pin, 10);
    }

    gallery.selectedPhotos = await refreshSelectedPhotos(gallery.eventId);
    await gallery.save();

    res.status(200).json({
      success: true,
      gallery: {
        _id: gallery._id,
        slug: gallery.slug,
        isPublished: gallery.isPublished,
        selectedPhotoCount: gallery.selectedPhotos.length,
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @route  POST /api/gallery/:id/publish
export const publishGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      res.status(404);
      throw new Error("Gallery not found");
    }

    await requireEventOwner(gallery.eventId, req.user);

    gallery.selectedPhotos = await refreshSelectedPhotos(gallery.eventId);

    if (gallery.selectedPhotos.length === 0) {
      res.status(400);
      throw new Error("Select at least one photo in the Curation Workspace before publishing");
    }

    gallery.isPublished = true;
    gallery.publishedAt = new Date();
    await gallery.save();

    res.status(200).json({
      success: true,
      gallery: {
        _id: gallery._id,
        slug: gallery.slug,
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt,
        selectedPhotoCount: gallery.selectedPhotos.length,
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @route  POST /api/gallery/:id/unpublish
export const unpublishGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      res.status(404);
      throw new Error("Gallery not found");
    }

    await requireEventOwner(gallery.eventId, req.user);

    gallery.isPublished = false;
    await gallery.save();

    res.status(200).json({ success: true, gallery: { _id: gallery._id, isPublished: false } });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ============ CUSTOMER SIDE (public, no login) ============

// @route  GET /api/gallery/:slug
// Returns only enough info to render the PIN entry screen -- NEVER the
// photos themselves, and NEVER anything if the gallery isn't published.
export const getPublicGalleryInfo = async (req, res, next) => {
  try {
    const gallery = await Gallery.findOne({ slug: req.params.slug, isPublished: true }).populate(
      "eventId",
      "name date location"
    );

    if (!gallery) {
      res.status(404);
      throw new Error("This gallery is not available");
    }

    res.status(200).json({
      success: true,
      event: {
        name: gallery.eventId.name,
        date: gallery.eventId.date,
        location: gallery.eventId.location,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/gallery/:slug/verify
export const verifyGalleryPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      res.status(400);
      throw new Error("PIN is required");
    }

    const gallery = await Gallery.findOne({ slug: req.params.slug, isPublished: true })
      .select("+pinHash")
      .populate("eventId", "name date location")
      .populate({
        path: "selectedPhotos",
        select: "storageUrl thumbnailUrl filename createdAt",
      });

    if (!gallery) {
      res.status(404);
      throw new Error("This gallery is not available");
    }

    const isMatch = await bcrypt.compare(pin, gallery.pinHash);
    if (!isMatch) {
      res.status(401);
      throw new Error("Incorrect PIN");
    }

    res.status(200).json({
      success: true,
      event: {
        name: gallery.eventId.name,
        date: gallery.eventId.date,
        location: gallery.eventId.location,
      },
      photos: gallery.selectedPhotos,
    });
  } catch (error) {
    next(error);
  }
};