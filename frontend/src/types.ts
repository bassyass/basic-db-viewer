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
