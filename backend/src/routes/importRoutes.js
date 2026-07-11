import { Router } from "express";
import multer from "multer";
import { previewCsv, importCsv } from "../controllers/importController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — also guards against DoS via huge uploads
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) return cb(new Error("Only .csv files are accepted."));
    cb(null, true);
  },
});

router.post("/preview", upload.single("file"), previewCsv);
router.post("/import", upload.single("file"), importCsv);

export default router;
