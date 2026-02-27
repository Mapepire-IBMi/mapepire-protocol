"""
Test that datamodel-code-generator can process every schema file
and that the generated modules are importable.
"""

import importlib
from pathlib import Path

import pytest

SCHEMA_DIR = Path(__file__).parent.parent.parent / "schemas"
GENERATED_DIR = Path(__file__).parent.parent / "mapepire_protocol"


class TestCodegenOutput:
    """Verify the datamodel-code-generator output is complete and importable."""

    def test_all_request_schemas_have_generated_modules(self):
        """Every request schema .json should have a corresponding .py module."""
        request_schemas = sorted((SCHEMA_DIR / "requests").glob("*.json"))
        assert len(request_schemas) == 15, "Expected 15 request schemas"

        for schema_file in request_schemas:
            module_name = schema_file.stem.replace("-", "_")
            module_path = GENERATED_DIR / "requests" / f"{module_name}.py"
            assert module_path.exists(), f"Missing generated module: {module_path}"

    def test_all_response_schemas_have_generated_modules(self):
        """Every response schema .json should have a corresponding .py module."""
        response_schemas = sorted((SCHEMA_DIR / "responses").glob("*.json"))
        assert len(response_schemas) == 12, "Expected 12 response schemas"

        for schema_file in response_schemas:
            module_name = schema_file.stem.replace("-", "_")
            module_path = GENERATED_DIR / "responses" / f"{module_name}.py"
            assert module_path.exists(), f"Missing generated module: {module_path}"

    def test_all_request_modules_importable(self):
        """Every generated request module should import without errors."""
        for module_file in sorted((GENERATED_DIR / "requests").glob("*.py")):
            if module_file.name == "__init__.py":
                continue
            module_name = module_file.stem
            mod = importlib.import_module(
                f"mapepire_protocol.requests.{module_name}"
            )
            # Each module should have at least one class (the model)
            classes = [
                v for v in vars(mod).values()
                if isinstance(v, type) and hasattr(v, "model_fields")
            ]
            assert len(classes) >= 1, (
                f"Module {module_name} has no Pydantic model classes"
            )

    def test_all_response_modules_importable(self):
        """Every generated response module should import without errors."""
        for module_file in sorted((GENERATED_DIR / "responses").glob("*.py")):
            if module_file.name == "__init__.py":
                continue
            module_name = module_file.stem
            mod = importlib.import_module(
                f"mapepire_protocol.responses.{module_name}"
            )
            classes = [
                v for v in vars(mod).values()
                if isinstance(v, type) and hasattr(v, "model_fields")
            ]
            assert len(classes) >= 1, (
                f"Module {module_name} has no Pydantic model classes"
            )

    @pytest.mark.parametrize(
        "module_path,expected_fields",
        [
            (
                "mapepire_protocol.requests.sql_request",
                {"id", "type", "sql", "rows", "terse"},
            ),
            (
                "mapepire_protocol.requests.connect_request",
                {"id", "type", "props", "technique", "application"},
            ),
            (
                "mapepire_protocol.requests.execute_request",
                {"id", "type", "cont_id", "parameters", "rows", "terse"},
            ),
            (
                "mapepire_protocol.responses.ping_response",
                {"id", "success", "error", "sql_rc", "sql_state", "execution_time", "alive", "db_alive"},
            ),
            (
                "mapepire_protocol.responses.query_result",
                {"id", "success", "error", "sql_rc", "sql_state", "execution_time", "has_results", "update_count", "metadata", "data", "is_done", "parameter_count", "output_parms"},
            ),
        ],
    )
    def test_model_has_expected_fields(self, module_path, expected_fields):
        """Verify key models have the correct field names from the protocol spec."""
        mod = importlib.import_module(module_path)
        # Find the main model class (the one with model_fields)
        model_classes = [
            v for v in vars(mod).values()
            if isinstance(v, type) and hasattr(v, "model_fields")
        ]
        # Use the last defined class (the main model, not nested types)
        model = model_classes[-1]
        actual_fields = set(model.model_fields.keys())
        assert expected_fields == actual_fields, (
            f"{module_path}: expected {expected_fields}, got {actual_fields}"
        )
