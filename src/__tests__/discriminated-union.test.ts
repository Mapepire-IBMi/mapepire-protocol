import { describe, it, expect } from "vitest";
import { MapepireRequest } from "../index.js";

describe("MapepireRequest discriminated union", () => {
  it("parses a connect request", () => {
    const result = MapepireRequest.parse({
      id: "1",
      type: "connect",
      technique: "tcp",
    });
    expect(result.type).toBe("connect");
    if (result.type === "connect") {
      expect(result.technique).toBe("tcp");
    }
  });

  it("parses a sql request", () => {
    const result = MapepireRequest.parse({
      id: "2",
      type: "sql",
      sql: "SELECT 1 FROM SYSIBM.SYSDUMMY1",
    });
    expect(result.type).toBe("sql");
    if (result.type === "sql") {
      expect(result.sql).toContain("SELECT");
    }
  });

  it("parses a prepare_sql request", () => {
    const result = MapepireRequest.parse({
      id: "3",
      type: "prepare_sql",
      sql: "SELECT * FROM T WHERE ID = ?",
    });
    expect(result.type).toBe("prepare_sql");
  });

  it("parses a prepare_sql_execute request", () => {
    const result = MapepireRequest.parse({
      id: "4",
      type: "prepare_sql_execute",
      sql: "INSERT INTO T VALUES(?, ?)",
      parameters: [1, "hello"],
    });
    expect(result.type).toBe("prepare_sql_execute");
    if (result.type === "prepare_sql_execute") {
      expect(result.parameters).toEqual([1, "hello"]);
    }
  });

  it("parses an execute request", () => {
    const result = MapepireRequest.parse({
      id: "5",
      type: "execute",
      cont_id: "3",
      parameters: [42],
    });
    expect(result.type).toBe("execute");
    if (result.type === "execute") {
      expect(result.cont_id).toBe("3");
    }
  });

  it("parses a sqlmore request", () => {
    const result = MapepireRequest.parse({
      id: "6",
      type: "sqlmore",
      cont_id: "2",
      rows: 500,
    });
    expect(result.type).toBe("sqlmore");
  });

  it("parses a sqlclose request", () => {
    const result = MapepireRequest.parse({
      id: "7",
      type: "sqlclose",
      cont_id: "2",
    });
    expect(result.type).toBe("sqlclose");
  });

  it("parses a cl request", () => {
    const result = MapepireRequest.parse({
      id: "8",
      type: "cl",
      cmd: "DSPLIB MYLIB",
    });
    expect(result.type).toBe("cl");
    if (result.type === "cl") {
      expect(result.cmd).toBe("DSPLIB MYLIB");
    }
  });

  it("parses a dove request", () => {
    const result = MapepireRequest.parse({
      id: "9",
      type: "dove",
      sql: "SELECT * FROM T",
      run: true,
    });
    expect(result.type).toBe("dove");
    if (result.type === "dove") {
      expect(result.run).toBe(true);
    }
  });

  it("parses a ping request", () => {
    const result = MapepireRequest.parse({ id: "10", type: "ping" });
    expect(result.type).toBe("ping");
  });

  it("parses a getdbjob request", () => {
    const result = MapepireRequest.parse({ id: "11", type: "getdbjob" });
    expect(result.type).toBe("getdbjob");
  });

  it("parses a getversion request", () => {
    const result = MapepireRequest.parse({ id: "12", type: "getversion" });
    expect(result.type).toBe("getversion");
  });

  it("parses a setconfig request", () => {
    const result = MapepireRequest.parse({
      id: "13",
      type: "setconfig",
      tracelevel: "ERRORS",
    });
    expect(result.type).toBe("setconfig");
  });

  it("parses a gettracedata request", () => {
    const result = MapepireRequest.parse({ id: "14", type: "gettracedata" });
    expect(result.type).toBe("gettracedata");
  });

  it("parses an exit request", () => {
    const result = MapepireRequest.parse({ id: "15", type: "exit" });
    expect(result.type).toBe("exit");
  });

  it("rejects unknown type", () => {
    expect(() =>
      MapepireRequest.parse({ id: "99", type: "unknown_type" }),
    ).toThrow();
  });

  it("rejects missing type", () => {
    expect(() => MapepireRequest.parse({ id: "99" })).toThrow();
  });

  it("rejects missing id", () => {
    expect(() => MapepireRequest.parse({ type: "ping" })).toThrow();
  });

  it("rejects empty object", () => {
    expect(() => MapepireRequest.parse({})).toThrow();
  });
});
