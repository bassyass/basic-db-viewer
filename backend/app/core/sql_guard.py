"""Read-only SQL validation.

This is the application-level guard (defense layer 3 of 4 — see README).
It parses the query with sqlglot and rejects anything that is not a single,
plain SELECT statement. The database role permissions and the read-only
connection settings remain the authoritative layers underneath.
"""
import sqlglot
from sqlglot import exp
from sqlglot.errors import ParseError


class SqlValidationError(ValueError):
    """Raised when a query is not a single read-only SELECT statement."""


_ALLOWED_TOP_LEVEL = (exp.Select, exp.Union)  # Union covers UNION / INTERSECT / EXCEPT

_FORBIDDEN_ANYWHERE = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Merge,
    exp.Create,
    exp.Drop,
    exp.Alter,
    exp.Command,  # SET, COPY, VACUUM, EXPLAIN and other unmodeled commands
)


def _unwrap(statement: exp.Expression) -> exp.Expression:
    """Strip redundant outer parentheses, e.g. `(SELECT 1)`."""
    while isinstance(statement, (exp.Subquery, exp.Paren)) and statement.this is not None:
        statement = statement.this
    return statement


def validate_read_only(sql: str) -> str:
    """Return the query unchanged if it is a single read-only SELECT, else raise."""
    if not sql or not sql.strip():
        raise SqlValidationError("Query is empty.")

    try:
        statements = [s for s in sqlglot.parse(sql, read="postgres") if s is not None]
    except ParseError as error:
        raise SqlValidationError(f"Could not parse SQL: {error}") from error

    if len(statements) == 0:
        raise SqlValidationError("Query is empty.")
    if len(statements) > 1:
        raise SqlValidationError("Only a single statement is allowed.")

    statement = _unwrap(statements[0])

    if not isinstance(statement, _ALLOWED_TOP_LEVEL):
        raise SqlValidationError(
            "Only SELECT queries are allowed. This viewer is strictly read-only."
        )

    if statement.args.get("into") is not None:
        raise SqlValidationError("SELECT INTO creates a table and is not allowed.")

    if statement.args.get("locks"):
        raise SqlValidationError("Locking clauses (FOR UPDATE / FOR SHARE) are not allowed.")

    for forbidden in _FORBIDDEN_ANYWHERE:
        node = statement.find(forbidden)
        if node is not None:
            raise SqlValidationError(
                f"Statement contains a forbidden {node.key.upper()} operation. "
                "This viewer is strictly read-only."
            )

    return sql
