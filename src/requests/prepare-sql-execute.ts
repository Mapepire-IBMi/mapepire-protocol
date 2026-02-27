import { z } from "zod";

/**
 * Prepare AND immediately execute an SQL statement in one round-trip.
 * Parameters can be a flat array (single execution) or array-of-arrays (batch execution).
 * Source: PrepareSql.java (with immediate execute), DataStreamProcessor.java lines 100-104.
 */
export const PrepareSqlExecuteRequest = z.object({
  id: z.string(),
  type: z.literal("prepare_sql_execute"),
  sql: z.string(),
  parameters: z.array(z.unknown()),
  rows: z.number().int().positive().optional(),
  terse: z.boolean().optional(),
});

export type PrepareSqlExecuteRequest = z.infer<typeof PrepareSqlExecuteRequest>;
