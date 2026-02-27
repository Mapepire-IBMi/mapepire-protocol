# @ibm/mapepire-protocol

Canonical protocol definitions for the [Mapepire](https://github.com/Mapepire-IBMi) WebSocket protocol.

This package provides:

- **Zod schemas** for all 15 Mapepire protocol message types (requests + responses)
- **TypeScript types** inferred from schemas for compile-time safety
- **JSON Schema** files generated from Zod for cross-language consumption
- **Discriminated union** (`MapepireRequest`) for runtime message parsing and type narrowing
- **PROTOCOL.md** — human-readable protocol specification for client implementors

## Installation

```bash
npm install @ibm/mapepire-protocol zod
```

> `zod` is a peer dependency — install it alongside this package.

## Usage

### Parse and validate a request

```typescript
import { MapepireRequest } from "@ibm/mapepire-protocol";

const message = JSON.parse(rawWebSocketMessage);
const request = MapepireRequest.parse(message);

switch (request.type) {
  case "sql":
    console.log(request.sql); // TypeScript knows this is SqlRequest
    break;
  case "connect":
    console.log(request.technique); // TypeScript knows this is ConnectRequest
    break;
}
```

### Construct a typed request

```typescript
import { SqlRequest } from "@ibm/mapepire-protocol";

const request: SqlRequest = {
  id: "1",
  type: "sql",
  sql: "SELECT * FROM MYLIB.MYTABLE",
  rows: 100,
};

// Validate at runtime
SqlRequest.parse(request);
```

### Validate a response

```typescript
import { QueryResult, PingResponse } from "@ibm/mapepire-protocol";

const response = QueryResult.parse(serverMessage);
if (response.has_results) {
  console.log(response.data);
  console.log(response.metadata?.columns);
}
```

### Use JSON Schema (cross-language)

```typescript
import schema from "@ibm/mapepire-protocol/schemas/requests/sql-request.json";
```

Or access the combined schema:

```typescript
import allSchemas from "@ibm/mapepire-protocol/schemas/index.json";
```

### Python: validate messages with JSON Schema

The generated JSON Schema files in `schemas/` can be used by any language. For Python, use the `jsonschema` library to validate outgoing requests and incoming responses at runtime.

First, grab the schema files. You can either vendor them into your project or fetch them from the npm package:

```bash
npm pack @ibm/mapepire-protocol && tar -xzf ibm-mapepire-protocol-*.tgz package/schemas
```

Then validate messages in Python:

```python
import json
from pathlib import Path
from jsonschema import validate, ValidationError

# Load schemas once at import time
SCHEMA_DIR = Path("schemas")

def load_schema(name: str) -> dict:
    return json.loads((SCHEMA_DIR / name).read_text())

sql_request_schema = load_schema("requests/sql-request.json")
query_result_schema = load_schema("responses/query-result.json")

# Validate an outgoing request before sending
request = {
    "id": "1",
    "type": "sql",
    "sql": "SELECT * FROM MYLIB.MYTABLE",
    "rows": 100,
}
validate(instance=request, schema=sql_request_schema)  # raises on invalid

# Validate an incoming response from the server
response = json.loads(websocket.recv())
try:
    validate(instance=response, schema=query_result_schema)
except ValidationError as e:
    print(f"Unexpected server response: {e.message}")
```

### Python: generate dataclasses or Pydantic models

For full type safety, generate Python types directly from the JSON Schema files using [datamodel-code-generator](https://github.com/koxudaxi/datamodel-code-generator):

```bash
pip install datamodel-code-generator

# Generate Pydantic v2 models from all request schemas
datamodel-codegen \
    --input schemas/requests/ \
    --output mapepire_protocol/requests.py \
    --output-model-type pydantic_v2.BaseModel

# Generate from a single schema
datamodel-codegen \
    --input schemas/requests/sql-request.json \
    --output mapepire_protocol/sql_request.py \
    --output-model-type pydantic_v2.BaseModel
```

This produces typed Python classes like:

```python
from pydantic import BaseModel
from typing import Optional

class SqlRequest(BaseModel):
    id: str
    type: str  # const: "sql"
    sql: str
    rows: Optional[int] = None
    terse: Optional[bool] = None
```

## Message Types

| Type | Request Schema | Description |
|------|---------------|-------------|
| `connect` | `ConnectRequest` | Establish JDBC connection |
| `sql` | `SqlRequest` | Execute SQL statement |
| `prepare_sql` | `PrepareSqlRequest` | Prepare SQL without executing |
| `prepare_sql_execute` | `PrepareSqlExecuteRequest` | Prepare and execute in one round-trip |
| `execute` | `ExecuteRequest` | Execute a prepared statement |
| `sqlmore` | `SqlMoreRequest` | Fetch next block of rows |
| `sqlclose` | `SqlCloseRequest` | Close cursor |
| `cl` | `ClRequest` | Execute CL command |
| `dove` | `DoveRequest` | Visual Explain |
| `ping` | `PingRequest` | Health check |
| `getdbjob` | `GetDbJobRequest` | Get job name |
| `getversion` | `GetVersionRequest` | Get server version |
| `setconfig` | `SetConfigRequest` | Configure tracing |
| `gettracedata` | `GetTraceDataRequest` | Retrieve trace data |
| `exit` | `ExitRequest` | Disconnect |

See [PROTOCOL.md](./PROTOCOL.md) for the full protocol specification.

## License

Apache-2.0
