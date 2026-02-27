"""
Simple Mapepire WebSocket client using generated protocol types.

Connects to a mapepire-server, runs a SQL query, and prints the results.
Request models are built with Pydantic, serialized to JSON, and sent over
the WebSocket. Responses are validated back into typed Pydantic models.

Usage:
    cp .env.example .env   # fill in your credentials
    uv run python client.py
"""

from __future__ import annotations

import base64
import json
import os
import ssl
from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel
from websockets.sync.client import connect as ws_connect

# --- Request types (generated from JSON Schema) ---
from mapepire_protocol.requests.connect_request import (
    UconnectUrequest as ConnectRequest,
    Technique,
)
from mapepire_protocol.requests.sql_request import UsqlUrequest as SqlRequest
from mapepire_protocol.requests.exit_request import UexitUrequest as ExitRequest

# --- Response types (generated from JSON Schema) ---
from mapepire_protocol.responses.connect_response import (
    UconnectUresponse as ConnectResponse,
)
from mapepire_protocol.responses.query_result import Model as QueryResult

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

HOST = os.environ["MP_HOST"]
PORT = int(os.environ.get("MP_PORT", "8076"))
USER = os.environ["MP_USER"]
PASSWORD = os.environ["MP_PASSWORD"]

# ---------------------------------------------------------------------------
# Transport helpers
# ---------------------------------------------------------------------------

_msg_id = 0


def next_id() -> str:
    global _msg_id
    _msg_id += 1
    return str(_msg_id)


def send(ws, request: BaseModel) -> dict[str, Any]:
    """Send a typed request and return the raw JSON response."""
    payload = request.model_dump_json(exclude_none=True)
    print(f"  >> {payload}")
    ws.send(payload)
    raw = json.loads(ws.recv())
    print(f"  << {json.dumps(raw, indent=2)}\n")
    return raw


def build_ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def basic_auth(user: str, password: str) -> str:
    token = base64.b64encode(f"{user}:{password}".encode()).decode("ascii")
    return f"Basic {token}"


# ---------------------------------------------------------------------------
# Protocol helpers
# ---------------------------------------------------------------------------


def connect(ws) -> ConnectResponse:
    """Send a connect handshake and return the typed response."""
    raw = send(
        ws,
        ConnectRequest(
            id=next_id(),
            type="connect",
            technique=Technique.tcp,
            application="python-test-client",
        ),
    )
    if not raw.get("success"):
        raise RuntimeError(f"Connect failed: {raw.get('error')}")
    return ConnectResponse.model_validate(raw)


def query(ws, sql: str, rows: int = 100) -> QueryResult:
    """Execute a SQL statement and return the typed result."""
    raw = send(ws, SqlRequest(id=next_id(), type="sql", sql=sql, rows=rows))
    if not raw.get("success"):
        raise RuntimeError(
            f"Query failed: {raw.get('error')} "
            f"(sql_rc={raw.get('sql_rc')}, sql_state={raw.get('sql_state')})"
        )
    return QueryResult.model_validate(raw)


def disconnect(ws) -> None:
    """Send an exit request to close the server-side job."""
    send(ws, ExitRequest(id=next_id(), type="exit"))


def print_table(result: QueryResult) -> None:
    """Pretty-print a QueryResult as an ASCII table."""
    if not result.metadata or not result.data:
        print("(no results)")
        return

    columns = [c.name for c in result.metadata.columns]
    rows = result.data

    # Compute column widths from headers and data
    widths = {col: len(col) for col in columns}
    for row in rows:
        for col in columns:
            val = str(row.get(col, ""))
            widths[col] = max(widths[col], len(val))

    # Header
    header = " | ".join(col.ljust(widths[col]) for col in columns)
    separator = "-+-".join("-" * widths[col] for col in columns)
    print(header)
    print(separator)

    # Rows
    for row in rows:
        line = " | ".join(str(row.get(col, "")).ljust(widths[col]) for col in columns)
        print(line)

    print(f"\n{len(rows)} row(s), is_done: {result.is_done}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    uri = f"wss://{HOST}:{PORT}/db/"
    print(f"Connecting to {uri} ...\n")

    with ws_connect(
        uri,
        additional_headers={"Authorization": basic_auth(USER, PASSWORD)},
        ssl=build_ssl_context(),
    ) as ws:

        # 1. Connect
        conn = connect(ws)
        print(f"Job: {conn.job}\n")

        # 2. Query
        result = query(
            ws, "SELECT * FROM sample.employee FETCH FIRST 3 ROWS ONLY", rows=3
        )

        print_table(result)

        # 3. Disconnect
        print()
        disconnect(ws)
        print("Done.")


if __name__ == "__main__":
    main()
