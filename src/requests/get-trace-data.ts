import { z } from "zod";

/**
 * Retrieve accumulated server trace/log data.
 * Source: GetTraceData.java lines 16-20.
 */
export const GetTraceDataRequest = z.object({
  id: z.string(),
  type: z.literal("gettracedata"),
});

export type GetTraceDataRequest = z.infer<typeof GetTraceDataRequest>;
