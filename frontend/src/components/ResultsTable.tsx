import { useMemo, useState } from "react";
import type { QueryResult } from "../types";

interface Props {
  result: QueryResult;
}

type SortDirection = "asc" | "desc";

function compareValues(a: unknown, b: unknown): number {
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export function ResultsTable({ result }: Props) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const rows = useMemo(() => {
    if (sortColumn === null) return result.rows;
    const sorted = [...result.rows].sort((a, b) =>
      compareValues(a[sortColumn], b[sortColumn])
    );
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [result.rows, sortColumn, sortDirection]);

  const handleSort = (index: number) => {
    if (sortColumn === index) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(index);
      setSortDirection("asc");
    }
  };

  if (result.columns.length === 0) {
    return <p className="empty-state">The query returned no columns.</p>;
  }

  return (
    <div className="results-scroll">
      <table>
        <thead>
          <tr>
            {result.columns.map((column, index) => (
              <th key={`${column}-${index}`} onClick={() => handleSort(index)}>
                {column}
                {sortColumn === index && (
                  <span className="sort-indicator">
                    {sortDirection === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, cellIndex) => (
                <td key={cellIndex}>
                  {value === null ? (
                    <span className="null-value">NULL</span>
                  ) : (
                    String(value)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
