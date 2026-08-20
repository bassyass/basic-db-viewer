import { useEffect, useState } from "react";
import { fetchSchema } from "../api/client";
import type { ConnectionParams, TableInfo } from "../types";

interface Props {
  connection: ConnectionParams | null;
  onInsert: (text: string) => void;
}

function qualifiedName(table: TableInfo): string {
  return table.schemaName === "public"
    ? table.name
    : `${table.schemaName}.${table.name}`;
}

export function SchemaSidebar({ connection, onInsert }: Props) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setError(null);
    fetchSchema(connection)
      .then((schema) => setTables(schema.tables))
      .catch((cause: Error) => {
        setTables([]);
        setError(cause.message);
      });
  }, [connection]);

  const toggle = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <aside className="sidebar">
      <h2>Tables</h2>
      {error && <p className="sidebar-error">{error}</p>}
      {!error && tables.length === 0 && <p className="empty-state">No tables found.</p>}
      <ul>
        {tables.map((table) => {
          const key = `${table.schemaName}.${table.name}`;
          const isOpen = expanded.has(key);
          return (
            <li key={key}>
              <div className="table-row">
                <button
                  className="expand-button"
                  onClick={() => toggle(key)}
                  aria-label={isOpen ? "Collapse columns" : "Expand columns"}
                >
                  {isOpen ? "▾" : "▸"}
                </button>
                <button
                  className="table-name"
                  title="Insert into query"
                  onClick={() => onInsert(qualifiedName(table))}
                >
                  {qualifiedName(table)}
                </button>
              </div>
              {isOpen && (
                <ul className="columns">
                  {table.columns.map((column) => (
                    <li key={column.name}>
                      <button
                        className="column-name"
                        title="Insert into query"
                        onClick={() => onInsert(column.name)}
                      >
                        {column.name}
                        <span className="column-type">{column.dataType}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
