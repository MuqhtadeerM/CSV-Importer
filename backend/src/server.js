import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import importRoutes from "./routes/importRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Render (and most PaaS hosts) put the app behind a reverse proxy. Without
// this, express-rate-limit sees Render's proxy IP for every request instead
// of the real client IP.
app.set("trust proxy", 1);

// Allow local development + deployed Vercel frontend.
// FRONTEND_URL is set in Render's environment settings — no need to
// hardcode the Vercel URL here too (avoids drift if it ever changes).
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Incoming request origin:", origin);

    // Allow Postman, curl, server-to-server requests (no Origin header)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked CORS origin:", origin);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

// IMPORTANT: CORS must be registered early
app.use(cors(corsOptions));

// helmet() defaults to Cross-Origin-Resource-Policy: same-origin, which
// browsers enforce SEPARATELY from the Access-Control-Allow-Origin header
// set by `cors` above. With frontend (Vercel) and backend (Render) on
// different domains, that default silently blocks every response even
// though `cors` approved it — this line is the actual fix for that.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(express.json({ limit: "1mb" }));

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

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "GrowEasy backend is running",
    allowedOrigins,
  });
});

// API routes
app.use("/api/leads", importRoutes);

// Must remain last
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("Allowed CORS origins:", allowedOrigins);
});
