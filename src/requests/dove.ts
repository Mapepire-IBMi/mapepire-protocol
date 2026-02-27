import { z } from "zod";

/**
 * Database Observe, Visualize, Explain — runs SQL under DB Monitor
 * and invokes QQQDBVE to get Visual Explain data.
 * If `run` is true, also executes the SQL and returns query results.
 * Source: DoVe.java lines 28-103.
 */
export const DoveRequest = z.object({
  id: z.string(),
  type: z.literal("dove"),
  sql: z.string(),
  run: z.boolean().optional(),
  rows: z.number().int().positive().optional(),
  terse: z.boolean().optional(),
});

export type DoveRequest = z.infer<typeof DoveRequest>;
