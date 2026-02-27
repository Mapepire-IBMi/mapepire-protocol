import { describe, it, expect } from "vitest";
import { MapepireRequest } from "../index.js";

describe("Round-trip serialization", () => {
  const testCases = [
    {
      name: "connect",
      message: {
        id: "1",
        type: "connect" as const,
        props: "naming=system",
        technique: "tcp" as const,
        application: "test-app",
      },
    },
    {
      name: "sql",
      message: {
        id: "2",
        type: "sql" as const,
        sql: "SELECT * FROM SYSIBM.SYSDUMMY1",
        rows: 100,
        terse: true,
      },
    },
    {
      name: "prepare_sql",
      message: {
        id: "3",
        type: "prepare_sql" as const,
        sql: "SELECT * FROM T WHERE ID = ?",
        terse: false,
      },
    },
    {
      name: "prepare_sql_execute",
      message: {
        id: "4",
        type: "prepare_sql_execute" as const,
        sql: "INSERT INTO T VALUES(?, ?)",
        parameters: [1, "hello"],
        rows: 50,
      },
    },
    {
      name: "execute",
      message: {
        id: "5",
        type: "execute" as const,
        cont_id: "3",
        parameters: [42, null],
        rows: 1000,
      },
    },
    {
      name: "sqlmore",
      message: {
        id: "6",
        type: "sqlmore" as const,
        cont_id: "2",
        rows: 500,
      },
    },
    {
      name: "sqlclose",
      message: {
        id: "7",
        type: "sqlclose" as const,
        cont_id: "2",
      },
    },
    {
      name: "cl",
      message: {
        id: "8",
        type: "cl" as const,
        cmd: "DSPLIB MYLIB",
        terse: false,
      },
    },
    {
      name: "dove",
      message: {
        id: "9",
        type: "dove" as const,
        sql: "SELECT * FROM T",
        run: true,
        rows: 100,
        terse: true,
      },
    },
    {
      name: "ping",
      message: { id: "10", type: "ping" as const },
    },
    {
      name: "getdbjob",
      message: { id: "11", type: "getdbjob" as const },
    },
    {
      name: "getversion",
      message: { id: "12", type: "getversion" as const },
    },
    {
      name: "setconfig",
      message: {
        id: "13",
        type: "setconfig" as const,
        tracedest: "FILE" as const,
        tracelevel: "DATASTREAM" as const,
      },
    },
    {
      name: "gettracedata",
      message: { id: "14", type: "gettracedata" as const },
    },
    {
      name: "exit",
      message: { id: "15", type: "exit" as const },
    },
  ];

  for (const { name, message } of testCases) {
    it(`round-trips ${name} through JSON`, () => {
      // Serialize to JSON string
      const json = JSON.stringify(message);

      // Parse back from JSON string
      const parsed = JSON.parse(json);

      // Validate with Zod schema
      const result = MapepireRequest.parse(parsed);

      // Verify all fields match
      expect(result).toEqual(message);
    });
  }
});
