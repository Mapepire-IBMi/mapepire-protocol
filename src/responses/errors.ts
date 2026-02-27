import { z } from "zod";

/**
 * Base shape for all server error responses.
 */
const ErrorBase = z.object({
  id: z.string(),
  success: z.literal(false),
  error: z.string(),
  execution_time: z.number(),
});

/**
 * Response when the request is not valid JSON.
 * The `id` is auto-generated as `"unparseable_<N>"`.
 * Source: UnparsableReq.java lines 14-31.
 */
export const UnparsableError = ErrorBase.extend({
  unparseable: z.string(),
});

export type UnparsableError = z.infer<typeof UnparsableError>;

/**
 * Response when JSON is valid but missing required `type` or `id` fields.
 * The `id` is auto-generated as `"incomplete_<N>"`.
 * Source: IncompleteReq.java lines 13-31.
 */
export const IncompleteError = ErrorBase.extend({
  incomplete: z.string(),
});

export type IncompleteError = z.infer<typeof IncompleteError>;

/**
 * Response when the `type` value does not match any known handler.
 * Source: UnknownReq.java lines 17-19.
 */
export const UnknownError = ErrorBase;

export type UnknownError = z.infer<typeof UnknownError>;

/**
 * Response when a request has a known type but fails validation
 * (e.g., missing `cont_id` for sqlmore/sqlclose/execute).
 * Source: BadReq.java lines 18-20.
 */
export const BadRequestError = ErrorBase;

export type BadRequestError = z.infer<typeof BadRequestError>;
