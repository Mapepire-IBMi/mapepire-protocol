import { z } from "zod";

/**
 * Prepare an SQL statement without executing. Returns metadata including parameter info.
 * The request `id` becomes the handle for subsequent `execute`/`sqlmore`/`sqlclose` operations.
 * Source: PrepareSql.java lines 23-86.
 */
export const PrepareSqlRequest = z.object({
  id: z.string(),
  type: z.literal("prepare_sql"),
  sql: z.string(),
  terse: z.boolean().optional(),
});

export type PrepareSqlRequest = z.infer<typeof PrepareSqlRequest>;
