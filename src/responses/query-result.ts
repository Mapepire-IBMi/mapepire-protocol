import { z } from "zod";
import { BaseResponse } from "../base.js";
import { QueryMetaData } from "../shared/metadata.js";
import { ParameterDetail } from "../shared/parameters.js";
import { ParameterResult } from "../shared/parameters.js";

/**
 * Extended metadata that includes parameter information.
 * Used by prepare_sql_execute and execute responses.
 */
export const QueryMetaDataWithParams = QueryMetaData.extend({
  parameters: z.array(ParameterDetail).optional(),
});

export type QueryMetaDataWithParams = z.infer<typeof QueryMetaDataWithParams>;

/**
 * Shared response for query-producing handlers: sql, prepare_sql_execute, execute, sqlmore, cl.
 * Source: BlockRetrievableRequest.java, PreparedExecute.java.
 */
export const QueryResult = BaseResponse.extend({
  has_results: z.boolean(),
  update_count: z.number().int(),
  metadata: QueryMetaDataWithParams.optional(),
  data: z.array(z.unknown()),
  is_done: z.boolean(),
  parameter_count: z.number().int().optional(),
  output_parms: z.array(ParameterResult).optional(),
});

export type QueryResult = z.infer<typeof QueryResult>;
