import { describe, it, expect } from "vitest";
import {
  ConnectResponse,
  QueryResult,
  PrepareSqlResponse,
  SqlMoreResponse,
  DoveResponse,
  PingResponse,
  GetDbJobResponse,
  GetVersionResponse,
  SetConfigResponse,
  GetTraceDataResponse,
  ExitResponse,
  UnparsableError,
  IncompleteError,
} from "../responses/index.js";

const baseSuccess = {
  id: "1",
  success: true,
  execution_time: 42,
};

const baseError = {
  id: "1",
  success: false,
  error: "Something went wrong",
  execution_time: 5,
};

describe("ConnectResponse", () => {
  it("accepts valid response", () => {
    const result = ConnectResponse.parse({
      ...baseSuccess,
      job: "123456/MYUSER/QZDASOINIT",
    });
    expect(result.job).toBe("123456/MYUSER/QZDASOINIT");
  });

  it("rejects missing job", () => {
    expect(() => ConnectResponse.parse(baseSuccess)).toThrow();
  });
});

describe("QueryResult", () => {
  it("accepts sql response with results", () => {
    const result = QueryResult.parse({
      ...baseSuccess,
      has_results: true,
      update_count: -1,
      metadata: {
        column_count: 2,
        job: "123/USER/JOB",
        columns: [
          {
            name: "ID",
            type: "INTEGER",
            display_size: 11,
            label: "ID",
            precision: 10,
            scale: 0,
            autoIncrement: false,
            nullable: 1,
            readOnly: false,
            writeable: true,
            table: "MYTABLE",
          },
          {
            name: "NAME",
            type: "VARCHAR",
            display_size: 50,
            label: "NAME",
            precision: 50,
            scale: 0,
            autoIncrement: false,
            nullable: 1,
            readOnly: false,
            writeable: true,
            table: "MYTABLE",
          },
        ],
      },
      data: [
        { ID: 1, NAME: "Alice" },
        { ID: 2, NAME: "Bob" },
      ],
      is_done: true,
    });
    expect(result.has_results).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it("accepts update response without results", () => {
    const result = QueryResult.parse({
      ...baseSuccess,
      has_results: false,
      update_count: 3,
      data: [],
      is_done: true,
    });
    expect(result.update_count).toBe(3);
    expect(result.has_results).toBe(false);
  });

  it("accepts response with output parameters", () => {
    const result = QueryResult.parse({
      ...baseSuccess,
      has_results: false,
      update_count: 0,
      data: [],
      is_done: true,
      parameter_count: 2,
      output_parms: [
        {
          index: 1,
          type: "INTEGER",
          precision: 10,
          scale: 0,
          name: "P1",
          value: 42,
        },
      ],
    });
    expect(result.output_parms).toHaveLength(1);
    expect(result.output_parms![0]!.value).toBe(42);
  });

  it("accepts terse data (arrays instead of objects)", () => {
    const result = QueryResult.parse({
      ...baseSuccess,
      has_results: true,
      update_count: -1,
      data: [
        [1, "Alice"],
        [2, "Bob"],
      ],
      is_done: true,
    });
    expect(result.data).toHaveLength(2);
  });

  it("accepts error response with sql details", () => {
    const result = QueryResult.parse({
      ...baseError,
      sql_rc: -204,
      sql_state: "42704",
      has_results: false,
      update_count: 0,
      data: [],
      is_done: true,
    });
    expect(result.success).toBe(false);
    expect(result.sql_rc).toBe(-204);
  });
});

describe("PrepareSqlResponse", () => {
  it("accepts valid response with parameters", () => {
    const result = PrepareSqlResponse.parse({
      ...baseSuccess,
      metadata: {
        column_count: 1,
        job: "123/USER/JOB",
        columns: [
          {
            name: "ID",
            type: "INTEGER",
            display_size: 11,
            label: "ID",
            precision: 10,
            scale: 0,
            autoIncrement: false,
            nullable: 0,
            readOnly: true,
            writeable: false,
            table: "T",
          },
        ],
        parameters: [
          {
            type: "INTEGER",
            mode: "IN",
            precision: 10,
            scale: 0,
            name: "P1",
          },
        ],
      },
      parameter_count: 1,
    });
    expect(result.parameter_count).toBe(1);
    expect(result.metadata.parameters).toHaveLength(1);
  });
});

describe("SqlMoreResponse", () => {
  it("accepts valid response", () => {
    const result = SqlMoreResponse.parse({
      ...baseSuccess,
      data: [{ ID: 3 }, { ID: 4 }],
      is_done: false,
    });
    expect(result.is_done).toBe(false);
    expect(result.data).toHaveLength(2);
  });
});

describe("DoveResponse", () => {
  it("accepts response without run results", () => {
    const result = DoveResponse.parse({
      ...baseSuccess,
      vemetadata: {
        column_count: 1,
        job: "123/USER/JOB",
        columns: [
          {
            name: "VE_COL",
            type: "VARCHAR",
            display_size: 100,
            label: "VE_COL",
            precision: 100,
            scale: 0,
            autoIncrement: false,
            nullable: 1,
            readOnly: true,
            writeable: false,
            table: "",
          },
        ],
      },
      vedata: [{ VE_COL: "explain data" }],
    });
    expect(result.vedata).toHaveLength(1);
    expect(result.metadata).toBeUndefined();
  });
});

describe("PingResponse", () => {
  it("accepts valid response", () => {
    const result = PingResponse.parse({
      ...baseSuccess,
      alive: true,
      db_alive: true,
    });
    expect(result.alive).toBe(true);
    expect(result.db_alive).toBe(true);
  });
});

describe("GetDbJobResponse", () => {
  it("accepts valid response", () => {
    const result = GetDbJobResponse.parse({
      ...baseSuccess,
      job: "123456/MYUSER/QZDASOINIT",
    });
    expect(result.job).toContain("MYUSER");
  });
});

describe("GetVersionResponse", () => {
  it("accepts valid response", () => {
    const result = GetVersionResponse.parse({
      ...baseSuccess,
      build_date: "2024-08-08T12:00:00Z",
      version: "2.0.0-rc1",
    });
    expect(result.version).toBe("2.0.0-rc1");
  });
});

describe("SetConfigResponse", () => {
  it("accepts valid response", () => {
    const result = SetConfigResponse.parse({
      ...baseSuccess,
      tracedest: "FILE",
      tracelevel: "OFF",
      jtopentracedest: "IN_MEM",
      jtopentracelevel: "ON",
    });
    expect(result.tracedest).toBe("FILE");
  });
});

describe("GetTraceDataResponse", () => {
  it("accepts valid response", () => {
    const result = GetTraceDataResponse.parse({
      ...baseSuccess,
      tracedata: "<html>trace data</html>",
      jtopentracedata: "jtopen trace output",
    });
    expect(result.tracedata).toContain("trace data");
  });
});

describe("ExitResponse", () => {
  it("accepts valid response", () => {
    const result = ExitResponse.parse(baseSuccess);
    expect(result.success).toBe(true);
  });
});

describe("Error responses", () => {
  it("parses UnparsableError", () => {
    const result = UnparsableError.parse({
      id: "unparseable_1",
      success: false,
      error: "Non-parseable request: '{bad json'",
      execution_time: 0,
      unparseable: "{bad json",
    });
    expect(result.unparseable).toBe("{bad json");
  });

  it("parses IncompleteError", () => {
    const result = IncompleteError.parse({
      id: "incomplete_1",
      success: false,
      error: "Request is missing required fields",
      execution_time: 0,
      incomplete: '{"sql":"SELECT 1"}',
    });
    expect(result.incomplete).toContain("sql");
  });

  it("rejects UnparsableError with success=true", () => {
    expect(() =>
      UnparsableError.parse({
        id: "unparseable_1",
        success: true,
        error: "err",
        execution_time: 0,
        unparseable: "x",
      }),
    ).toThrow();
  });
});
