import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `getdbjob` request.
 * Source: GetDbJob.java lines 15-17.
 */
export const GetDbJobResponse = BaseResponse.extend({
  job: z.string(),
});

export type GetDbJobResponse = z.infer<typeof GetDbJobResponse>;
