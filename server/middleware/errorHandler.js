// middleware/errorHandler.js
// A single, centralized place that turns any thrown error into a
// consistent JSON response. This means our controllers can just
// "throw" or call next(error) without worrying about response formatting.

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // If a route already set a status code (e.g. 400/403), keep it.
  // Otherwise default to 500 (unexpected server error).
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong on the server",
    // Only include the stack trace outside production, so we never
    // leak internal details to real users.
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
