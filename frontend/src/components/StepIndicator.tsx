"use client";

import { memo } from "react";
import type { AppStep } from "@/lib/types";

const STEPS: { key: AppStep; label: string }[] = [
  { key: "upload", label: "Upload CSV" },
  { key: "preview", label: "Preview" },
  { key: "processing", label: "AI Import" },
  { key: "results", label: "Results" },
];

function StepIndicatorComponent({ current }: { current: AppStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="mb-8 flex w-full items-center">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <li
            key={step.key}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold
                  ${
                    isDone
                      ? "bg-brand-500 text-white"
                      : isActive
                        ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500 dark:bg-brand-500/20 dark:text-brand-300"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isActive
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-3 h-0.5 flex-1 rounded ${
                  isDone ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default memo(StepIndicatorComponent);
