import { z } from "zod";

// Base schemas
export { BaseRequest, BaseResponse } from "./base.js";

// Enums
export {
  MessageType,
  ServerTraceLevel,
  ServerTraceDest,
  ConnectionTechnique,
  ParameterMode,
} from "./enums.js";

// Shared data structures
export {
  ColumnMetaData,
  QueryMetaData,
  ParameterDetail,
  ParameterResult,
  JobLogEntry,
} from "./shared/index.js";

// Request schemas
export {
  ConnectRequest,
  SqlRequest,
  PrepareSqlRequest,
  PrepareSqlExecuteRequest,
  ExecuteRequest,
  SqlMoreRequest,
  SqlCloseRequest,
  ClRequest,
  DoveRequest,
  PingRequest,
  GetDbJobRequest,
  GetVersionRequest,
  SetConfigRequest,
  GetTraceDataRequest,
  ExitRequest,
} from "./requests/index.js";

// Response schemas
export {
  ConnectResponse,
  QueryResult,
  QueryMetaDataWithParams,
  PrepareSqlResponse,
  SqlMoreResponse,
  SqlCloseResponse,
  DoveResponse,
  PingResponse,
  GetDbJobResponse,
  GetVersionResponse,
  SetConfigResponse,
  GetTraceDataResponse,
  ExitResponse,
  UnparsableError,
  IncompleteError,
  UnknownError,
  BadRequestError,
} from "./responses/index.js";

// Import individual schemas for the discriminated union
import { ConnectRequest } from "./requests/connect.js";
import { SqlRequest } from "./requests/sql.js";
import { PrepareSqlRequest } from "./requests/prepare-sql.js";
import { PrepareSqlExecuteRequest } from "./requests/prepare-sql-execute.js";
import { ExecuteRequest } from "./requests/execute.js";
import { SqlMoreRequest } from "./requests/sql-more.js";
import { SqlCloseRequest } from "./requests/sql-close.js";
import { ClRequest } from "./requests/cl.js";
import { DoveRequest } from "./requests/dove.js";
import { PingRequest } from "./requests/ping.js";
import { GetDbJobRequest } from "./requests/get-db-job.js";
import { GetVersionRequest } from "./requests/get-version.js";
import { SetConfigRequest } from "./requests/set-config.js";
import { GetTraceDataRequest } from "./requests/get-trace-data.js";
import { ExitRequest } from "./requests/exit.js";

/**
 * Discriminated union of all 15 Mapepire protocol request types.
 * Discriminated on the `type` field.
 *
 * Usage:
 * ```ts
 * const result = MapepireRequest.parse(json);
 * if (result.type === "sql") {
 *   // result is narrowed to SqlRequest
 *   console.log(result.sql);
 * }
 * ```
 */
export const MapepireRequest = z.discriminatedUnion("type", [
  ConnectRequest,
  SqlRequest,
  PrepareSqlRequest,
  PrepareSqlExecuteRequest,
  ExecuteRequest,
  SqlMoreRequest,
  SqlCloseRequest,
  ClRequest,
  DoveRequest,
  PingRequest,
  GetDbJobRequest,
  GetVersionRequest,
  SetConfigRequest,
  GetTraceDataRequest,
  ExitRequest,
]);

export type MapepireRequest = z.infer<typeof MapepireRequest>;
