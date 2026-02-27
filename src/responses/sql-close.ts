import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `sqlclose` request.
 * No additional fields beyond the base response envelope.
 * Source: CloseSqlCursor.java lines 19-27.
 */
export const SqlCloseResponse = BaseResponse;

export type SqlCloseResponse = z.infer<typeof SqlCloseResponse>;
