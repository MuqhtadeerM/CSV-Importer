import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import importRoutes from "./routes/importRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8080;

// -------------------------
// CORS configuration
// -------------------------

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header:
      // Postman, curl, server-to-server requests, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error(`CORS blocked request from origin: ${origin}`);
      error.status = 403;
      return callback(error);
    },
  }),
);

// -------------------------
// Security middleware
// -------------------------

app.use(helmet());

app.use(express.json({ limit: "1mb" }));

// -------------------------
// Rate limiting
// -------------------------

const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many import requests. Please try again later.",
  },
});

app.use("/api/leads/import", importLimiter);

// -------------------------
// Health check
// -------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "GrowEasy backend is running",
  });
});

// -------------------------
// Application routes
// -------------------------

app.use("/api/leads", importRoutes);

// -------------------------
// Error handling
// Must remain last
// -------------------------

app.use(notFoundHandler);
app.use(errorHandler);

// -------------------------
// Start server
// -------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
