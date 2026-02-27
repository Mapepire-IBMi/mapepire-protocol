import { z } from "zod";

/**
 * Close an open result set cursor and free server resources.
 * `cont_id` references the `id` of the original request whose cursor to close.
 * Source: CloseSqlCursor.java lines 19-27.
 */
export const SqlCloseRequest = z.object({
  id: z.string(),
  type: z.literal("sqlclose"),
  cont_id: z.string(),
});

export type SqlCloseRequest = z.infer<typeof SqlCloseRequest>;
