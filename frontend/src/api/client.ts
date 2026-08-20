import type { QueryResult, SchemaResult } from "../types";

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

export function runQuery(sql: string): Promise<QueryResult> {
  return request<QueryResult>("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
}

export function fetchSchema(): Promise<SchemaResult> {
  return request<SchemaResult>("/api/schema");
}
