# Mapepire WebSocket Protocol Specification

## Overview

Mapepire is a WebSocket-based protocol for interacting with IBM i Db2 databases. It provides a lightweight, language-agnostic interface for SQL execution, prepared statements, CL commands, Visual Explain, and server diagnostics.

The protocol defines **15 message types**, all exchanged as JSON objects over WebSocket text frames. Requests are sent by the client; responses are returned by the server. Every request carries a correlation ID that the server echoes back, allowing clients to multiplex concurrent operations over a single connection.

---

## Transport

| Property | Value |
|---|---|
| Protocol | WebSocket over TLS (`wss://`) |
| Default port | `8076` (configurable via `PORT` environment variable) |
| Endpoint | `wss://<host>:<port>/db/*` |
| Max message size | 50 MB (configurable via `MAX_WS_MESSAGE_SIZE` environment variable) |
| Frame type | Text frames (JSON) |

TLS can be disabled by setting the environment variable `MP_UNSECURE=true`, in which case the endpoint becomes `ws://`.

---

## Authentication

Authentication is performed during the WebSocket upgrade handshake using **HTTP Basic Auth**. The client must include an `Authorization` header with the Base64-encoded credentials:

```
Authorization: Basic base64(user:password)
```

The server validates the credentials against the IBM i user profile before completing the upgrade.

**Single mode** (stdin/stdout transport) does not require authentication.

---

## Message Format

All messages are JSON objects transmitted as WebSocket text frames.

**Requests** always include:
- `id` -- a string serving as the correlation ID, chosen by the client
- `type` -- a string identifying the message type (handler discriminator)

**Responses** always include:
- `id` -- echoes the correlation ID from the corresponding request
- `success` -- boolean indicating whether the operation succeeded
- `execution_time` -- time spent processing the request, in milliseconds

Responses do **not** include a `type` field. Clients must match responses to requests using the `id` field.

---

## Common Envelope

### Request Envelope

```json
{
  "id": "<correlation-id>",
  "type": "<message-type>",
  ...
}
```

### Success Response Envelope

```json
{
  "id": "<correlation-id>",
  "success": true,
  "execution_time": 42,
  ...
}
```

### Error Response Envelope

```json
{
  "id": "<correlation-id>",
  "success": false,
  "error": "Human-readable error message",
  "sql_rc": -204,
  "sql_state": "42704",
  "execution_time": 5
}
```

| Field | Type | Presence | Description |
|---|---|---|---|
| `id` | string | Always | Correlation ID echoed from the request |
| `success` | boolean | Always | `true` on success, `false` on failure |
| `execution_time` | number | Always | Processing time in milliseconds |
| `error` | string | Error only | Human-readable error description |
| `sql_rc` | integer | Error only | Native SQL return code (when applicable) |
| `sql_state` | string | Error only | SQLSTATE code (when applicable) |

The server serializes all JSON with null values explicitly included (`serializeNulls`). Fields documented as optional may appear in the response with a `null` value rather than being absent.

---

## Connection Lifecycle

A typical session follows this sequence:

1. The client initiates a WebSocket upgrade with Basic Auth credentials.
2. The server authenticates and completes the upgrade (101 Switching Protocols).
3. The client sends a `connect` message to establish the JDBC connection.
4. The client sends queries, commands, and other operations.
5. The client sends an `exit` message or closes the WebSocket.

```
Client                                        Server
  |                                              |
  |-- WSS Upgrade + Basic Auth ----------------->|
  |<-- 101 Switching Protocols ------------------|
  |                                              |
  |-- {"type":"connect","id":"1",...} ----------->|
  |<-- {"id":"1","job":"...","success":true} ----|
  |                                              |
  |-- {"type":"sql","id":"2","sql":"..."} ------->|
  |<-- {"id":"2","data":[...],"success":true} ---|
  |                                              |
  |-- {"type":"exit","id":"99"} ----------------->|
  |<-- {"id":"99","success":true} ----------------|
  |                                              |
```

---

## Message Reference

### 1. `connect` -- Establish JDBC Connection

Establishes (or re-establishes) the JDBC database connection on the server. This must be the first message sent after the WebSocket upgrade completes.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"connect"` |
| `props` | string | No | Semicolon-delimited JDBC connection properties (e.g. `"naming=system;libraries=MYLIB"`) |
| `technique` | string | No | Connection technique: `"tcp"` or `"cli"` (case-insensitive). Defaults to `"cli"`. |
| `application` | string | No | Application name for job tracking |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `job` | string | IBM i job name in the format `number/user/jobname` |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{"id": "1", "type": "connect", "props": "naming=system", "technique": "tcp"}

// Response
{"id": "1", "success": true, "job": "330921/QUSER/QZDASOINIT", "execution_time": 120}
```

---

### 2. `sql` -- Execute SQL

Executes an SQL statement and returns the first block of results. This message does **not** accept parameters. For parameterized queries, use `prepare_sql_execute`.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID (also becomes the cursor handle) |
| `type` | string | Yes | Must be `"sql"` |
| `sql` | string | Yes | SQL statement to execute |
| `rows` | integer | No | Maximum number of rows to return in this block. Defaults to `1000`. |
| `terse` | boolean | No | When `true`, rows are returned as arrays instead of objects. See [Terse Mode](#terse-mode). |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `has_results` | boolean | `true` if the statement produced a result set |
| `update_count` | integer | Number of rows affected (for INSERT/UPDATE/DELETE) |
| `metadata` | QueryMetaData | Column metadata for the result set (see [Shared Data Structures](#shared-data-structures)) |
| `data` | array | Result rows -- objects (normal) or arrays (terse mode) |
| `is_done` | boolean | `true` if all rows have been fetched; `false` if more rows are available via `sqlmore` |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{"id": "q1", "type": "sql", "sql": "SELECT EMPNO, LASTNAME FROM EMPLOYEE", "rows": 2}

// Response
{
  "id": "q1",
  "success": true,
  "has_results": true,
  "update_count": -1,
  "metadata": {
    "column_count": 2,
    "job": "330921/QUSER/QZDASOINIT",
    "columns": [
      {"name": "EMPNO", "type": "CHAR", "display_size": 6, "label": "EMPNO", "precision": 6, "scale": 0, "autoIncrement": false, "nullable": 1, "readOnly": false, "writeable": true, "table": "EMPLOYEE"},
      {"name": "LASTNAME", "type": "VARCHAR", "display_size": 15, "label": "LASTNAME", "precision": 15, "scale": 0, "autoIncrement": false, "nullable": 0, "readOnly": false, "writeable": true, "table": "EMPLOYEE"}
    ]
  },
  "data": [
    {"EMPNO": "000010", "LASTNAME": "HAAS"},
    {"EMPNO": "000020", "LASTNAME": "THOMPSON"}
  ],
  "is_done": false,
  "execution_time": 34
}
```

---

### 3. `prepare_sql` -- Prepare SQL Statement

Prepares an SQL statement without executing it. Returns metadata about the statement including parameter marker information. The request `id` becomes the handle for subsequent `execute`, `sqlmore`, and `sqlclose` operations.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID (becomes the prepared statement handle) |
| `type` | string | Yes | Must be `"prepare_sql"` |
| `sql` | string | Yes | SQL statement to prepare |
| `terse` | boolean | No | When `true`, subsequent result rows will be returned as arrays |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `metadata` | QueryMetaData | Column and parameter metadata. Includes a `parameters` array of ParameterDetail objects. |
| `parameter_count` | integer | Number of parameter markers in the statement |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{"id": "p1", "type": "prepare_sql", "sql": "SELECT * FROM EMPLOYEE WHERE WORKDEPT = ?"}

// Response
{
  "id": "p1",
  "success": true,
  "metadata": {
    "column_count": 14,
    "job": "330921/QUSER/QZDASOINIT",
    "columns": [...],
    "parameters": [
      {"type": "CHAR", "mode": "IN", "precision": 3, "scale": 0, "name": "WORKDEPT"}
    ]
  },
  "parameter_count": 1,
  "execution_time": 12
}
```

---

### 4. `prepare_sql_execute` -- Prepare and Execute

Prepares and executes an SQL statement in a single round-trip. Supports both single execution (flat parameter array) and batch execution (array of parameter arrays).

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID (also becomes the cursor handle) |
| `type` | string | Yes | Must be `"prepare_sql_execute"` |
| `sql` | string | Yes | SQL statement to prepare and execute |
| `parameters` | array | Yes | Parameter values. Flat array for single execution (e.g. `["A01"]`), or array-of-arrays for batch execution (e.g. `[["A01"], ["B01"]]`). |
| `rows` | integer | No | Maximum rows to return. Defaults to `1000`. |
| `terse` | boolean | No | When `true`, result rows are returned as arrays |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `has_results` | boolean | `true` if the statement produced a result set |
| `update_count` | integer | Number of rows affected |
| `metadata` | QueryMetaData | Column and parameter metadata |
| `data` | array | Result rows |
| `is_done` | boolean | `true` if all rows have been fetched |
| `parameter_count` | integer | Number of parameter markers |
| `output_parms` | ParameterResult[] | Output parameter values (for stored procedures) |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{
  "id": "pse1",
  "type": "prepare_sql_execute",
  "sql": "SELECT * FROM EMPLOYEE WHERE WORKDEPT = ?",
  "parameters": ["A01"],
  "rows": 100
}

// Response
{
  "id": "pse1",
  "success": true,
  "has_results": true,
  "update_count": -1,
  "metadata": {"column_count": 14, "job": "330921/QUSER/QZDASOINIT", "columns": [...]},
  "data": [...],
  "is_done": true,
  "parameter_count": 1,
  "output_parms": null,
  "execution_time": 28
}
```

---

### 5. `execute` -- Execute Prepared Statement

Executes a previously prepared statement with parameter values. The `cont_id` field references the `id` of the prior `prepare_sql` or `prepare_sql_execute` request that created the prepared statement.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID for this execution |
| `type` | string | Yes | Must be `"execute"` |
| `cont_id` | string | Yes | The `id` of the original `prepare_sql` or `prepare_sql_execute` request |
| `parameters` | array | Yes | Parameter values. Flat array for single execution, or array-of-arrays for batch. |
| `rows` | integer | No | Maximum rows to return. Defaults to `1000`. |
| `terse` | boolean | No | When `true`, result rows are returned as arrays |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `has_results` | boolean | `true` if the statement produced a result set |
| `update_count` | integer | Number of rows affected |
| `metadata` | QueryMetaData | Column metadata (may be absent on re-execution) |
| `data` | array | Result rows |
| `is_done` | boolean | `true` if all rows have been fetched |
| `output_parms` | ParameterResult[] | Output parameter values (for stored procedures) |
| `execution_time` | number | Milliseconds |

---

### 6. `sqlmore` -- Fetch More Rows

Fetches the next block of rows from an open cursor. The `cont_id` references the `id` of the original query request (`sql`, `prepare_sql_execute`, or `execute`) that opened the cursor.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"sqlmore"` |
| `cont_id` | string | Yes | The `id` of the original request that opened the cursor |
| `rows` | integer | No | Maximum rows to return in this block. Defaults to `1000`. |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `data` | array | Next block of result rows |
| `is_done` | boolean | `true` if no more rows remain |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request (continuing cursor from request "q1")
{"id": "q1-more", "type": "sqlmore", "cont_id": "q1", "rows": 100}

// Response
{
  "id": "q1-more",
  "success": true,
  "data": [
    {"EMPNO": "000030", "LASTNAME": "KWAN"},
    {"EMPNO": "000050", "LASTNAME": "GEYER"}
  ],
  "is_done": true,
  "execution_time": 8
}
```

---

### 7. `sqlclose` -- Close Cursor

Closes an open result set cursor and frees server-side resources. After closing, the cursor handle (`cont_id`) is no longer valid.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"sqlclose"` |
| `cont_id` | string | Yes | The `id` of the original request whose cursor to close |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{"id": "close-q1", "type": "sqlclose", "cont_id": "q1"}

// Response
{"id": "close-q1", "success": true, "execution_time": 2}
```

---

### 8. `cl` -- Execute CL Command

Executes an IBM i CL (Control Language) command via `QSYS2.QCMDEXC` and returns the job log entries produced by the command.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"cl"` |
| `cmd` | string | Yes | CL command string (e.g. `"DSPLIBL"`) |
| `terse` | boolean | No | When `true`, result rows are returned as arrays |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `has_results` | boolean | `true` if job log entries were produced |
| `update_count` | integer | Number of rows affected |
| `metadata` | QueryMetaData | Metadata describing the job log entry columns |
| `data` | JobLogEntry[] | Job log entries generated by the command (entries from **after** the command was issued) |
| `is_done` | boolean | Always `true` |
| `execution_time` | number | Milliseconds |

---

### 9. `dove` -- Visual Explain

Invokes Database Observe, Visualize, Explain (DoVe) -- runs the SQL under a DB Monitor and calls `QQQDBVE` to produce Visual Explain data. If `run` is `true`, the SQL is also executed and query results are included in the response.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"dove"` |
| `sql` | string | Yes | SQL statement to explain |
| `run` | boolean | No | When `true`, also execute the SQL and return results |
| `rows` | integer | No | Maximum rows to return (applies when `run=true`). Defaults to `1000`. |
| `terse` | boolean | No | When `true`, result rows are returned as arrays |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `vemetadata` | QueryMetaData | Metadata for Visual Explain result columns |
| `vedata` | array | Visual Explain data rows |
| `metadata` | QueryMetaData | Query result metadata (present only when `run=true`) |
| `data` | array | Query result rows (present only when `run=true`) |
| `is_done` | boolean | Whether all query result rows were fetched (present only when `run=true`) |
| `execution_time` | number | Milliseconds |

---

### 10. `ping` -- Health Check

Checks whether the server process and the database connection are alive.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"ping"` |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `alive` | boolean | Always `true` (the server process is alive) |
| `db_alive` | boolean | `true` if the JDBC connection is healthy |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{"id": "hc1", "type": "ping"}

// Response
{"id": "hc1", "success": true, "alive": true, "db_alive": true, "execution_time": 1}
```

---

### 11. `getdbjob` -- Get Job Name

Returns the IBM i job name associated with the current JDBC connection.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"getdbjob"` |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `job` | string | Job name in the format `number/user/jobname` |
| `execution_time` | number | Milliseconds |

---

### 12. `getversion` -- Get Server Version

Returns the server build version and date.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"getversion"` |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `build_date` | string | Server build date |
| `version` | string | Server version string |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{"id": "v1", "type": "getversion"}

// Response
{"id": "v1", "success": true, "build_date": "2024-08-01", "version": "2.0.0", "execution_time": 0}
```

---

### 13. `setconfig` -- Configure Tracing

Configures server-side tracing at runtime. Omitted fields leave the current setting unchanged.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"setconfig"` |
| `tracedest` | string | No | Trace destination: `"FILE"` or `"IN_MEM"` |
| `tracelevel` | string | No | Trace level: `"OFF"`, `"ON"`, `"ERRORS"`, `"DATASTREAM"`, or `"INPUT_AND_ERRORS"` |
| `jtopentracedest` | string | No | JTOpen trace destination: `"FILE"` or `"IN_MEM"` |
| `jtopentracelevel` | string | No | JTOpen trace level: `"OFF"`, `"ON"`, `"ERRORS"`, `"DATASTREAM"`, or `"INPUT_AND_ERRORS"` |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `tracedest` | string | Current trace destination after applying changes |
| `tracelevel` | string | Current trace level after applying changes |
| `jtopentracedest` | string | Current JTOpen trace destination after applying changes |
| `jtopentracelevel` | string | Current JTOpen trace level after applying changes |
| `execution_time` | number | Milliseconds |

---

### 14. `gettracedata` -- Retrieve Trace Data

Retrieves accumulated trace data from the server. Only applicable when tracing is configured with `"IN_MEM"` destination.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"gettracedata"` |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` on success |
| `tracedata` | string | Accumulated server trace data |
| `jtopentracedata` | string | Accumulated JTOpen trace data |
| `execution_time` | number | Milliseconds |

---

### 15. `exit` -- Disconnect

Gracefully terminates the connection. After the response is sent, the server closes the WebSocket (in daemon mode) or exits the process (in single mode).

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Correlation ID |
| `type` | string | Yes | Must be `"exit"` |

**Response**

| Field | Type | Description |
|---|---|---|
| `id` | string | Correlation ID |
| `success` | boolean | `true` |
| `execution_time` | number | Milliseconds |

**Example**

```json
// Request
{"id": "99", "type": "exit"}

// Response
{"id": "99", "success": true, "execution_time": 0}
```

---

## Shared Data Structures

### ColumnMetaData

Describes a single column in a result set.

| Field | Type | Description |
|---|---|---|
| `name` | string | Column name |
| `type` | string | SQL data type (e.g. `"VARCHAR"`, `"INTEGER"`, `"DECIMAL"`) |
| `display_size` | integer | Maximum display width in characters |
| `label` | string | Column label (often the same as `name`) |
| `precision` | integer | Numeric precision or character length |
| `scale` | integer | Number of digits after the decimal point |
| `autoIncrement` | boolean | `true` if the column is auto-incrementing |
| `nullable` | integer | Nullability: `0` = not nullable, `1` = nullable, `2` = unknown |
| `readOnly` | boolean | `true` if the column is read-only |
| `writeable` | boolean | `true` if the column is writeable |
| `table` | string | Name of the table this column belongs to |

### QueryMetaData

Describes the result set returned by a query.

| Field | Type | Description |
|---|---|---|
| `column_count` | integer | Number of columns in the result set |
| `job` | string | IBM i job name for the connection |
| `columns` | ColumnMetaData[] | Array of column descriptors |

When returned by `prepare_sql` or `prepare_sql_execute`, the metadata object may also include a `parameters` array of ParameterDetail objects.

### ParameterDetail

Describes a single parameter marker in a prepared SQL statement.

| Field | Type | Description |
|---|---|---|
| `type` | string | SQL data type of the parameter |
| `mode` | string | Direction: `"IN"`, `"OUT"`, `"INOUT"`, or `"UNKNOWN"` |
| `precision` | integer | Numeric precision or character length |
| `scale` | integer | Number of digits after the decimal point |
| `name` | string | Parameter name (may be empty) |

### ParameterResult

Represents an output parameter value returned from a stored procedure call.

| Field | Type | Description |
|---|---|---|
| `index` | integer | 1-based parameter index |
| `type` | string | SQL data type |
| `precision` | integer | Numeric precision or character length |
| `scale` | integer | Number of digits after the decimal point |
| `name` | string | Parameter name |
| `ccsid` | integer | Character set ID (optional, present for character types) |
| `value` | string, number, boolean, or null | The output parameter value (optional) |

### JobLogEntry

A single IBM i job log entry returned by CL command execution.

| Field | Type | Description |
|---|---|---|
| `MESSAGE_ID` | string | Message identifier (e.g. `"CPF2110"`) |
| `SEVERITY` | integer | Message severity level |
| `MESSAGE_TIMESTAMP` | string | Timestamp of the message |
| `FROM_LIBRARY` | string | Library containing the program that issued the message |
| `FROM_PROGRAM` | string | Program that issued the message |
| `MESSAGE_TYPE` | string | Message type code |
| `MESSAGE_TEXT` | string | First-level message text |
| `MESSAGE_SECOND_LEVEL_TEXT` | string | Second-level (detail) message text |

---

## Error Handling

All error responses share the common envelope with `"success": false` and an `error` string. In addition, the server defines four categories of error pseudo-types for malformed or invalid requests.

### UnparsableError

Returned when the incoming message is not valid JSON.

| Field | Type | Description |
|---|---|---|
| `id` | string | Auto-generated as `"unparseable_<N>"` (incrementing counter) |
| `success` | boolean | Always `false` |
| `error` | string | Description of the parse failure |
| `unparseable` | string | The raw input that could not be parsed |
| `execution_time` | number | Milliseconds |

### IncompleteError

Returned when the JSON is valid but is missing the required `id` or `type` field.

| Field | Type | Description |
|---|---|---|
| `id` | string | Auto-generated as `"incomplete_<N>"` (incrementing counter) |
| `success` | boolean | Always `false` |
| `error` | string | Description of what is missing |
| `incomplete` | string | The raw input that was incomplete |
| `execution_time` | number | Milliseconds |

### UnknownError

Returned when the `type` value does not match any known message handler.

| Field | Type | Description |
|---|---|---|
| `id` | string | Echoed from the request |
| `success` | boolean | Always `false` |
| `error` | string | Description indicating the type is unrecognized |
| `execution_time` | number | Milliseconds |

### BadRequestError

Returned when a request has a recognized type but fails validation (e.g., missing required fields).

| Field | Type | Description |
|---|---|---|
| `id` | string | Echoed from the request |
| `success` | boolean | Always `false` |
| `error` | string | Description of the validation failure |
| `execution_time` | number | Milliseconds |

Known error reasons include:

- `"Correlation ID not specified"` -- the `cont_id` field is missing for `sqlmore`, `sqlclose`, or `execute`
- `"invalid correlation ID"` -- the `cont_id` does not reference a known open cursor or prepared statement

---

## Cursor Management

The Mapepire protocol uses a cursor model to manage result sets that may span multiple fetch operations.

### Opening a Cursor

When a `sql`, `prepare_sql`, or `prepare_sql_execute` request succeeds, the request's `id` becomes the **cursor handle**. The server holds the JDBC result set open until the cursor is explicitly closed or the connection ends.

### Fetching Additional Rows

If the response contains `"is_done": false`, more rows are available. Send a `sqlmore` message with `cont_id` set to the original request's `id` to fetch the next block.

### Closing a Cursor

Send a `sqlclose` message with `cont_id` set to the original request's `id` to close the cursor and free server resources. After closing, the cursor handle is no longer valid.

### Lifecycle Diagram

```
sql (id="q1")  ──>  cursor "q1" opened
                         │
sqlmore (cont_id="q1") ──>  fetch next block
                         │
sqlmore (cont_id="q1") ──>  fetch next block (is_done=true)
                         │
sqlclose (cont_id="q1") ──>  cursor "q1" freed
```

### Re-Executing a Prepared Statement

For prepared statements, the cursor handle from `prepare_sql` persists across multiple `execute` calls. Each `execute` with a new set of parameters produces a new result set on the same prepared statement. Close the cursor when the prepared statement is no longer needed.

---

## Implementation Notes

### Terse Mode

When `terse: true` is included in a request, result set rows are returned as **arrays** (positional values in column order) rather than **objects** (key-value pairs with column names). This reduces payload size for large result sets.

```json
// Normal mode
{"data": [{"EMPNO": "000010", "LASTNAME": "HAAS"}]}

// Terse mode
{"data": [["000010", "HAAS"]]}
```

Column order matches the `columns` array in the `metadata` response field.

### Batch Execution

The `prepare_sql_execute` and `execute` messages support batch execution by passing `parameters` as an **array of arrays**. Each inner array represents one set of parameter values.

```json
// Single execution
{"parameters": ["A01"]}

// Batch execution (3 rows)
{"parameters": [["A01"], ["B01"], ["C01"]]}
```

### Connection Technique

The `technique` field in the `connect` message accepts `"tcp"` or `"cli"` (case-insensitive). This controls the JDBC driver connection method. The default is `"cli"`.

### Default Row Count

When the `rows` field is omitted from a request, the server defaults to returning up to **1000 rows** per block.

### Response Correlation

Responses do **not** include a `type` field. Clients must correlate responses to requests using the `id` field. If multiple requests are in flight concurrently, each must have a unique `id`.

### Null Serialization

The server uses Gson with `serializeNulls()` enabled. This means fields with null values appear explicitly in JSON responses (e.g., `"output_parms": null`) rather than being omitted. Client implementations should be prepared to handle explicit `null` values for any optional field.

### CL Command Job Log Entries

The `cl` message returns job log entries that were produced **after** the CL command was issued. This filters out pre-existing job log entries to show only the messages relevant to the command execution.
