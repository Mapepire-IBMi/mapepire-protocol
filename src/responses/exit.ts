import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to an `exit` request.
 * No additional fields beyond the base response envelope.
 * Source: Exit.java lines 17-29.
 */
export const ExitResponse = BaseResponse;

export type ExitResponse = z.infer<typeof ExitResponse>;
