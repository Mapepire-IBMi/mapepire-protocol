import { z } from "zod";
import { ServerTraceDest, ServerTraceLevel } from "../enums.js";

/**
 * Configure server tracing settings at runtime.
 * Omitted fields leave the current setting unchanged.
 * Source: SetConfig.java lines 19-68.
 */
export const SetConfigRequest = z.object({
  id: z.string(),
  type: z.literal("setconfig"),
  tracedest: ServerTraceDest.optional(),
  tracelevel: ServerTraceLevel.optional(),
  jtopentracedest: ServerTraceDest.optional(),
  jtopentracelevel: ServerTraceLevel.optional(),
});

export type SetConfigRequest = z.infer<typeof SetConfigRequest>;
