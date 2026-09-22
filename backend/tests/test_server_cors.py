"""CORS must only allow the origins listed in CORS_ORIGINS — never a wildcard."""

import importlib
import sys

import pytest
from fastapi.testclient import TestClient


def load_server(monkeypatch, cors_origins):
    monkeypatch.setenv("EMERGENT_LLM_KEY", "test-key")
    if cors_origins is None:
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ORIGINS", cors_origins)
    # server.py reads the env (and loads .env without overriding) at import time
    monkeypatch.setattr("dotenv.load_dotenv", lambda *a, **k: None)
    sys.modules.pop("server", None)
    return importlib.import_module("server")


def preflight(client, origin):
    return client.options(
        "/api/",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
    )


def test_listed_origins_are_allowed(monkeypatch):
    server = load_server(monkeypatch, "https://app.bond.test, https://admin.bond.test")
    client = TestClient(server.app)

    for origin in ("https://app.bond.test", "https://admin.bond.test"):
        resp = preflight(client, origin)
        assert resp.status_code == 200
        assert resp.headers["access-control-allow-origin"] == origin


@pytest.mark.parametrize("cors_origins", ["https://app.bond.test", None])
def test_unlisted_origins_are_rejected(monkeypatch, cors_origins):
    server = load_server(monkeypatch, cors_origins)
    client = TestClient(server.app)

    resp = preflight(client, "https://evil.example")

    assert resp.status_code == 400
    assert "access-control-allow-origin" not in resp.headers


def test_default_is_local_dev_only_not_wildcard(monkeypatch):
    server = load_server(monkeypatch, None)
    assert server.cors_origins == ["http://localhost:3000"]
