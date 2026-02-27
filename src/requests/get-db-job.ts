import { z } from "zod";

/**
 * Return the current JDBC job name.
 * Source: GetDbJob.java lines 15-17.
 */
export const GetDbJobRequest = z.object({
  id: z.string(),
  type: z.literal("getdbjob"),
});

export type GetDbJobRequest = z.infer<typeof GetDbJobRequest>;
