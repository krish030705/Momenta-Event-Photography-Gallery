// middleware/authMiddleware.js
// protect: confirms a valid JWT and attaches the user to req.user
// authorize(...roles): checks req.user.role is one of the allowed roles
//
// This is the REAL security layer -- runs on the server regardless of
// what the frontend UI shows or hides.

import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error("Not authorized — no token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      return next(new Error("Not authorized — user no longer exists"));
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next(new Error("Not authorized — invalid or expired token"));
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Access denied — requires role: ${allowedRoles.join(" or ")}`)
      );
    }
    next();
  };
};