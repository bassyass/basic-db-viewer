import { useCallback, useState } from "react";
import { runQuery } from "./api/client";
import { QueryEditor } from "./components/QueryEditor";
import { ResultsTable } from "./components/ResultsTable";
import { SchemaSidebar } from "./components/SchemaSidebar";
import { StatusBar } from "./components/StatusBar";
import { downloadCsv } from "./utils/csv";
import type { QueryResult } from "./types";

export default function App() {
  const [sql, setSql] = useState("SELECT 1 AS hello");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(() => {
    if (isRunning || !sql.trim()) return;
    setIsRunning(true);
    setError(null);
    runQuery(sql)
      .then(setResult)
      .catch((cause: Error) => {
        setResult(null);
        setError(cause.message);
      })
      .finally(() => setIsRunning(false));
  }, [sql, isRunning]);

  const handleInsert = useCallback((text: string) => {
    setSql((current) => (current.trim() ? `${current} ${text}` : text));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>basic-db-viewer</h1>
        <span className="read-only-badge" title="Writes are blocked at every layer">
          read-only
        </span>
        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={() => result && downloadCsv(result)}
            disabled={!result || result.rowCount === 0}
          >
            Export CSV
          </button>
          <button className="run-button" onClick={handleRun} disabled={isRunning}>
            {isRunning ? "Running…" : "Run (Ctrl+Enter)"}
          </button>
        </div>
      </header>
      <div className="body">
        <SchemaSidebar onInsert={handleInsert} />
        <main className="main">
          <QueryEditor value={sql} onChange={setSql} onRun={handleRun} />
          {error && <div className="error-banner">{error}</div>}
          {result && (
            <>
              <StatusBar result={result} />
              <ResultsTable result={result} />
            </>
          )}
          {!result && !error && (
            <p className="empty-state">Write a SELECT query and press Run.</p>
          )}
        </main>
      </div>
    </div>
  );
}
