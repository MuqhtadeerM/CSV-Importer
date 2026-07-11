"use client";

import { memo, useMemo } from "react";
import type { RawRow } from "@/lib/types";

interface CsvPreviewTableProps {
  headers: string[];
  rows: RawRow[];
  totalRows: number;
}

const PreviewRow = memo(function PreviewRow({
  row,
  headers,
}: {
  row: RawRow;
  headers: string[];
}) {
  return (
    <tr className="odd:bg-white even:bg-slate-50 hover:bg-brand-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 dark:hover:bg-slate-800">
      {headers.map((h) => (
        <td
          key={h}
          className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300"
        >
          {row[h] || (
            <span className="text-slate-300 dark:text-slate-600">—</span>
          )}
        </td>
      ))}
    </tr>
  );
});

function CsvPreviewTableComponent({
  headers,
  rows,
  totalRows,
}: CsvPreviewTableProps) {
  const columnCount = useMemo(() => headers.length, [headers]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Preview
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing {rows.length} of {totalRows} rows &middot; {columnCount}{" "}
          columns detected
        </span>
      </div>
      <div className="max-h-[420px] overflow-auto rounded-b-xl">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky-thead bg-slate-100 dark:bg-slate-800">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  {h || <span className="italic text-slate-400">(blank)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <PreviewRow key={i} row={row} headers={headers} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(CsvPreviewTableComponent);
