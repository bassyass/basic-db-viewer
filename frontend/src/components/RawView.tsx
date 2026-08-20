import { useMemo, useState } from "react";
import type { QueryResult } from "../types";

interface Props {
  result: QueryResult;
}

export function RawView({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => {
    const records = result.rows.map((row) =>
      Object.fromEntries(result.columns.map((column, index) => [column, row[index]]))
    );
    return JSON.stringify(records, null, 2);
  }, [result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="raw-view">
      <button className="secondary-button copy-button" onClick={handleCopy}>
        {copied ? "Copied ✓" : "Copy JSON"}
      </button>
      <pre>{json}</pre>
    </div>
  );
}
