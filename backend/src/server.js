import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import importRoutes from "./routes/importRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Allow local development + deployed Vercel frontend
const allowedOrigins = [
  "http://localhost:3000",
  "https://csv-importer-zeta-lilac.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Incoming request origin:", origin);

    // Allow Postman, curl, server-to-server requests
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

app.use(helmet());

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
