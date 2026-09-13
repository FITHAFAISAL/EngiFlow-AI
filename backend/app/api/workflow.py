from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.workflow_engine import WorkflowEngine
from app.ai.review_agent import AIReviewAgent
from app.schemas.dtos import ApprovalSubmitDTO

router = APIRouter(prefix="/api/workflow", tags=["Workflow & Approvals"])

@router.post("/stages/{stage_id}/transition")
def update_stage_state(
    stage_id: int,
    state: str,
    user_name: str = "System Engineer",
    department: str = "Engineering",
    comments: str = None,
    db: Session = Depends(get_db)
):
    success, msg, stage = WorkflowEngine.process_stage_transition(
        db, stage_id, state, user_name, department, comments
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg, "stage_id": stage.id, "new_state": stage.state}

@router.post("/stages/{stage_id}/approve")
def approve_stage(payload: ApprovalSubmitDTO, db: Session = Depends(get_db)):
    success, msg, stage = WorkflowEngine.process_stage_transition(
        db,
        stage_id=payload.stage_id,
        new_state=payload.verdict,
        user_name=payload.reviewer_name,
        department=payload.reviewer_role,
        comments=payload.comments
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg, "stage_id": stage.id, "state": stage.state}

@router.get("/stages/{stage_id}/ai-review")
def get_ai_stage_review(stage_id: int, db: Session = Depends(get_db)):
    result = AIReviewAgent.perform_pre_review(db, stage_id)
    return result

@router.post("/projects/{project_id}/trigger-revision")
def trigger_design_revision_api(
    project_id: int,
    design_code: str,
    reason: str,
    db: Session = Depends(get_db)
):
    rev = WorkflowEngine.trigger_design_revision(db, project_id, design_code, reason)
    if not rev:
        raise HTTPException(status_code=404, detail="Design not found")
    return {"message": f"Design revision V{rev.version_number} created successfully.", "version": rev.version_number}
