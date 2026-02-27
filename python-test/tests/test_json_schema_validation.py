"""
Test the README instructions for validating messages using jsonschema
against the generated JSON Schema files.
"""

import json
from pathlib import Path

import pytest
from jsonschema import validate, ValidationError

SCHEMA_DIR = Path(__file__).parent.parent.parent / "schemas"


def load_schema(name: str) -> dict:
    return json.loads((SCHEMA_DIR / name).read_text())


# ---------------------------------------------------------------------------
# Request validation
# ---------------------------------------------------------------------------


class TestRequestValidation:
    """Validate outgoing requests against JSON Schema files."""

    def test_sql_request_valid(self):
        schema = load_schema("requests/sql-request.json")
        request = {
            "id": "1",
            "type": "sql",
            "sql": "SELECT * FROM MYLIB.MYTABLE",
            "rows": 100,
        }
        validate(instance=request, schema=schema)

    def test_sql_request_minimal(self):
        schema = load_schema("requests/sql-request.json")
        request = {"id": "1", "type": "sql", "sql": "SELECT 1"}
        validate(instance=request, schema=schema)

    def test_sql_request_rejects_missing_sql(self):
        schema = load_schema("requests/sql-request.json")
        with pytest.raises(ValidationError, match="'sql' is a required property"):
            validate(instance={"id": "1", "type": "sql"}, schema=schema)

    def test_sql_request_rejects_zero_rows(self):
        schema = load_schema("requests/sql-request.json")
        with pytest.raises(ValidationError):
            validate(
                instance={"id": "1", "type": "sql", "sql": "SELECT 1", "rows": 0},
                schema=schema,
            )

    def test_connect_request_valid(self):
        schema = load_schema("requests/connect-request.json")
        request = {
            "id": "1",
            "type": "connect",
            "technique": "tcp",
            "props": "naming=system;libraries=MYLIB",
            "application": "my-app",
        }
        validate(instance=request, schema=schema)

    def test_connect_request_rejects_invalid_technique(self):
        schema = load_schema("requests/connect-request.json")
        with pytest.raises(ValidationError):
            validate(
                instance={"id": "1", "type": "connect", "technique": "invalid"},
                schema=schema,
            )

    def test_prepare_sql_execute_request(self):
        schema = load_schema("requests/prepare-sql-execute-request.json")
        request = {
            "id": "4",
            "type": "prepare_sql_execute",
            "sql": "INSERT INTO T VALUES(?, ?)",
            "parameters": [1, "hello"],
        }
        validate(instance=request, schema=schema)

    def test_execute_request(self):
        schema = load_schema("requests/execute-request.json")
        request = {
            "id": "5",
            "type": "execute",
            "cont_id": "3",
            "parameters": [42],
            "rows": 500,
        }
        validate(instance=request, schema=schema)

    def test_sqlmore_request(self):
        schema = load_schema("requests/sql-more-request.json")
        request = {"id": "6", "type": "sqlmore", "cont_id": "2", "rows": 100}
        validate(instance=request, schema=schema)

    def test_sqlclose_request(self):
        schema = load_schema("requests/sql-close-request.json")
        request = {"id": "7", "type": "sqlclose", "cont_id": "2"}
        validate(instance=request, schema=schema)

    def test_cl_request(self):
        schema = load_schema("requests/cl-request.json")
        request = {"id": "8", "type": "cl", "cmd": "CRTLIB LIB(TESTLIB)"}
        validate(instance=request, schema=schema)

    def test_dove_request(self):
        schema = load_schema("requests/dove-request.json")
        request = {
            "id": "9",
            "type": "dove",
            "sql": "SELECT * FROM T",
            "run": True,
        }
        validate(instance=request, schema=schema)

    def test_ping_request(self):
        schema = load_schema("requests/ping-request.json")
        validate(instance={"id": "10", "type": "ping"}, schema=schema)

    def test_setconfig_request(self):
        schema = load_schema("requests/set-config-request.json")
        request = {
            "id": "13",
            "type": "setconfig",
            "tracedest": "FILE",
            "tracelevel": "DATASTREAM",
        }
        validate(instance=request, schema=schema)

    def test_setconfig_rejects_invalid_tracelevel(self):
        schema = load_schema("requests/set-config-request.json")
        with pytest.raises(ValidationError):
            validate(
                instance={"id": "13", "type": "setconfig", "tracelevel": "VERBOSE"},
                schema=schema,
            )

    def test_exit_request(self):
        schema = load_schema("requests/exit-request.json")
        validate(instance={"id": "15", "type": "exit"}, schema=schema)

    def test_all_request_schemas_are_loadable(self):
        """Every .json file in schemas/requests/ should parse as valid JSON Schema."""
        request_dir = SCHEMA_DIR / "requests"
        for schema_file in sorted(request_dir.glob("*.json")):
            schema = json.loads(schema_file.read_text())
            assert schema.get("type") == "object", f"{schema_file.name} missing type"
            assert "properties" in schema, f"{schema_file.name} missing properties"


# ---------------------------------------------------------------------------
# Response validation
# ---------------------------------------------------------------------------


class TestResponseValidation:
    """Validate incoming server responses against JSON Schema files."""

    def test_connect_response(self):
        schema = load_schema("responses/connect-response.json")
        response = {
            "id": "1",
            "success": True,
            "execution_time": 42,
            "job": "123456/MYUSER/QZDASOINIT",
        }
        validate(instance=response, schema=schema)

    def test_query_result_with_data(self):
        schema = load_schema("responses/query-result.json")
        response = {
            "id": "2",
            "success": True,
            "execution_time": 15,
            "has_results": True,
            "update_count": -1,
            "metadata": {
                "column_count": 2,
                "job": "123/USER/JOB",
                "columns": [
                    {
                        "name": "ID",
                        "type": "INTEGER",
                        "display_size": 11,
                        "label": "ID",
                        "precision": 10,
                        "scale": 0,
                        "autoIncrement": False,
                        "nullable": 1,
                        "readOnly": False,
                        "writeable": True,
                        "table": "MYTABLE",
                    }
                ],
            },
            "data": [{"ID": 1}, {"ID": 2}],
            "is_done": True,
        }
        validate(instance=response, schema=schema)

    def test_query_result_rejects_missing_fields(self):
        schema = load_schema("responses/query-result.json")
        with pytest.raises(ValidationError):
            validate(
                instance={"id": "2", "success": True, "execution_time": 10},
                schema=schema,
            )

    def test_ping_response(self):
        schema = load_schema("responses/ping-response.json")
        response = {
            "id": "10",
            "success": True,
            "execution_time": 1,
            "alive": True,
            "db_alive": True,
        }
        validate(instance=response, schema=schema)

    def test_get_version_response(self):
        schema = load_schema("responses/get-version-response.json")
        response = {
            "id": "12",
            "success": True,
            "execution_time": 3,
            "build_date": "2024-08-08T12:00:00Z",
            "version": "2.0.0-rc1",
        }
        validate(instance=response, schema=schema)

    def test_unparsable_error(self):
        schema = load_schema("responses/unparsable-error.json")
        response = {
            "id": "unparseable_1",
            "success": False,
            "error": "Non-parseable request: '{bad json'",
            "execution_time": 0,
            "unparseable": "{bad json",
        }
        validate(instance=response, schema=schema)

    def test_unparsable_error_rejects_success_true(self):
        schema = load_schema("responses/unparsable-error.json")
        with pytest.raises(ValidationError):
            validate(
                instance={
                    "id": "unparseable_1",
                    "success": True,
                    "error": "err",
                    "execution_time": 0,
                    "unparseable": "x",
                },
                schema=schema,
            )

    def test_all_response_schemas_are_loadable(self):
        """Every .json file in schemas/responses/ should parse as valid JSON Schema."""
        response_dir = SCHEMA_DIR / "responses"
        for schema_file in sorted(response_dir.glob("*.json")):
            schema = json.loads(schema_file.read_text())
            assert schema.get("type") == "object", f"{schema_file.name} missing type"
            assert "properties" in schema, f"{schema_file.name} missing properties"
