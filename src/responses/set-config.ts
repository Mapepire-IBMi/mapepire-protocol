import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `setconfig` request.
 * Returns current trace settings after applying updates.
 * Source: SetConfig.java lines 19-68.
 */
export const SetConfigResponse = BaseResponse.extend({
  tracedest: z.string(),
  tracelevel: z.string(),
  jtopentracedest: z.string(),
  jtopentracelevel: z.string(),
});

export type SetConfigResponse = z.infer<typeof SetConfigResponse>;
