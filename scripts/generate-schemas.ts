import { zodToJsonSchema } from "zod-to-json-schema";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { ConnectRequest } from "../src/requests/connect.js";
import { SqlRequest } from "../src/requests/sql.js";
import { PrepareSqlRequest } from "../src/requests/prepare-sql.js";
import { PrepareSqlExecuteRequest } from "../src/requests/prepare-sql-execute.js";
import { ExecuteRequest } from "../src/requests/execute.js";
import { SqlMoreRequest } from "../src/requests/sql-more.js";
import { SqlCloseRequest } from "../src/requests/sql-close.js";
import { ClRequest } from "../src/requests/cl.js";
import { DoveRequest } from "../src/requests/dove.js";
import { PingRequest } from "../src/requests/ping.js";
import { GetDbJobRequest } from "../src/requests/get-db-job.js";
import { GetVersionRequest } from "../src/requests/get-version.js";
import { SetConfigRequest } from "../src/requests/set-config.js";
import { GetTraceDataRequest } from "../src/requests/get-trace-data.js";
import { ExitRequest } from "../src/requests/exit.js";

import { ConnectResponse } from "../src/responses/connect.js";
import { QueryResult } from "../src/responses/query-result.js";
import { PrepareSqlResponse } from "../src/responses/prepare-sql.js";
import { SqlMoreResponse } from "../src/responses/sql-more.js";
import { PingResponse } from "../src/responses/ping.js";
import { GetDbJobResponse } from "../src/responses/get-db-job.js";
import { GetVersionResponse } from "../src/responses/get-version.js";
import { SetConfigResponse } from "../src/responses/set-config.js";
import { GetTraceDataResponse } from "../src/responses/get-trace-data.js";
import { DoveResponse } from "../src/responses/dove.js";
import {
  UnparsableError,
  IncompleteError,
} from "../src/responses/errors.js";

import { MapepireRequest } from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.resolve(__dirname, "../schemas");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeSchema(filepath: string, schema: unknown) {
  const jsonSchema = zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0], {
    $refStrategy: "none",
  });
  fs.writeFileSync(filepath, JSON.stringify(jsonSchema, null, 2) + "\n");
}

// Request schemas
const requests: Record<string, unknown> = {
  "connect-request": ConnectRequest,
  "sql-request": SqlRequest,
  "prepare-sql-request": PrepareSqlRequest,
  "prepare-sql-execute-request": PrepareSqlExecuteRequest,
  "execute-request": ExecuteRequest,
  "sql-more-request": SqlMoreRequest,
  "sql-close-request": SqlCloseRequest,
  "cl-request": ClRequest,
  "dove-request": DoveRequest,
  "ping-request": PingRequest,
  "get-db-job-request": GetDbJobRequest,
  "get-version-request": GetVersionRequest,
  "set-config-request": SetConfigRequest,
  "get-trace-data-request": GetTraceDataRequest,
  "exit-request": ExitRequest,
};

// Response schemas
const responses: Record<string, unknown> = {
  "connect-response": ConnectResponse,
  "query-result": QueryResult,
  "prepare-sql-response": PrepareSqlResponse,
  "sql-more-response": SqlMoreResponse,
  "dove-response": DoveResponse,
  "ping-response": PingResponse,
  "get-db-job-response": GetDbJobResponse,
  "get-version-response": GetVersionResponse,
  "set-config-response": SetConfigResponse,
  "get-trace-data-response": GetTraceDataResponse,
  "unparsable-error": UnparsableError,
  "incomplete-error": IncompleteError,
};

// Write individual schema files
ensureDir(path.join(schemasDir, "requests"));
ensureDir(path.join(schemasDir, "responses"));

for (const [name, schema] of Object.entries(requests)) {
  writeSchema(path.join(schemasDir, "requests", `${name}.json`), schema);
  console.log(`  wrote schemas/requests/${name}.json`);
}

for (const [name, schema] of Object.entries(responses)) {
  writeSchema(path.join(schemasDir, "responses", `${name}.json`), schema);
  console.log(`  wrote schemas/responses/${name}.json`);
}

// Write combined schema
const combined = zodToJsonSchema(MapepireRequest, {
  name: "MapepireRequest",
  $refStrategy: "none",
});
fs.writeFileSync(
  path.join(schemasDir, "index.json"),
  JSON.stringify(combined, null, 2) + "\n",
);
console.log("  wrote schemas/index.json");

console.log("\nJSON Schema generation complete.");
