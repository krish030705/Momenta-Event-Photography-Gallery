// controllers/eventController.js
// Event CRUD + team member management.
//
// Key access rule from the spec: Admins only see/manage events THEY
// created; Team Members only see events they've been added to. Nobody
// can see or touch an event they have no relationship to -- even if
// they guess a valid event ID.

import Event from "../models/Event.js";
import Photo from "../models/Photo.js";
import Gallery from "../models/Gallery.js";
import User from "../models/User.js";

// Small helper: attaches live photo/gallery stats to a plain event object.
// Used by both getEvents (list) and getEventById (detail) so the numbers
// shown on the dashboard and the event page are always consistent.
const attachStats = async (event) => {
  const [totalPhotos, selectedPhotos, gallery] = await Promise.all([
    Photo.countDocuments({ eventId: event._id }),
    Photo.countDocuments({ eventId: event._id, isSelected: true }),
    Gallery.findOne({ eventId: event._id }).select("isPublished"),
  ]);

  return {
    ...event.toObject(),
    totalPhotos,
    selectedPhotos,
    isPublished: gallery?.isPublished || false,
  };
};

// @route  POST /api/events
// @access Admin only
export const createEvent = async (req, res, next) => {
  try {
    const { name, description, date, location } = req.body;

    if (!name || !date) {
      res.status(400);
      throw new Error("Event name and date are required");
    }

    const event = await Event.create({
      name,
      description,
      date,
      location,
      createdBy: req.user._id,
      teamMembers: [],
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/events
// @access Any logged-in user (results scoped by role)
export const getEvents = async (req, res, next) => {
  try {
    // Admins see events they created. Team members see events they've
    // been added to. This is the core of the access-control model --
    // the query itself makes it impossible to leak events you're not
    // part of, rather than relying on filtering after the fact.
    const filter =
      req.user.role === "admin"
        ? { createdBy: req.user._id }
        : { teamMembers: req.user._id };

    const events = await Event.find(filter)
      .populate("teamMembers", "name email")
      .populate("createdBy", "name email")
      .sort({ date: -1 });

    const eventsWithStats = await Promise.all(events.map(attachStats));

    res.status(200).json({ success: true, events: eventsWithStats });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/events/:id
// @access Admin (if owner) or Team Member (if assigned)
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("teamMembers", "name email")
      .populate("createdBy", "name email");

    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }

    const isOwner = event.createdBy._id.equals(req.user._id);
    const isMember = event.teamMembers.some((m) => m._id.equals(req.user._id));

    if (!isOwner && !isMember) {
      res.status(403);
      throw new Error("You do not have access to this event");
    }

    const eventWithStats = await attachStats(event);

    res.status(200).json({ success: true, event: eventWithStats });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/events/:id
// @access Admin only, and only if they created it
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }

    if (!event.createdBy.equals(req.user._id)) {
      res.status(403);
      throw new Error("You can only edit events you created");
    }

    const { name, description, date, location } = req.body;
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (location !== undefined) event.location = location;

    await event.save();

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/events/:id
// @access Admin only, and only if they created it
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }

    if (!event.createdBy.equals(req.user._id)) {
      res.status(403);
      throw new Error("You can only delete events you created");
    }

    // Clean up dependent data so deleting an event doesn't leave orphaned
    // photos/galleries behind.
    await Promise.all([
      Photo.deleteMany({ eventId: event._id }),
      Gallery.deleteMany({ eventId: event._id }),
      event.deleteOne(),
    ]);

    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/events/:id/members
// @access Admin only, and only if they created the event
export const addTeamMember = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }

    if (!event.createdBy.equals(req.user._id)) {
      res.status(403);
      throw new Error("You can only manage team members on events you created");
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      res.status(404);
      throw new Error("No user found with that email");
    }

    if (event.teamMembers.some((id) => id.equals(userToAdd._id))) {
      res.status(400);
      throw new Error("This person is already a team member on this event");
    }

    event.teamMembers.push(userToAdd._id);
    await event.save();
    await event.populate("teamMembers", "name email");

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/events/:id/members/:userId
// @access Admin only, and only if they created the event
export const removeTeamMember = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404);
      throw new Error("Event not found");
    }

    if (!event.createdBy.equals(req.user._id)) {
      res.status(403);
      throw new Error("You can only manage team members on events you created");
    }

    event.teamMembers = event.teamMembers.filter(
      (id) => !id.equals(req.params.userId)
    );
    await event.save();
    await event.populate("teamMembers", "name email");

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};