import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.connection import Base
from app.models.entities import (
    Project, WorkflowStage, StageState, Requirement, Design, DesignVersion, Simulation
)
from app.services.workflow_engine import WorkflowEngine
from app.services.progress_engine import ProgressEngine
from app.services.scheduling_engine import SchedulingEngine
from app.services.critical_path_engine import CriticalPathEngine
from app.services.prediction_engine import PredictionEngine
from app.services.whatif_engine import WhatIfEngine
from app.services.impact_engine import ImpactAnalysisEngine
from app.schemas.dtos import WhatIfRequestDTO
from datetime import datetime, timedelta

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def setup_sample_project(db):
    now = datetime.utcnow()
    p = Project(
        code="TEST-001",
        name="Test Airborne Antenna",
        planned_start=now,
        planned_end=now + timedelta(days=30)
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    s1 = WorkflowStage(
        project_id=p.id, stage_name="Requirements", department_name="Requirements Dept",
        weight=0.20, order_index=1, state=StageState.IN_PROGRESS.value, progress_percentage=50.0,
        planned_start=now, planned_end=now + timedelta(days=5)
    )
    s2 = WorkflowStage(
        project_id=p.id, stage_name="RF Design", department_name="RF Dept",
        weight=0.30, order_index=2, state=StageState.PENDING.value, progress_percentage=0.0,
        planned_start=now + timedelta(days=5), planned_end=now + timedelta(days=15)
    )
    s3 = WorkflowStage(
        project_id=p.id, stage_name="Testing", department_name="Test Dept",
        weight=0.50, order_index=3, state=StageState.PENDING.value, progress_percentage=0.0,
        planned_start=now + timedelta(days=15), planned_end=now + timedelta(days=30)
    )
    db.add_all([s1, s2, s3])

    r1 = Requirement(
        project_id=p.id, req_code="REQ-101", title="Frequency Range",
        category="Electrical/RF", specification_text="8-12 GHz", target_value="8-12 GHz"
    )
    db.add(r1)
    db.commit()
    return p, [s1, s2, s3], r1

def test_weighted_progress_calculation(db_session):
    p, stages, r1 = setup_sample_project(db_session)
    prog = ProgressEngine.calculate_project_progress(db_session, p.id)
    assert prog.overall_progress == 10.0
    assert prog.completed_weight == 0.0

def test_workflow_legal_transition_and_handoff(db_session):
    p, stages, r1 = setup_sample_project(db_session)
    s1, s2, s3 = stages

    success, msg, _ = WorkflowEngine.process_stage_transition(db_session, s1.id, StageState.SUBMITTED.value)
    assert success is True

    success, msg, _ = WorkflowEngine.process_stage_transition(db_session, s1.id, StageState.APPROVED.value)
    assert success is True

    db_session.refresh(s2)
    assert s2.state == StageState.IN_PROGRESS.value

def test_rejection_blocks_downstream_stages(db_session):
    p, stages, r1 = setup_sample_project(db_session)
    s1, s2, s3 = stages

    s2.state = StageState.SUBMITTED.value
    db_session.commit()

    success, msg, _ = WorkflowEngine.process_stage_transition(db_session, s2.id, StageState.REJECTED.value, comments="Gain insufficient")
    assert success is True

    db_session.refresh(s3)
    assert s3.is_blocked is True
    assert "Blocked by upstream rejection" in s3.block_reason

def test_requirement_change_impact_analysis(db_session):
    p, stages, r1 = setup_sample_project(db_session)
    
    d = Design(project_id=p.id, requirement_id=r1.id, design_code="DES-101", title="Horn Design V1")
    db_session.add(d)
    db_session.commit()

    impact = ImpactAnalysisEngine.analyze_requirement_change(
        db_session,
        requirement_id=r1.id,
        new_target_value=">= 15 dBi",
        new_specification_text="Gain >= 15 dBi across 8-12 GHz"
    )

    assert impact.requirement_code == "REQ-101"
    assert impact.total_affected_artifacts >= 1
    assert len(impact.recommended_actions) > 0

def test_prediction_model_and_whatif_simulation(db_session):
    p, stages, r1 = setup_sample_project(db_session)
    
    pred = PredictionEngine.predict_project_completion(db_session, p.id)
    assert "predicted_completion" in pred
    assert pred["schedule_risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    whatif = WhatIfEngine.run_simulation(
        db_session,
        p.id,
        WhatIfRequestDTO(procurement_delay_days=5.0, manufacturing_engineer_delta=1)
    )
    assert whatif.schedule_variance_days != 0.0

def test_critical_path_networkx(db_session):
    p, stages, r1 = setup_sample_project(db_session)
    cp = CriticalPathEngine.analyze_critical_path(db_session, p.id)
    assert len(cp["critical_path"]) == 3
    assert len(cp["graph_nodes"]) == 3
