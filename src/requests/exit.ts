import { z } from "zod";

/**
 * Gracefully terminate the connection.
 * After the response is sent, the server closes the WebSocket (daemon mode)
 * or calls System.exit(0) (single mode).
 * Source: Exit.java lines 17-29.
 */
export const ExitRequest = z.object({
  id: z.string(),
  type: z.literal("exit"),
});

export type ExitRequest = z.infer<typeof ExitRequest>;
