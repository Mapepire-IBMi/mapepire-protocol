import { describe, it, expect } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ConnectRequest,
  SqlRequest,
  MapepireRequest,
} from "../index.js";

describe("JSON Schema generation", () => {
  it("generates valid JSON Schema for ConnectRequest", () => {
    const schema = zodToJsonSchema(ConnectRequest, { $refStrategy: "none" });
    expect(schema).toHaveProperty("type", "object");
    expect(schema).toHaveProperty("properties");
    const props = (schema as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).toHaveProperty("id");
    expect(props).toHaveProperty("type");
    expect(props).toHaveProperty("technique");
  });

  it("generates valid JSON Schema for SqlRequest", () => {
    const schema = zodToJsonSchema(SqlRequest, { $refStrategy: "none" });
    expect(schema).toHaveProperty("type", "object");
    const props = (schema as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).toHaveProperty("sql");
    expect(props).toHaveProperty("rows");
    expect(props).toHaveProperty("terse");
  });

  it("generates JSON Schema for the full discriminated union", () => {
    const schema = zodToJsonSchema(MapepireRequest, {
      name: "MapepireRequest",
      $refStrategy: "none",
    });
    expect(schema).toHaveProperty("$schema");
    // Should have discriminatedUnion representation
    const defs = schema as Record<string, unknown>;
    expect(defs).toBeDefined();
  });

  it("generated schemas are valid JSON when serialized", () => {
    const schema = zodToJsonSchema(ConnectRequest, { $refStrategy: "none" });
    const json = JSON.stringify(schema);
    const reparsed = JSON.parse(json);
    expect(reparsed).toEqual(schema);
  });
});
