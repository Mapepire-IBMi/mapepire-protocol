import { z } from "zod";

/**
 * Metadata for a single result set column.
 * Source: BlockRetrievableRequest.java lines 157-180.
 */
export const ColumnMetaData = z.object({
  name: z.string(),
  type: z.string(),
  display_size: z.number().int(),
  label: z.string(),
  precision: z.number().int(),
  scale: z.number().int(),
  autoIncrement: z.boolean().optional(),
  nullable: z.number().int().optional(),
  readOnly: z.boolean().optional(),
  writeable: z.boolean().optional(),
  table: z.string().optional(),
});

export type ColumnMetaData = z.infer<typeof ColumnMetaData>;

/**
 * Result set metadata returned by query-producing handlers.
 * Source: BlockRetrievableRequest.java lines 157-180, PrepareSql.java lines 39-78.
 */
export const QueryMetaData = z.object({
  column_count: z.number().int(),
  job: z.string(),
  columns: z.array(ColumnMetaData),
});

export type QueryMetaData = z.infer<typeof QueryMetaData>;
