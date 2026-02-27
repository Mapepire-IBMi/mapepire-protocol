import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `connect` request.
 * Returns the IBM i job name for the established JDBC connection.
 * Source: Reconnect.java lines 18-41.
 */
export const ConnectResponse = BaseResponse.extend({
  job: z.string(),
});

export type ConnectResponse = z.infer<typeof ConnectResponse>;
