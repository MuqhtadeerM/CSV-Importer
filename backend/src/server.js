import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import importRoutes from "./routes/importRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, curl, and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      const error = new Error(`CORS blocked origin: ${origin}`);
      error.status = 403;
      return callback(error);
    },
  }),
);

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

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "GrowEasy backend is running",
  });
});

app.use("/api/leads", importRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
