import type {
  ConnectionParams,
  QueryResult,
  SchemaResult,
  TestConnectionResult,
} from "../types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // keep the generic message
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

function post<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function runQuery(
  sql: string,
  connection: ConnectionParams | null
): Promise<QueryResult> {
  return post<QueryResult>("/api/query", { sql, connection });
}

export function fetchSchema(
  connection: ConnectionParams | null
): Promise<SchemaResult> {
  return post<SchemaResult>("/api/schema", { connection });
}

export function testConnection(
  connection: ConnectionParams | null
): Promise<TestConnectionResult> {
  return post<TestConnectionResult>("/api/connection/test", { connection });
}
