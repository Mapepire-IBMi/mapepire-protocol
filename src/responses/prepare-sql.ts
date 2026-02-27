import { z } from "zod";
import { BaseResponse } from "../base.js";
import { QueryMetaDataWithParams } from "./query-result.js";

/**
 * Response to a `prepare_sql` request.
 * Returns metadata about the prepared statement including parameter info.
 * Source: PrepareSql.java lines 23-86.
 */
export const PrepareSqlResponse = BaseResponse.extend({
  metadata: QueryMetaDataWithParams,
  parameter_count: z.number().int(),
});

export type PrepareSqlResponse = z.infer<typeof PrepareSqlResponse>;
