import { z } from "zod";

/**
 * All valid `type` values for Mapepire protocol requests.
 * Maps 1:1 to server handler dispatch in DataStreamProcessor.java.
 */
export const MessageType = z.enum([
  "connect",
  "sql",
  "prepare_sql",
  "prepare_sql_execute",
  "execute",
  "sqlmore",
  "sqlclose",
  "cl",
  "dove",
  "ping",
  "getdbjob",
  "getversion",
  "setconfig",
  "gettracedata",
  "exit",
]);

export type MessageType = z.infer<typeof MessageType>;

/**
 * Server trace verbosity levels.
 * Source: Tracer.java TraceLevel enum.
 */
export const ServerTraceLevel = z.enum([
  "OFF",
  "ON",
  "ERRORS",
  "DATASTREAM",
  "INPUT_AND_ERRORS",
]);

export type ServerTraceLevel = z.infer<typeof ServerTraceLevel>;

/**
 * Server trace output destinations.
 * Source: Tracer.java Dest enum.
 */
export const ServerTraceDest = z.enum(["FILE", "IN_MEM"]);

export type ServerTraceDest = z.infer<typeof ServerTraceDest>;

/**
 * JDBC connection technique used by the `connect` message.
 * Server performs case-insensitive comparison (Reconnect.java:26-29).
 */
export const ConnectionTechnique = z.enum(["tcp", "cli"]);

export type ConnectionTechnique = z.infer<typeof ConnectionTechnique>;

/**
 * Parameter mode for prepared statement parameters.
 * Source: PrepareSql.java parameter metadata.
 */
export const ParameterMode = z.enum(["IN", "OUT", "INOUT", "UNKNOWN"]);

export type ParameterMode = z.infer<typeof ParameterMode>;
