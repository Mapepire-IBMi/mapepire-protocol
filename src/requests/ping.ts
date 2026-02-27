import { z } from "zod";

/**
 * Health check for server and database connection.
 * Source: Ping.java lines 17-21.
 */
export const PingRequest = z.object({
  id: z.string(),
  type: z.literal("ping"),
});

export type PingRequest = z.infer<typeof PingRequest>;
