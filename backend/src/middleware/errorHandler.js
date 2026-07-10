import multer from "multer";

/**
 * Centralized error handler. Every route delegates errors here via next(err)
 * (or by throwing inside an async handler wrapped with asyncHandler).
 *
 * Security notes:
 * - Stack traces are only included outside production, so internals are
 *   never leaked to clients in a deployed environment.
 * - Unknown/unexpected errors always collapse to a generic 500 message —
 *   we never forward raw internal error text (e.g. DB/SDK errors) to the
 *   client, only the intentional, safe .message set on known error types.
 */
export function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.message);

  // Multer-specific errors (file too large, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  const status = err.status || err.statusCode || 500;
  const isKnownError = status < 500; // 4xx errors were deliberately thrown by us
  const message = isKnownError ? err.message : "Internal server error";

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && !isKnownError
      ? { stack: err.stack }
      : {}),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found" });
}

/** Wraps an async route handler so thrown errors reach errorHandler. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
