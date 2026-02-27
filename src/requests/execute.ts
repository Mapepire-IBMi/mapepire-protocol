import { z } from "zod";

/**
 * Execute a previously prepared statement with parameter values.
 * `cont_id` references the `id` of a prior `prepare_sql` or `prepare_sql_execute` request.
 * Parameters can be a flat array (single execution) or array-of-arrays (batch execution).
 * Source: PreparedExecute.java lines 26-67.
 */
export const ExecuteRequest = z.object({
  id: z.string(),
  type: z.literal("execute"),
  cont_id: z.string(),
  parameters: z.array(z.unknown()),
  rows: z.number().int().positive().optional(),
  terse: z.boolean().optional(),
});

export type ExecuteRequest = z.infer<typeof ExecuteRequest>;
