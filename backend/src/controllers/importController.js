import { parseCsv } from "../services/csvService.js";
import { processRecords } from "../utils/batchProcessor.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Hard safety cap — even though multer already limits file size to 10MB,
// a CSV of extremely short rows could still contain an unreasonable number
// of records. This protects against runaway AI cost/latency from a single
// request.
const MAX_ROWS = parseInt(process.env.MAX_CSV_ROWS || "5000", 10);

/**
 * POST /api/leads/preview
 * Parses the CSV and returns headers + a row preview. No AI call — used
 * for Step 2 (Preview) so parsing can be verified independently of AI
 * cost/latency, and so users can sanity-check the file before committing
 * to an AI-billed import.
 */
export const previewCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file was uploaded." });
  }

  const { headers, records } = parseCsv(req.file.buffer);

  res.json({
    filename: req.file.originalname,
    headers,
    totalRows: records.length,
    preview: records.slice(0, 50),
  });
});

/**
 * POST /api/leads/import
 * Parses the CSV and runs the full AI extraction pipeline (batched,
 * concurrent, retried, validated), returning structured CRM records. Only
 * ever called after explicit user confirmation on the frontend.
 */
export const importCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file was uploaded." });
  }

  const { headers, records } = parseCsv(req.file.buffer);

  if (records.length > MAX_ROWS) {
    return res.status(413).json({
      error: `CSV has ${records.length} rows, which exceeds the maximum of ${MAX_ROWS} rows per import.`,
    });
  }

  const result = await processRecords(records);

  res.json({
    sourceHeaders: headers,
    totalRows: records.length,
    totalImported: result.totalImported,
    totalSkipped: result.totalSkipped,
    failedBatches: result.failedBatches,
    imported: result.imported.map((i) => i.record),
    skipped: result.skipped.map((s) => ({
      row_index: s.row_index,
      reason: s.reason,
      raw: s.raw,
    })),
  });
});
