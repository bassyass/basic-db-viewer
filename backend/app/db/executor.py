"""Database access layer.

Every connection is opened read-only (defense layer 2 of 4 — see README):
`default_transaction_read_only=on` makes PostgreSQL itself reject any write,
independently of what the application-level SQL guard allows through.
"""
import time
from typing import Any

import psycopg

from app.config import get_settings
from app.models.schemas import ColumnInfo, QueryResponse, SchemaResponse, TableInfo

_SCHEMA_QUERY = """
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, ordinal_position
"""


def _connect() -> psycopg.Connection:
    settings = get_settings()
    options = (
        "-c default_transaction_read_only=on "
        f"-c statement_timeout={settings.statement_timeout_ms}"
    )
    connection = psycopg.connect(
        settings.database_url,
        options=options,
        connect_timeout=settings.connect_timeout_s,
        application_name="basic-db-viewer",
    )
    connection.read_only = True
    return connection


def _jsonable(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    return str(value)


def execute_read_query(sql: str) -> QueryResponse:
    """Run an already-validated SELECT and return a JSON-safe result."""
    settings = get_settings()
    started = time.perf_counter()
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            if cursor.description is None:
                columns: list[str] = []
                raw_rows: list[tuple] = []
            else:
                columns = [column.name for column in cursor.description]
                raw_rows = cursor.fetchmany(settings.max_rows + 1)
    duration_ms = (time.perf_counter() - started) * 1000

    truncated = len(raw_rows) > settings.max_rows
    rows = [[_jsonable(value) for value in row] for row in raw_rows[: settings.max_rows]]
    return QueryResponse(
        columns=columns,
        rows=rows,
        row_count=len(rows),
        truncated=truncated,
        duration_ms=round(duration_ms, 1),
    )


def fetch_schema() -> SchemaResponse:
    """List user tables and their columns for the sidebar."""
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(_SCHEMA_QUERY)
            rows = cursor.fetchall()

    tables: dict[tuple[str, str], TableInfo] = {}
    for schema_name, table_name, column_name, data_type in rows:
        key = (schema_name, table_name)
        if key not in tables:
            tables[key] = TableInfo(schema_name=schema_name, name=table_name, columns=[])
        tables[key].columns.append(ColumnInfo(name=column_name, data_type=data_type))
    return SchemaResponse(tables=list(tables.values()))
