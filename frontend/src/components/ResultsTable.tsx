"use client";

import { memo, useCallback, useMemo, useState } from "react";
import type { CrmRecord, SkippedRow } from "@/lib/types";

interface ResultsTableProps {
  imported: CrmRecord[];
  skipped: SkippedRow[];
  totalRows: number;
}

const CRM_COLUMNS: { key: keyof CrmRecord; label: string }[] = [
  { key: "created_at", label: "Created At" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Country Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Lead Owner" },
  { key: "crm_status", label: "Status" },
  { key: "crm_note", label: "Note" },
  { key: "data_source", label: "Source" },
  { key: "possession_time", label: "Possession Time" },
  { key: "description", label: "Description" },
];

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  DID_NOT_CONNECT:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  BAD_LEAD: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  SALE_DONE:
    "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
};

const ImportedRow = memo(function ImportedRow({
  record,
}: {
  record: CrmRecord;
}) {
  return (
    <tr className="odd:bg-white even:bg-slate-50 hover:bg-brand-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 dark:hover:bg-slate-800">
      {CRM_COLUMNS.map((col) => (
        <td
          key={col.key}
          className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300"
        >
          {col.key === "crm_status" && record[col.key] ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[record[col.key]] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {record[col.key]}
            </span>
          ) : (
            record[col.key] || (
              <span className="text-slate-300 dark:text-slate-600">—</span>
            )
          )}
        </td>
      ))}
    </tr>
  );
});

const SkippedRowItem = memo(function SkippedRowItem({
  row,
}: {
  row: SkippedRow;
}) {
  return (
    <tr className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50">
      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-500 dark:border-slate-800">
        {row.row_index + 1}
      </td>
      <td className="border-b border-slate-100 px-4 py-2 text-red-600 dark:border-slate-800 dark:text-red-400">
        {row.reason}
      </td>
      <td className="max-w-md truncate border-b border-slate-100 px-4 py-2 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {JSON.stringify(row.raw)}
      </td>
    </tr>
  );
});

function ResultsTableComponent({
  imported,
  skipped,
  totalRows,
}: ResultsTableProps) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  const showImported = useCallback(() => setTab("imported"), []);
  const showSkipped = useCallback(() => setTab("skipped"), []);

  const importedLabel = useMemo(
    () => `Imported (${imported.length})`,
    [imported.length],
  );
  const skippedLabel = useMemo(
    () => `Skipped (${skipped.length})`,
    [skipped.length],
  );

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Rows" value={totalRows} tone="slate" />
        <SummaryCard
          label="Successfully Imported"
          value={imported.length}
          tone="brand"
        />
        <SummaryCard label="Skipped" value={skipped.length} tone="red" />
      </div>

      <div className="mb-3 flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <TabButton
          active={tab === "imported"}
          onClick={showImported}
          label={importedLabel}
        />
        <TabButton
          active={tab === "skipped"}
          onClick={showSkipped}
          label={skippedLabel}
        />
      </div>

      {tab === "imported" ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="max-h-[520px] overflow-auto rounded-xl">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="sticky-thead bg-slate-100 dark:bg-slate-800">
                <tr>
                  {CRM_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imported.map((record, i) => (
                  <ImportedRow key={i} record={record} />
                ))}
                {imported.length === 0 && (
                  <tr>
                    <td
                      colSpan={CRM_COLUMNS.length}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No records were imported.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="max-h-[520px] overflow-auto rounded-xl">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="sticky-thead bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Row #
                  </th>
                  <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Reason
                  </th>
                  <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Raw Row
                  </th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((row) => (
                  <SkippedRowItem key={row.row_index} row={row} />
                ))}
                {skipped.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No rows were skipped. 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const SummaryCard = memo(function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "brand" | "red";
}) {
  const toneClasses = {
    slate: "text-slate-700 dark:text-slate-200",
    brand: "text-brand-600 dark:text-brand-400",
    red: "text-red-600 dark:text-red-400",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${toneClasses}`}>{value}</p>
    </div>
  );
});

const TabButton = memo(function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-brand-500 text-brand-600 dark:text-brand-400"
          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
});

export default memo(ResultsTableComponent);
