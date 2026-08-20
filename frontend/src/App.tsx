import { useCallback, useState } from "react";
import { runQuery } from "./api/client";
import { ConnectionDialog } from "./components/ConnectionDialog";
import { QueryEditor } from "./components/QueryEditor";
import { ResultsTable } from "./components/ResultsTable";
import { SchemaSidebar } from "./components/SchemaSidebar";
import { StatusBar } from "./components/StatusBar";
import { loadConnection, saveConnection } from "./connectionStorage";
import { downloadCsv } from "./utils/csv";
import type { ConnectionParams, QueryResult } from "./types";

function connectionLabel(connection: ConnectionParams | null): string {
  if (connection === null) return "Server default (.env)";
  return `${connection.username}@${connection.host}:${connection.port}/${connection.database}`;
}

export default function App() {
  const [sql, setSql] = useState("SELECT 1 AS hello");
  const [connection, setConnection] = useState<ConnectionParams | null>(loadConnection);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(() => {
    if (isRunning || !sql.trim()) return;
    setIsRunning(true);
    setError(null);
    runQuery(sql, connection)
      .then(setResult)
      .catch((cause: Error) => {
        setResult(null);
        setError(cause.message);
      })
      .finally(() => setIsRunning(false));
  }, [sql, connection, isRunning]);

  const handleInsert = useCallback((text: string) => {
    setSql((current) => (current.trim() ? `${current} ${text}` : text));
  }, []);

  const handleApplyConnection = useCallback((next: ConnectionParams | null) => {
    setConnection(next);
    saveConnection(next);
    setDialogOpen(false);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>basic-db-viewer</h1>
        <span className="read-only-badge" title="Writes are blocked at every layer">
          read-only
        </span>
        <button
          className="connection-button"
          title="Data source settings (host, port, user, SSL…)"
          onClick={() => setDialogOpen(true)}
        >
          ⚙ {connectionLabel(connection)}
        </button>
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
        <SchemaSidebar connection={connection} onInsert={handleInsert} />
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
      {dialogOpen && (
        <ConnectionDialog
          initial={connection}
          onApply={handleApplyConnection}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
