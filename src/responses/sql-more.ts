import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `sqlmore` request.
 * Returns the next block of rows from an open cursor.
 * Source: RunSqlMore.java lines 11-22.
 */
export const SqlMoreResponse = BaseResponse.extend({
  data: z.array(z.unknown()),
  is_done: z.boolean(),
});

export type SqlMoreResponse = z.infer<typeof SqlMoreResponse>;
