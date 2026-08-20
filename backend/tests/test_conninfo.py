import pytest

from app.db.executor import ConnectionConfigError, build_conninfo
from app.models.schemas import ConnectionParams


def make_params(**overrides) -> ConnectionParams:
    defaults = dict(
        host="db.example.com",
        port=5433,
        database="sales",
        username="viewer",
        password="s3cret",
    )
    defaults.update(overrides)
    return ConnectionParams(**defaults)


def test_builds_conninfo_from_params() -> None:
    conninfo = build_conninfo(make_params())
    assert "host=db.example.com" in conninfo
    assert "port=5433" in conninfo
    assert "dbname=sales" in conninfo
    assert "user=viewer" in conninfo
    assert "password=s3cret" in conninfo
    assert "sslmode=prefer" in conninfo


def test_includes_ssl_root_cert_when_given() -> None:
    conninfo = build_conninfo(
        make_params(ssl_mode="verify-full", ssl_root_cert="/certs/ca.pem")
    )
    assert "sslmode=verify-full" in conninfo
    assert "sslrootcert=/certs/ca.pem" in conninfo


def test_omits_empty_password() -> None:
    conninfo = build_conninfo(make_params(password=""))
    assert "password" not in conninfo


def test_rejects_invalid_ssl_mode() -> None:
    with pytest.raises(ConnectionConfigError):
        build_conninfo(make_params(ssl_mode="yes-please"))


def test_falls_back_to_database_url_without_params() -> None:
    assert build_conninfo(None)  # returns the configured DATABASE_URL
