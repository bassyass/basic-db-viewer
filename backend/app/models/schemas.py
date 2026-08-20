"""API request/response models. Serialized to camelCase for the frontend."""
from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ConnectionParams(CamelModel):
    host: str
    port: int = 5432
    database: str
    username: str
    password: str = ""
    ssl_mode: str = "prefer"
    ssl_root_cert: str | None = None


class QueryRequest(CamelModel):
    sql: str
    connection: ConnectionParams | None = None


class SchemaRequest(CamelModel):
    connection: ConnectionParams | None = None


class TestConnectionRequest(CamelModel):
    connection: ConnectionParams | None = None


class TestConnectionResponse(CamelModel):
    ok: bool
    message: str


class QueryResponse(CamelModel):
    columns: list[str]
    rows: list[list[Any]]
    row_count: int
    truncated: bool
    duration_ms: float


class ColumnInfo(CamelModel):
    name: str
    data_type: str


class TableInfo(CamelModel):
    schema_name: str
    name: str
    columns: list[ColumnInfo]


class SchemaResponse(CamelModel):
    tables: list[TableInfo]
