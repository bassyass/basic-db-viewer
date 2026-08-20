import type { ConnectionParams } from "./types";

const STORAGE_KEY = "basic-db-viewer.connection";

/** Persist connection settings across reloads. The password is deliberately
 *  never written to storage — it stays in memory and is re-entered after a
 *  page refresh. */
export function saveConnection(connection: ConnectionParams | null): void {
  if (connection === null) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const { password: _password, ...safe } = connection;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export function loadConnection(): ConnectionParams | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Omit<ConnectionParams, "password">;
    return { ...stored, password: "" };
  } catch {
    return null;
  }
}
