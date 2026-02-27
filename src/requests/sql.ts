import { z } from "zod";

/**
 * Execute an SQL statement and return the first block of results.
 * Does NOT accept parameters — use `prepare_sql_execute` for parameterized queries.
 * Source: RunSql.java lines 17-33.
 */
export const SqlRequest = z.object({
  id: z.string(),
  type: z.literal("sql"),
  sql: z.string(),
  rows: z.number().int().positive().optional(),
  terse: z.boolean().optional(),
});

export type SqlRequest = z.infer<typeof SqlRequest>;
