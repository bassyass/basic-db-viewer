import type { QueryResult } from "../types";

interface Props {
  result: QueryResult;
}

export function StatusBar({ result }: Props) {
  return (
    <div className="status-bar">
      <span>
        {result.rowCount} row{result.rowCount === 1 ? "" : "s"}
      </span>
      <span>{result.durationMs} ms</span>
      {result.truncated && (
        <span className="truncated-warning">
          Result truncated — add a LIMIT or narrow your query to see everything.
        </span>
      )}
    </div>
  );
}
