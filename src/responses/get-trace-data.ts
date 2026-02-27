import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `gettracedata` request.
 * Source: GetTraceData.java lines 16-20.
 */
export const GetTraceDataResponse = BaseResponse.extend({
  tracedata: z.string(),
  jtopentracedata: z.string(),
});

export type GetTraceDataResponse = z.infer<typeof GetTraceDataResponse>;
