import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import importRoutes from "./routes/importRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8080;

// --- Security middleware ---
app.use(helmet());
app.use(
  cors({
    // Lock CORS to a configured origin in production; defaults to allow-all
    // for local dev convenience.
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
app.use(express.json({ limit: "1mb" })); // JSON bodies are small in this app; CSVs go via multipart

// Rate-limit the AI-calling endpoint specifically — it's the expensive one
// (external API cost + latency) and the most attractive target for abuse.
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 import requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many import requests. Please try again later." },
});
app.use("/api/leads/import", importLimiter);

// --- Routes ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "GrowEasy backend is running" });
});

app.use("/api/leads", importRoutes);

// --- 404 + centralized error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
