import { z } from "zod";

/**
 * A single IBM i job log entry returned by CL command execution.
 * Source: RunCL.java job log query columns.
 */
export const JobLogEntry = z.object({
  MESSAGE_ID: z.string(),
  SEVERITY: z.number().int(),
  MESSAGE_TIMESTAMP: z.string(),
  FROM_LIBRARY: z.string(),
  FROM_PROGRAM: z.string(),
  MESSAGE_TYPE: z.string(),
  MESSAGE_TEXT: z.string(),
  MESSAGE_SECOND_LEVEL_TEXT: z.string(),
});

export type JobLogEntry = z.infer<typeof JobLogEntry>;
