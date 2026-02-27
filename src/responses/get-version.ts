import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `getversion` request.
 * Source: GetVersion.java lines 16-19.
 */
export const GetVersionResponse = BaseResponse.extend({
  build_date: z.string(),
  version: z.string(),
});

export type GetVersionResponse = z.infer<typeof GetVersionResponse>;
