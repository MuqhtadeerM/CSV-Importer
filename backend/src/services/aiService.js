import { GoogleGenAI } from "@google/genai";

export const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

export const ALLOWED_CRM_STATUS = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

export const ALLOWED_DATA_SOURCE = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

// Lazily construct the client so a missing API key fails with a clear,
// controlled error at call time rather than crashing the whole process.
let _client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    console.log("[DEBUG] getClient: GEMINI_API_KEY is missing from env");
    const err = new Error(
      "AI provider is not configured. Set GEMINI_API_KEY in the backend .env file. " +
        "Get a free key at https://aistudio.google.com/app/apikey",
    );
    err.status = 500;
    throw err;
  }
  if (!_client) {
    console.log("[DEBUG] getClient: creating Gemini client (first call)");
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _client;
}

// gemini-3.5-flash is the current stable, free-tier eligible model (as of
// mid-2026). Note: gemini-2.5-flash was reported failing early with 404s in
// July 2026 ahead of its official Oct 2026 shutdown date, so we default to
// the newer generation to avoid that instability.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

function buildSystemPrompt() {
  return `You are a meticulous data-mapping engine for a CRM called GrowEasy.

You will be given a batch of raw CSV records. Each record was exported from an
UNKNOWN source (Facebook Lead Ads, Google Ads, Excel sheets, real-estate CRMs,
sales reports, marketing agency CSVs, manually created spreadsheets, etc). The
column names, casing, language, and structure vary wildly and are NOT fixed.

Your job: intelligently map each raw record's available fields onto the
GrowEasy CRM schema below, using context and reasoning, not just exact
string matching on header names (e.g. "Phone", "Contact No", "Mobile No.",
"WhatsApp Number" all likely map to mobile_without_country_code; "Full Name",
"Lead Name", "Customer" likely map to name).

## CRM SCHEMA (target output fields, per record)
- created_at: Lead creation date/time. MUST be a string parseable by
  JavaScript's \`new Date(created_at)\`. Prefer ISO-like "YYYY-MM-DD HH:mm:ss".
  If only a date is available, "YYYY-MM-DD" is fine. If no usable date
  exists, use an empty string "".
- name: Lead's full name.
- email: Primary email address (see multi-email rule below).
- country_code: Phone country code, formatted like "+91". Infer only when
  reasonably confident; otherwise "".
- mobile_without_country_code: Mobile number WITHOUT country code or
  symbols (digits only, e.g. "9876543210").
- company: Company / organization name.
- city / state / country: Location fields.
- lead_owner: The internal person/agent responsible for this lead (often an
  email address in the source data).
- crm_status: MUST be exactly one of: ${ALLOWED_CRM_STATUS.join(", ")}, or ""
  if nothing indicates status.
- crm_note: Free-text notes — remarks, follow-up notes, extra comments, ANY
  additional emails beyond the first, ANY additional phone numbers beyond
  the first, and anything else useful that doesn't map elsewhere. Combine
  multiple pieces with " | ".
- data_source: MUST be exactly one of: ${ALLOWED_DATA_SOURCE.join(", ")}, or
  "" if nothing confidently matches. Never guess loosely.
- possession_time: Property possession timeframe if real-estate related,
  else "".
- description: Any other descriptive context, else "".

## RULES
1. crm_status must ONLY ever be one of the allowed values above, or "".
2. data_source must ONLY ever be one of the allowed values above, or "".
3. created_at must always be "" or a value \`new Date(...)\` can parse.
4. Multiple emails: use the first as "email", append the rest into crm_note.
5. Multiple phones: use the first as mobile_without_country_code, append
   the rest into crm_note.
6. SKIP a record entirely (skipped: true) if it has NEITHER a usable email
   NOR a usable phone anywhere in its raw values. Do not skip for any other
   reason.
7. Never fabricate data — use "" for anything you can't determine, never
   null, never omit the key.
8. All text values must be single-line (replace internal newlines with a
   space) so the record stays a valid single CSV row.
9. Preserve the input order and row_index exactly.

## OUTPUT FORMAT
Respond with ONLY a raw JSON array (no markdown fences, no prose). One
object per input record, same order:

{
  "row_index": <number>,
  "skipped": <boolean>,
  "skip_reason": <string, "" if not skipped>,
  "record": {
    "created_at": "", "name": "", "email": "", "country_code": "",
    "mobile_without_country_code": "", "company": "", "city": "",
    "state": "", "country": "", "lead_owner": "", "crm_status": "",
    "crm_note": "", "data_source": "", "possession_time": "", "description": ""
  }
}`;
}

function buildUserPrompt(batch) {
  return `Map the following ${batch.length} raw CSV records to the GrowEasy CRM schema.
Return ONLY the JSON array described in the system instructions — nothing else.

INPUT RECORDS:
${JSON.stringify(batch)}`;
}

function safeJsonParse(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

/**
 * Calls Gemini to map one batch of raw records to the CRM schema.
 * @param {{row_index: number, raw: Record<string,string>}[]} batch
 * @returns {Promise<Array>} raw parsed AI output (unvalidated — caller must
 *   sanitize; see utils/batchProcessor.js)
 */
export async function extractBatchWithAI(batch) {
  console.log(
    `[DEBUG] extractBatchWithAI: sending batch of ${batch.length} rows to ${MODEL}`,
  );
  const client = getClient();

  let response;
  try {
    response = await client.models.generateContent({
      model: MODEL,
      contents: buildUserPrompt(batch),
      config: {
        systemInstruction: buildSystemPrompt(),
        temperature: 0,
        responseMimeType: "application/json",
      },
    });
  } catch (err) {
    // Surface Gemini's own error message (e.g. invalid key, quota exceeded)
    // clearly, rather than a generic SDK stack trace.
    console.log(
      `[DEBUG] extractBatchWithAI: Gemini API call failed -> ${err.message}`,
    );
    throw new Error(`Gemini API error: ${err.message}`);
  }

  const text = response.text;
  if (!text) {
    throw new Error("AI response contained no text content.");
  }

  let parsed;
  try {
    parsed = safeJsonParse(text);
  } catch (err) {
    console.log("[DEBUG] extractBatchWithAI: JSON parse failed. Raw text was:");
    console.log(text.slice(0, 500));
    throw new Error(`AI response was not valid JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON array as required.");
  }

  console.log(
    `[DEBUG] extractBatchWithAI: parsed ${parsed.length} mapped records`,
  );
  return parsed;
}
