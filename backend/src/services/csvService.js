import { parse } from "csv-parse/sync";

/**
 * Parses a raw CSV buffer/string into an array of plain-object records.
 * Makes NO assumption about column names — whatever headers exist in row 1
 * become the object keys, verbatim (trimmed). Field mapping to the CRM
 * schema happens later, in the AI layer (Step 4+).
 *
 * @param {Buffer|string} csvContent
 * @returns {{ headers: string[], records: Record<string, string>[] }}
 */
export function parseCsv(csvContent) {
  const content = Buffer.isBuffer(csvContent)
    ? csvContent.toString("utf-8")
    : csvContent;

  // Strip BOM if present (common in Excel-exported CSVs)
  const cleaned = content.replace(/^\uFEFF/, "");

  let records;
  try {
    records = parse(cleaned, {
      columns: (headerRow) => headerRow.map((h) => (h || "").trim()),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // tolerate ragged rows from messy exports
      bom: true,
    });
  } catch (err) {
    const error = new Error(`Failed to parse CSV: ${err.message}`);
    error.status = 400;
    throw error;
  }

  if (!records || records.length === 0) {
    const error = new Error(
      "CSV appears to be empty or has no parsable data rows.",
    );
    error.status = 400;
    throw error;
  }

  const headers = Object.keys(records[0]);

  return { headers, records };
}
