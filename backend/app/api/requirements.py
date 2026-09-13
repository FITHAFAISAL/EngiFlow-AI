from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.entities import Requirement
from app.services.impact_engine import ImpactAnalysisEngine
from app.schemas.dtos import RequirementUpdateDTO

router = APIRouter(prefix="/api/requirements", tags=["Requirements & Traceability"])

@router.get("/project/{project_id}")
def get_project_requirements(project_id: int, db: Session = Depends(get_db)):
    reqs = db.query(Requirement).filter(Requirement.project_id == project_id).all()
    results = []
    for r in reqs:
        results.append({
            "id": r.id,
            "req_code": r.req_code,
            "title": r.title,
            "category": r.category,
            "specification_text": r.specification_text,
            "target_value": r.target_value,
            "verification_status": r.verification_status,
            "version_count": len(r.versions)
        })
    return results

@router.put("/{requirement_id}/update-impact")
def update_requirement_and_analyze_impact(
    requirement_id: int,
    payload: RequirementUpdateDTO,
    db: Session = Depends(get_db)
):
    result = ImpactAnalysisEngine.analyze_requirement_change(
        db,
        requirement_id=requirement_id,
        new_target_value=payload.target_value or "",
        new_specification_text=payload.specification_text or "",
        changed_by=payload.changed_by,
        change_reason=payload.change_reason
    )
    return result
