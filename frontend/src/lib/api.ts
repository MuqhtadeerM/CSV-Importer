import type { ImportResponse } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/**
 * Uploads the CSV to the backend for full AI-powered import.
 *
 * Accepts an optional AbortSignal so the caller (page.tsx) can cancel an
 * in-flight import if the user navigates away or starts a new one.
 */
export async function importLeadsFromCsv(
  file: File,
  signal?: AbortSignal,
): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/leads/import`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!res.ok) {
    let message = `Import failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse failure, keep default message
    }
    throw new Error(message);
  }

  return res.json();
}
