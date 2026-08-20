import pytest

from app.core.sql_guard import SqlValidationError, validate_read_only

ALLOWED = [
    "SELECT 1",
    "select id, name from users where active = true order by name limit 10",
    "SELECT * FROM orders o JOIN customers c ON c.id = o.customer_id",
    "WITH recent AS (SELECT * FROM orders WHERE created_at > now() - interval '7 days') SELECT count(*) FROM recent",
    "SELECT id FROM a UNION SELECT id FROM b",
    "(SELECT 1)",
    "SELECT 1;",
]

FORBIDDEN = [
    "INSERT INTO users (name) VALUES ('x')",
    "UPDATE users SET name = 'x' WHERE id = 1",
    "DELETE FROM users",
    "DROP TABLE users",
    "TRUNCATE users",
    "CREATE TABLE t (id int)",
    "ALTER TABLE users ADD COLUMN x int",
    "SELECT 1; DELETE FROM users",
    "WITH gone AS (DELETE FROM users RETURNING *) SELECT * FROM gone",
    "SELECT * INTO backup FROM users",
    "SELECT * FROM users FOR UPDATE",
    "SET search_path TO public",
    "",
    "   ",
    "this is not sql at all (",
]


@pytest.mark.parametrize("sql", ALLOWED)
def test_allows_read_only_queries(sql: str) -> None:
    assert validate_read_only(sql) == sql


@pytest.mark.parametrize("sql", FORBIDDEN)
def test_rejects_non_read_only_queries(sql: str) -> None:
    with pytest.raises(SqlValidationError):
        validate_read_only(sql)
