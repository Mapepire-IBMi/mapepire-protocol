import { z } from "zod";
import { ParameterMode } from "../enums.js";

/**
 * Metadata for a single prepared statement parameter marker.
 * Returned in `metadata.parameters[]` for prepare_sql and prepare_sql_execute responses.
 * Source: PrepareSql.java lines 39-78.
 */
export const ParameterDetail = z.object({
  type: z.string(),
  mode: ParameterMode,
  precision: z.number().int(),
  scale: z.number().int(),
  name: z.string(),
});

export type ParameterDetail = z.infer<typeof ParameterDetail>;

/**
 * Output parameter value returned from stored procedure execution.
 * Returned in `output_parms[]` for execute and prepare_sql_execute responses.
 * Source: BlockRetrievableRequest.java lines 35-73.
 */
export const ParameterResult = z.object({
  index: z.number().int(),
  type: z.string(),
  precision: z.number().int(),
  scale: z.number().int(),
  name: z.string(),
  ccsid: z.number().int().optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export type ParameterResult = z.infer<typeof ParameterResult>;
