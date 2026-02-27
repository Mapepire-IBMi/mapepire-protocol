import { z } from "zod";

/**
 * Execute an IBM i CL (Control Language) command via QSYS2.QCMDEXC.
 * Returns job log messages produced by the command.
 * Source: RunCL.java lines 26-54.
 */
export const ClRequest = z.object({
  id: z.string(),
  type: z.literal("cl"),
  cmd: z.string(),
  terse: z.boolean().optional(),
});

export type ClRequest = z.infer<typeof ClRequest>;
