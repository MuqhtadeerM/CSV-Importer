import { Router } from "express";
import multer from "multer";

const router = Router();

// Keep the file in memory (as a Buffer) rather than writing to disk —
// we don't need persistence, just the raw bytes to parse in the next step.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      return cb(new Error("Only .csv files are accepted."));
    }
    cb(null, true);
  },
});

// POST /api/leads/upload
// field name must be "file". Just confirms the upload arrived — no CSV
// parsing or AI happens here yet (that's Step 3+).
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }

  res.json({
    message: "File received successfully.",
    filename: req.file.originalname,
    sizeBytes: req.file.size,
    mimetype: req.file.mimetype,
  });
});

export default router;
