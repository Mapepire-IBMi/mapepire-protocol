import { z } from "zod";

/**
 * Common envelope shared by all client requests.
 * Every request must include a correlation `id` and a `type` discriminator.
 */
export const BaseRequest = z.object({
  id: z.string(),
  type: z.string(),
});

export type BaseRequest = z.infer<typeof BaseRequest>;

/**
 * Common envelope shared by all server responses.
 *
 * - `id` echoes the request correlation ID
 * - `success` indicates whether the operation completed without error
 * - `error`, `sql_rc`, `sql_state` are present only on failure
 * - `execution_time` is always present (milliseconds)
 */
export const BaseResponse = z.object({
  id: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  sql_rc: z.number().int().optional(),
  sql_state: z.string().optional(),
  execution_time: z.number(),
});

export type BaseResponse = z.infer<typeof BaseResponse>;
