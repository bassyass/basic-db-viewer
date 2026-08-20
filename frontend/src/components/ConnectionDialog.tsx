import { useState } from "react";
import { testConnection } from "../api/client";
import type { ConnectionParams, SslMode } from "../types";

interface Props {
  initial: ConnectionParams | null;
  onApply: (connection: ConnectionParams | null) => void;
  onClose: () => void;
}

const SSL_MODES: SslMode[] = [
  "disable",
  "allow",
  "prefer",
  "require",
  "verify-ca",
  "verify-full",
];

const EMPTY: ConnectionParams = {
  host: "localhost",
  port: 5432,
  database: "",
  username: "",
  password: "",
  sslMode: "prefer",
  sslRootCert: null,
};

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "done"; ok: boolean; message: string };

export function ConnectionDialog({ initial, onApply, onClose }: Props) {
  const [form, setForm] = useState<ConnectionParams>(initial ?? EMPTY);
  const [test, setTest] = useState<TestState>({ status: "idle" });

  const update = (patch: Partial<ConnectionParams>) => {
    setForm((current) => ({ ...current, ...patch }));
    setTest({ status: "idle" });
  };

  const handleTest = () => {
    setTest({ status: "testing" });
    testConnection(form)
      .then((result) =>
        setTest({ status: "done", ok: result.ok, message: result.message })
      )
      .catch((cause: Error) =>
        setTest({ status: "done", ok: false, message: cause.message })
      );
  };

  const canApply = form.host.trim() !== "" && form.database.trim() !== "";
  const needsCaCert = form.sslMode === "verify-ca" || form.sslMode === "verify-full";

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-label="Data source settings"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Data Source — PostgreSQL</h2>

        <div className="form-section">
          <h3>General</h3>
          <div className="form-grid">
            <label htmlFor="conn-host">Host</label>
            <div className="host-port">
              <input
                id="conn-host"
                value={form.host}
                onChange={(event) => update({ host: event.target.value })}
                placeholder="localhost"
                autoFocus
              />
              <label htmlFor="conn-port" className="inline-label">
                Port
              </label>
              <input
                id="conn-port"
                className="port-input"
                type="number"
                min={1}
                max={65535}
                value={form.port}
                onChange={(event) =>
                  update({ port: Number(event.target.value) || 5432 })
                }
              />
            </div>

            <label htmlFor="conn-database">Database</label>
            <input
              id="conn-database"
              value={form.database}
              onChange={(event) => update({ database: event.target.value })}
              placeholder="your_database"
            />

            <label htmlFor="conn-user">User</label>
            <input
              id="conn-user"
              value={form.username}
              onChange={(event) => update({ username: event.target.value })}
              placeholder="dbviewer_readonly"
            />

            <label htmlFor="conn-password">Password</label>
            <input
              id="conn-password"
              type="password"
              value={form.password}
              onChange={(event) => update({ password: event.target.value })}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>SSL</h3>
          <div className="form-grid">
            <label htmlFor="conn-sslmode">SSL mode</label>
            <select
              id="conn-sslmode"
              value={form.sslMode}
              onChange={(event) => update({ sslMode: event.target.value as SslMode })}
            >
              {SSL_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>

            <label htmlFor="conn-cacert">CA certificate</label>
            <input
              id="conn-cacert"
              value={form.sslRootCert ?? ""}
              onChange={(event) =>
                update({ sslRootCert: event.target.value || null })
              }
              placeholder="/certs/ca.pem (path on the server)"
            />
          </div>
          {needsCaCert && !form.sslRootCert && (
            <p className="form-hint">
              {form.sslMode} verifies the server certificate — set the CA
              certificate path above (as seen by the backend, e.g. /certs/ca.pem
              when using Docker).
            </p>
          )}
        </div>

        {test.status === "done" && (
          <p className={test.ok ? "test-success" : "test-failure"}>
            {test.ok ? "✓ " : "✗ "}
            {test.message}
          </p>
        )}

        <div className="dialog-actions">
          <button
            className="secondary-button"
            onClick={handleTest}
            disabled={test.status === "testing" || !canApply}
          >
            {test.status === "testing" ? "Testing…" : "Test Connection"}
          </button>
          <span className="dialog-actions-spacer" />
          {initial !== null && (
            <button
              className="secondary-button"
              title="Go back to the server's .env connection"
              onClick={() => onApply(null)}
            >
              Use server default
            </button>
          )}
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="run-button"
            onClick={() => onApply(form)}
            disabled={!canApply}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
