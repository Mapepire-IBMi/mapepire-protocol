import { z } from "zod";

/**
 * Fetch the next block of rows from an open cursor.
 * `cont_id` references the `id` of the original `sql` or `prepare_sql*` request.
 * Source: RunSqlMore.java lines 11-22.
 */
export const SqlMoreRequest = z.object({
  id: z.string(),
  type: z.literal("sqlmore"),
  cont_id: z.string(),
  rows: z.number().int().positive().optional(),
});

export type SqlMoreRequest = z.infer<typeof SqlMoreRequest>;
