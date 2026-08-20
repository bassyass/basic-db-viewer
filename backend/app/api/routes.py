"""HTTP layer. Translates requests to the guard/executor and errors to status codes."""
import psycopg
from fastapi import APIRouter, HTTPException

from app.core.sql_guard import SqlValidationError, validate_read_only
from app.db.executor import execute_read_query, fetch_schema
from app.models.schemas import QueryRequest, QueryResponse, SchemaResponse

router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/query", response_model=QueryResponse)
def run_query(request: QueryRequest) -> QueryResponse:
    try:
        sql = validate_read_only(request.sql)
    except SqlValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    try:
        return execute_read_query(sql)
    except psycopg.OperationalError as error:
        raise HTTPException(
            status_code=502, detail=f"Could not reach the database: {error}"
        ) from error
    except psycopg.Error as error:
        message = error.diag.message_primary if error.diag else str(error)
        raise HTTPException(status_code=400, detail=f"Database error: {message}") from error


@router.get("/schema", response_model=SchemaResponse)
def get_schema() -> SchemaResponse:
    try:
        return fetch_schema()
    except psycopg.OperationalError as error:
        raise HTTPException(
            status_code=502, detail=f"Could not reach the database: {error}"
        ) from error
