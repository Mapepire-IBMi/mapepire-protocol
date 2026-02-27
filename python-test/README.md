# python-test

Python integration tests for `@ibm/mapepire-protocol` JSON schemas.
Validates that the schemas work for cross-language consumption via
[jsonschema](https://python-jsonschema.readthedocs.io/) validation and
[Pydantic](https://docs.pydantic.dev/) model generation.

## Setup

Requires Python 3.13+ and [uv](https://docs.astral.sh/uv/).

```bash
uv sync --all-groups
```

## Generate Pydantic models

The JSON schemas in `../schemas/` are the source of truth. Generate typed
Python models from them with `datamodel-code-generator`:

```bash
# Requests
for f in ../schemas/requests/*.json; do
  name=$(basename "$f" .json | tr '-' '_')
  uv run datamodel-codegen --input "$f" --output mapepire_protocol/requests/${name}.py \
    --output-model-type pydantic_v2.BaseModel \
    --use-union-operator --target-python-version 3.12
done

# Responses
for f in ../schemas/responses/*.json; do
  name=$(basename "$f" .json | tr '-' '_')
  uv run datamodel-codegen --input "$f" --output mapepire_protocol/responses/${name}.py \
    --output-model-type pydantic_v2.BaseModel \
    --use-union-operator --target-python-version 3.12
done
```

Generated files live in `mapepire_protocol/requests/` and
`mapepire_protocol/responses/` (git-ignored).

## Run tests

```bash
uv run pytest -v
```

The test suite (60 tests) covers:

- **test_json_schema_validation.py** — validates messages against the raw JSON Schema files
- **test_pydantic_models.py** — constructs and validates Pydantic models, round-trips, enums
- **test_codegen.py** — verifies all schemas produced importable modules with correct fields

## Run the client

A sample WebSocket client that connects to a mapepire-server and runs a query.

```bash
cp .env.example .env
# Edit .env with your IBM i credentials:
#   MP_HOST, MP_PORT, MP_USER, MP_PASSWORD

uv run python client.py
```

<details>
<summary>Example output</summary>

```
Connecting to wss://my-ibmi:8076/db/ ...

  >> {"id":"1","type":"connect","technique":"tcp","application":"python-test-client"}
  << {
  "id": "1",
  "job": "236677/QUSER/QZDASOINIT",
  "success": true,
  "execution_time": 16
}

Job: 236677/QUSER/QZDASOINIT

  >> {"id":"2","type":"sql","sql":"SELECT * FROM sample.employee FETCH FIRST 3 ROWS ONLY","rows":3}
  << {
  "id": "2",
  "has_results": true,
  "update_count": -1,
  "metadata": { ... },
  "data": [ ... ],
  "is_done": false,
  "success": true,
  "execution_time": 198
}

EMPNO  | FIRSTNME  | MIDINIT | LASTNAME | WORKDEPT | PHONENO | HIREDATE | JOB     | EDLEVEL | SEX | BIRTHDATE | SALARY  | BONUS  | COMM
-------+-----------+---------+----------+----------+---------+----------+---------+---------+-----+-----------+---------+--------+-------
000010 | CHRISTINE | I       | Bob      | A00      | 3978    | 01/01/65 | PRES    | 18      | F   | None      | 52750.0 | 1000.0 | 4220.0
000020 | MICHAEL   | L       | THOMPSON | B01      | 3476    | 10/10/73 | MANAGER | 18      | M   | 02/02/48  | 41250.0 | 800.0  | 3300.0
000030 | SALLY     | A       | KWAN     | C01      | 4738    | 04/05/75 | MANAGER | 20      | F   | 05/11/41  | 38250.0 | 800.0  | 3060.0

3 row(s), is_done: False

  >> {"id":"3","type":"exit"}
  << {
  "id": "3",
  "success": true,
  "execution_time": 0
}

Done.
```

</details>
