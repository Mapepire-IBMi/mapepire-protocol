import { z } from "zod";
import { BaseResponse } from "../base.js";

/**
 * Response to a `ping` request.
 * Source: Ping.java lines 17-21.
 */
export const PingResponse = BaseResponse.extend({
  alive: z.boolean(),
  db_alive: z.boolean(),
});

export type PingResponse = z.infer<typeof PingResponse>;
