"""
Test the generated Pydantic models from datamodel-code-generator.
Verifies that the models accept valid data, reject invalid data,
and that field types match the protocol spec.
"""

import pytest
from pydantic import ValidationError

from mapepire_protocol.requests.sql_request import UsqlUrequest as SqlRequest
from mapepire_protocol.requests.connect_request import (
    UconnectUrequest as ConnectRequest,
    Technique,
)
from mapepire_protocol.requests.prepare_sql_execute_request import (
    UprepareUsqlUexecuteUrequest as PrepareSqlExecuteRequest,
)
from mapepire_protocol.requests.execute_request import (
    UexecuteUrequest as ExecuteRequest,
)
from mapepire_protocol.requests.sql_more_request import (
    UsqlUmoreUrequest as SqlMoreRequest,
)
from mapepire_protocol.requests.sql_close_request import (
    UsqlUcloseUrequest as SqlCloseRequest,
)
from mapepire_protocol.requests.cl_request import UclUrequest as ClRequest
from mapepire_protocol.requests.dove_request import UdoveUrequest as DoveRequest
from mapepire_protocol.requests.ping_request import UpingUrequest as PingRequest
from mapepire_protocol.requests.exit_request import UexitUrequest as ExitRequest
from mapepire_protocol.requests.set_config_request import (
    UsetUconfigUrequest as SetConfigRequest,
)

from mapepire_protocol.responses.query_result import (
    Model as QueryResult,
    Column,
    Metadata,
    OutputParm,
    Mode,
)
from mapepire_protocol.responses.ping_response import UpingUresponse as PingResponse
from mapepire_protocol.responses.connect_response import (
    UconnectUresponse as ConnectResponse,
)
from mapepire_protocol.responses.get_version_response import (
    UgetUversionUresponse as GetVersionResponse,
)
from mapepire_protocol.responses.unparsable_error import (
    UunparsableUerror as UnparsableError,
)


# ---------------------------------------------------------------------------
# Request model tests
# ---------------------------------------------------------------------------


class TestRequestModels:
    """Verify generated Pydantic models for request schemas."""

    def test_sql_request(self):
        req = SqlRequest(id="1", type="sql", sql="SELECT * FROM T")
        assert req.type == "sql"
        assert req.sql == "SELECT * FROM T"
        assert req.rows is None
        assert req.terse is None

    def test_sql_request_with_options(self):
        req = SqlRequest(id="1", type="sql", sql="SELECT 1", rows=100, terse=True)
        assert req.rows == 100
        assert req.terse is True

    def test_sql_request_rejects_zero_rows(self):
        with pytest.raises(ValidationError):
            SqlRequest(id="1", type="sql", sql="SELECT 1", rows=0)

    def test_sql_request_rejects_negative_rows(self):
        with pytest.raises(ValidationError):
            SqlRequest(id="1", type="sql", sql="SELECT 1", rows=-5)

    def test_connect_request(self):
        req = ConnectRequest(
            id="1",
            type="connect",
            technique=Technique.tcp,
            props="naming=system",
            application="test-app",
        )
        assert req.technique == Technique.tcp
        assert req.props == "naming=system"

    def test_connect_request_minimal(self):
        req = ConnectRequest(id="1", type="connect")
        assert req.technique is None
        assert req.props is None

    def test_prepare_sql_execute_request(self):
        req = PrepareSqlExecuteRequest(
            id="4",
            type="prepare_sql_execute",
            sql="INSERT INTO T VALUES(?, ?)",
            parameters=[1, "hello"],
        )
        assert req.parameters == [1, "hello"]

    def test_execute_request(self):
        req = ExecuteRequest(
            id="5", type="execute", cont_id="3", parameters=[42, None]
        )
        assert req.cont_id == "3"
        assert req.parameters == [42, None]

    def test_sqlmore_request(self):
        req = SqlMoreRequest(id="6", type="sqlmore", cont_id="2", rows=500)
        assert req.cont_id == "2"
        assert req.rows == 500

    def test_sqlclose_request(self):
        req = SqlCloseRequest(id="7", type="sqlclose", cont_id="2")
        assert req.cont_id == "2"

    def test_cl_request(self):
        req = ClRequest(id="8", type="cl", cmd="DSPLIB MYLIB")
        assert req.cmd == "DSPLIB MYLIB"

    def test_dove_request_with_run(self):
        req = DoveRequest(id="9", type="dove", sql="SELECT * FROM T", run=True)
        assert req.run is True

    def test_ping_request(self):
        req = PingRequest(id="10", type="ping")
        assert req.type == "ping"

    def test_exit_request(self):
        req = ExitRequest(id="15", type="exit")
        assert req.type == "exit"

    def test_setconfig_request(self):
        req = SetConfigRequest(
            id="13", type="setconfig", tracedest="FILE", tracelevel="DATASTREAM"
        )
        assert req.tracedest.value == "FILE"
        assert req.tracelevel.value == "DATASTREAM"

    def test_serialization_round_trip(self):
        """Construct model -> serialize to dict -> deserialize back."""
        req = SqlRequest(id="1", type="sql", sql="SELECT 1", rows=100)
        data = req.model_dump()
        restored = SqlRequest.model_validate(data)
        assert restored == req

    def test_json_round_trip(self):
        """Construct model -> serialize to JSON string -> deserialize back."""
        req = SqlRequest(id="1", type="sql", sql="SELECT 1", rows=100, terse=True)
        json_str = req.model_dump_json()
        restored = SqlRequest.model_validate_json(json_str)
        assert restored == req


# ---------------------------------------------------------------------------
# Response model tests
# ---------------------------------------------------------------------------


class TestResponseModels:
    """Verify generated Pydantic models for response schemas."""

    def test_connect_response(self):
        resp = ConnectResponse(
            id="1",
            success=True,
            execution_time=42,
            job="123456/MYUSER/QZDASOINIT",
        )
        assert resp.job == "123456/MYUSER/QZDASOINIT"

    def test_ping_response(self):
        resp = PingResponse(
            id="10",
            success=True,
            execution_time=1,
            alive=True,
            db_alive=True,
        )
        assert resp.alive is True
        assert resp.db_alive is True

    def test_get_version_response(self):
        resp = GetVersionResponse(
            id="12",
            success=True,
            execution_time=3,
            build_date="2024-08-08T12:00:00Z",
            version="2.0.0-rc1",
        )
        assert resp.version == "2.0.0-rc1"

    def test_query_result_with_metadata(self):
        resp = QueryResult(
            id="2",
            success=True,
            execution_time=15,
            has_results=True,
            update_count=-1,
            metadata=Metadata(
                column_count=1,
                job="123/USER/JOB",
                columns=[
                    Column(
                        name="ID",
                        type="INTEGER",
                        display_size=11,
                        label="ID",
                        precision=10,
                        scale=0,
                        autoIncrement=False,
                        nullable=1,
                        readOnly=False,
                        writeable=True,
                        table="MYTABLE",
                    )
                ],
            ),
            data=[{"ID": 1}, {"ID": 2}],
            is_done=True,
        )
        assert resp.has_results is True
        assert len(resp.data) == 2
        assert resp.metadata.columns[0].name == "ID"

    def test_query_result_with_output_parms(self):
        resp = QueryResult(
            id="5",
            success=True,
            execution_time=10,
            has_results=False,
            update_count=0,
            data=[],
            is_done=True,
            output_parms=[
                OutputParm(
                    index=1,
                    type="INTEGER",
                    precision=10,
                    scale=0,
                    name="P1",
                    value=42,
                )
            ],
        )
        assert resp.output_parms[0].value == 42

    def test_parameter_mode_enum(self):
        assert Mode.IN.value == "IN"
        assert Mode.OUT.value == "OUT"
        assert Mode.INOUT.value == "INOUT"
        assert Mode.UNKNOWN.value == "UNKNOWN"

    def test_unparsable_error(self):
        err = UnparsableError(
            id="unparseable_1",
            success=False,
            error="Non-parseable request",
            execution_time=0,
            unparseable="{bad json",
        )
        assert err.success is False
        assert err.unparseable == "{bad json"

    def test_unparsable_error_rejects_success_true(self):
        with pytest.raises(ValidationError):
            UnparsableError(
                id="unparseable_1",
                success=True,
                error="err",
                execution_time=0,
                unparseable="x",
            )

    def test_response_json_round_trip(self):
        resp = PingResponse(
            id="10",
            success=True,
            execution_time=1,
            alive=True,
            db_alive=False,
        )
        json_str = resp.model_dump_json()
        restored = PingResponse.model_validate_json(json_str)
        assert restored == resp
