"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";

import FileUpload from "@/components/FileUpload";
import StepIndicator from "@/components/StepIndicator";
import { importLeadsFromCsv } from "@/lib/api";
import type { AppStep, ImportResponse, RawRow } from "@/lib/types";

const CsvPreviewTable = dynamic(() => import("@/components/CsvPreviewTable"), {
  loading: () => (
    <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
  ),
});
const ResultsTable = dynamic(() => import("@/components/ResultsTable"), {
  loading: () => (
    <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
  ),
});

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<RawRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleFileSelected = useCallback((selected: File) => {
    setUploadError(null);
    setFile(selected);

    Papa.parse<RawRow>(selected, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: (parsed) => {
        if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
          setUploadError("Could not detect any columns in this CSV.");
          return;
        }
        setHeaders(parsed.meta.fields);
        setPreviewRows(parsed.data.slice(0, 50));
        setTotalRows(parsed.data.length);
        setStep("preview");
      },
      error: (err: Error) => {
        setUploadError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setImportError(null);
    setStep("processing");
    try {
      const response = await importLeadsFromCsv(file, controller.signal);
      setResult(response);
      setStep("results");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setImportError(err instanceof Error ? err.message : "Import failed.");
      setStep("preview");
    }
  }, [file]);

  const handleReset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setPreviewRows([]);
    setTotalRows(0);
    setUploadError(null);
    setImportError(null);
    setResult(null);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
            G
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            GrowEasy
          </h1>
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">
            AI CSV Lead Importer
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Upload a CSV from any lead source — Facebook, Google Ads, Excel, a
          real-estate CRM export, or a manually built sheet — and AI will map it
          into the GrowEasy CRM format for you.
        </p>
      </header>

      <StepIndicator current={step} />

      {step === "upload" && (
        <section className="mx-auto max-w-2xl">
          <FileUpload onFileSelected={handleFileSelected} error={uploadError} />
        </section>
      )}

      {step === "preview" && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg
                className="h-5 w-5 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-medium">{file?.name}</span>
              <span className="text-slate-400">
                ({((file?.size || 0) / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={handleReset}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Cancel &amp; choose a different file
            </button>
          </div>

          <CsvPreviewTable
            headers={headers}
            rows={previewRows}
            totalRows={totalRows}
          />

          {importError && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {importError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
            >
              Confirm &amp; Import with AI
            </button>
          </div>
        </section>
      )}

      {step === "processing" && (
        <section className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
            AI is mapping your leads into GrowEasy CRM format…
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This can take a little while for large files — records are processed
            in batches.
          </p>
        </section>
      )}

      {step === "results" && result && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Import complete for{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {file?.name}
              </span>
              {result.failedBatches > 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  ({result.failedBatches} batch(es) had errors — affected rows
                  were marked as skipped)
                </span>
              )}
            </p>
            <button
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Import another file
            </button>
          </div>

          <ResultsTable
            imported={result.imported}
            skipped={result.skipped}
            totalRows={result.totalRows}
          />
        </section>
      )}
    </main>
  );
}
