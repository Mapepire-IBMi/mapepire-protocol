import { z } from "zod";

/**
 * Return the server version and build date.
 * Source: GetVersion.java lines 16-19.
 */
export const GetVersionRequest = z.object({
  id: z.string(),
  type: z.literal("getversion"),
});

export type GetVersionRequest = z.infer<typeof GetVersionRequest>;
