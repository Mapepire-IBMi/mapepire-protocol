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
