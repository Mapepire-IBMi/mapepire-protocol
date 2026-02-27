import { z } from "zod";
import { ConnectionTechnique } from "../enums.js";

/**
 * Establish (or re-establish) the JDBC database connection.
 * This must be the first message sent after WebSocket upgrade.
 * Source: Reconnect.java lines 18-41.
 */
export const ConnectRequest = z.object({
  id: z.string(),
  type: z.literal("connect"),
  props: z.string().optional(),
  technique: ConnectionTechnique.optional(),
  application: z.string().optional(),
});

export type ConnectRequest = z.infer<typeof ConnectRequest>;
