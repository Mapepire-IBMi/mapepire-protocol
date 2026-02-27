import { describe, it, expect } from "vitest";
import {
  ConnectRequest,
  SqlRequest,
  PrepareSqlRequest,
  PrepareSqlExecuteRequest,
  ExecuteRequest,
  SqlMoreRequest,
  SqlCloseRequest,
  ClRequest,
  DoveRequest,
  PingRequest,
  GetDbJobRequest,
  GetVersionRequest,
  SetConfigRequest,
  GetTraceDataRequest,
  ExitRequest,
} from "../requests/index.js";

describe("ConnectRequest", () => {
  it("accepts minimal request", () => {
    const result = ConnectRequest.parse({ id: "1", type: "connect" });
    expect(result.type).toBe("connect");
    expect(result.id).toBe("1");
  });

  it("accepts all optional fields", () => {
    const result = ConnectRequest.parse({
      id: "1",
      type: "connect",
      props: "naming=system;libraries=MYLIB",
      technique: "tcp",
      application: "my-app",
    });
    expect(result.technique).toBe("tcp");
    expect(result.props).toBe("naming=system;libraries=MYLIB");
    expect(result.application).toBe("my-app");
  });

  it("rejects invalid technique", () => {
    expect(() =>
      ConnectRequest.parse({ id: "1", type: "connect", technique: "invalid" }),
    ).toThrow();
  });

  it("rejects wrong type literal", () => {
    expect(() =>
      ConnectRequest.parse({ id: "1", type: "sql" }),
    ).toThrow();
  });
});

describe("SqlRequest", () => {
  it("accepts minimal request", () => {
    const result = SqlRequest.parse({ id: "2", type: "sql", sql: "SELECT 1" });
    expect(result.sql).toBe("SELECT 1");
  });

  it("accepts rows and terse", () => {
    const result = SqlRequest.parse({
      id: "2",
      type: "sql",
      sql: "SELECT * FROM MYLIB.MYTABLE",
      rows: 500,
      terse: true,
    });
    expect(result.rows).toBe(500);
    expect(result.terse).toBe(true);
  });

  it("rejects missing sql field", () => {
    expect(() => SqlRequest.parse({ id: "2", type: "sql" })).toThrow();
  });

  it("rejects non-positive rows", () => {
    expect(() =>
      SqlRequest.parse({ id: "2", type: "sql", sql: "SELECT 1", rows: 0 }),
    ).toThrow();
    expect(() =>
      SqlRequest.parse({ id: "2", type: "sql", sql: "SELECT 1", rows: -1 }),
    ).toThrow();
  });
});

describe("PrepareSqlRequest", () => {
  it("accepts valid request", () => {
    const result = PrepareSqlRequest.parse({
      id: "3",
      type: "prepare_sql",
      sql: "SELECT * FROM T WHERE ID = ?",
    });
    expect(result.type).toBe("prepare_sql");
  });
});

describe("PrepareSqlExecuteRequest", () => {
  it("accepts with flat parameters", () => {
    const result = PrepareSqlExecuteRequest.parse({
      id: "4",
      type: "prepare_sql_execute",
      sql: "INSERT INTO T VALUES(?, ?)",
      parameters: [1, "hello"],
    });
    expect(result.parameters).toEqual([1, "hello"]);
  });

  it("accepts batch parameters (array-of-arrays)", () => {
    const result = PrepareSqlExecuteRequest.parse({
      id: "4",
      type: "prepare_sql_execute",
      sql: "INSERT INTO T VALUES(?, ?)",
      parameters: [
        [1, "a"],
        [2, "b"],
      ],
    });
    expect(result.parameters).toHaveLength(2);
  });

  it("rejects missing parameters", () => {
    expect(() =>
      PrepareSqlExecuteRequest.parse({
        id: "4",
        type: "prepare_sql_execute",
        sql: "INSERT INTO T VALUES(?)",
      }),
    ).toThrow();
  });
});

describe("ExecuteRequest", () => {
  it("accepts valid request", () => {
    const result = ExecuteRequest.parse({
      id: "5",
      type: "execute",
      cont_id: "3",
      parameters: [42],
    });
    expect(result.cont_id).toBe("3");
  });

  it("rejects missing cont_id", () => {
    expect(() =>
      ExecuteRequest.parse({
        id: "5",
        type: "execute",
        parameters: [42],
      }),
    ).toThrow();
  });
});

describe("SqlMoreRequest", () => {
  it("accepts valid request", () => {
    const result = SqlMoreRequest.parse({
      id: "6",
      type: "sqlmore",
      cont_id: "2",
    });
    expect(result.cont_id).toBe("2");
  });

  it("accepts optional rows", () => {
    const result = SqlMoreRequest.parse({
      id: "6",
      type: "sqlmore",
      cont_id: "2",
      rows: 100,
    });
    expect(result.rows).toBe(100);
  });
});

describe("SqlCloseRequest", () => {
  it("accepts valid request", () => {
    const result = SqlCloseRequest.parse({
      id: "7",
      type: "sqlclose",
      cont_id: "2",
    });
    expect(result.cont_id).toBe("2");
  });

  it("rejects missing cont_id", () => {
    expect(() =>
      SqlCloseRequest.parse({ id: "7", type: "sqlclose" }),
    ).toThrow();
  });
});

describe("ClRequest", () => {
  it("accepts valid request", () => {
    const result = ClRequest.parse({
      id: "8",
      type: "cl",
      cmd: "CRTLIB LIB(TESTLIB)",
    });
    expect(result.cmd).toBe("CRTLIB LIB(TESTLIB)");
  });
});

describe("DoveRequest", () => {
  it("accepts minimal request", () => {
    const result = DoveRequest.parse({
      id: "9",
      type: "dove",
      sql: "SELECT * FROM T",
    });
    expect(result.run).toBeUndefined();
  });

  it("accepts run as boolean", () => {
    const result = DoveRequest.parse({
      id: "9",
      type: "dove",
      sql: "SELECT * FROM T",
      run: true,
    });
    expect(result.run).toBe(true);
  });
});

describe("PingRequest", () => {
  it("accepts valid request", () => {
    const result = PingRequest.parse({ id: "10", type: "ping" });
    expect(result.type).toBe("ping");
  });
});

describe("GetDbJobRequest", () => {
  it("accepts valid request", () => {
    const result = GetDbJobRequest.parse({ id: "11", type: "getdbjob" });
    expect(result.type).toBe("getdbjob");
  });
});

describe("GetVersionRequest", () => {
  it("accepts valid request", () => {
    const result = GetVersionRequest.parse({ id: "12", type: "getversion" });
    expect(result.type).toBe("getversion");
  });
});

describe("SetConfigRequest", () => {
  it("accepts minimal request", () => {
    const result = SetConfigRequest.parse({ id: "13", type: "setconfig" });
    expect(result.type).toBe("setconfig");
  });

  it("accepts all trace options", () => {
    const result = SetConfigRequest.parse({
      id: "13",
      type: "setconfig",
      tracedest: "FILE",
      tracelevel: "DATASTREAM",
      jtopentracedest: "IN_MEM",
      jtopentracelevel: "ERRORS",
    });
    expect(result.tracedest).toBe("FILE");
    expect(result.tracelevel).toBe("DATASTREAM");
  });

  it("rejects invalid trace level", () => {
    expect(() =>
      SetConfigRequest.parse({
        id: "13",
        type: "setconfig",
        tracelevel: "VERBOSE",
      }),
    ).toThrow();
  });
});

describe("GetTraceDataRequest", () => {
  it("accepts valid request", () => {
    const result = GetTraceDataRequest.parse({
      id: "14",
      type: "gettracedata",
    });
    expect(result.type).toBe("gettracedata");
  });
});

describe("ExitRequest", () => {
  it("accepts valid request", () => {
    const result = ExitRequest.parse({ id: "15", type: "exit" });
    expect(result.type).toBe("exit");
  });
});
