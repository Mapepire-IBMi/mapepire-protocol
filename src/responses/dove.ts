import { z } from "zod";
import { BaseResponse } from "../base.js";
import { QueryMetaData } from "../shared/metadata.js";

/**
 * Response to a `dove` (Visual Explain) request.
 * Always returns Visual Explain metadata and data.
 * If `run=true` was set, also includes query result data.
 * Source: DoVe.java lines 28-103.
 */
export const DoveResponse = BaseResponse.extend({
  vemetadata: QueryMetaData,
  vedata: z.array(z.unknown()),
  metadata: QueryMetaData.optional(),
  data: z.array(z.unknown()).optional(),
  is_done: z.boolean().optional(),
});

export type DoveResponse = z.infer<typeof DoveResponse>;
