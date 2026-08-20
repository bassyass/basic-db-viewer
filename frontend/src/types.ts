export type SslMode =
  | "disable"
  | "allow"
  | "prefer"
  | "require"
  | "verify-ca"
  | "verify-full";

export interface ConnectionParams {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslMode: SslMode;
  sslRootCert: string | null;
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  truncated: boolean;
  durationMs: number;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
}

export interface TableInfo {
  schemaName: string;
  name: string;
  columns: ColumnInfo[];
}

export interface SchemaResult {
  tables: TableInfo[];
}
