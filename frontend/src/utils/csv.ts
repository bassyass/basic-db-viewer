import type { QueryResult } from "../types";

function escapeCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function downloadCsv(result: QueryResult, filename = "query-result.csv"): void {
  const lines = [
    result.columns.map(escapeCell).join(","),
    ...result.rows.map((row) => row.map(escapeCell).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
