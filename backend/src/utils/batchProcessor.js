import pLimit from "p-limit";
import {
  extractBatchWithAI,
  CRM_FIELDS,
  ALLOWED_CRM_STATUS,
  ALLOWED_DATA_SOURCE,
} from "../services/aiService.js";

const BATCH_SIZE = parseInt(process.env.AI_BATCH_SIZE || "20", 10);
const CONCURRENCY = parseInt(process.env.AI_BATCH_CONCURRENCY || "3", 10);
const MAX_RETRIES = parseInt(process.env.AI_BATCH_MAX_RETRIES || "2", 10);

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size)
    chunks.push(array.slice(i, i + size));
  return chunks;
}

function isValidDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function hasEmail(raw) {
  return Object.values(raw).some(
    (v) => typeof v === "string" && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(v),
  );
}

function hasPhone(raw) {
  return Object.values(raw).some(
    (v) => typeof v === "string" && (v.match(/\d/g) || []).length >= 7,
  );
}

/**
 * Normalizes/validates a single AI-produced item against schema rules.
 * This is the safety net: even if the model returns something malformed,
 * a bad enum value, or an unparsable date, it never reaches the client.
 */
function sanitizeAiItem(item, originalRaw) {
  const record = { ...(item?.record || {}) };

  for (const field of CRM_FIELDS) {
    if (typeof record[field] !== "string") record[field] = "";
    record[field] = record[field].replace(/\r?\n/g, " ").trim();
  }

  if (!ALLOWED_CRM_STATUS.includes(record.crm_status)) record.crm_status = "";
  if (!ALLOWED_DATA_SOURCE.includes(record.data_source))
    record.data_source = "";
  if (record.created_at && !isValidDate(record.created_at))
    record.created_at = "";

  let skipped = !!item?.skipped;
  let skipReason = item?.skip_reason || "";

  // Enforce the skip rule server-side too, independent of the AI's decision.
  const emailPresent = !!record.email || hasEmail(originalRaw);
  const phonePresent =
    !!record.mobile_without_country_code || hasPhone(originalRaw);
  if (!emailPresent && !phonePresent) {
    skipped = true;
    skipReason = skipReason || "No email or mobile number found in record.";
  }

  return { skipped, skip_reason: skipReason, record };
}

async function processWithRetry(batch, attempt = 0) {
  try {
    return await extractBatchWithAI(batch);
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      return processWithRetry(batch, attempt + 1);
    }
    throw err;
  }
}

/**
 * Full pipeline: chunk raw records -> AI extraction (concurrent, retried)
 * -> validation -> aggregated results.
 * @param {Record<string,string>[]} records
 */
export async function processRecords(records) {
  const indexed = records.map((raw, row_index) => ({ row_index, raw }));
  const batches = chunk(indexed, BATCH_SIZE);
  const limit = pLimit(CONCURRENCY);

  const imported = [];
  const skipped = [];
  let failedBatches = 0;

  await Promise.all(
    batches.map((batch) =>
      limit(async () => {
        try {
          const aiResults = await processWithRetry(batch);
          const byIndex = new Map(aiResults.map((r) => [r.row_index, r]));

          for (const { row_index, raw } of batch) {
            const aiItem = byIndex.get(row_index);
            if (!aiItem) {
              skipped.push({
                row_index,
                reason: "AI did not return a result for this row.",
                raw,
              });
              continue;
            }
            const {
              skipped: isSkipped,
              skip_reason,
              record,
            } = sanitizeAiItem(aiItem, raw);
            if (isSkipped)
              skipped.push({ row_index, reason: skip_reason, raw });
            else imported.push({ row_index, record });
          }
        } catch (err) {
          failedBatches += 1;
          for (const { row_index, raw } of batch) {
            skipped.push({
              row_index,
              reason: `AI extraction failed for this batch: ${err.message}`,
              raw,
            });
          }
        }
      }),
    ),
  );

  imported.sort((a, b) => a.row_index - b.row_index);
  skipped.sort((a, b) => a.row_index - b.row_index);

  return {
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length,
    totalProcessed: records.length,
    failedBatches,
  };
}
