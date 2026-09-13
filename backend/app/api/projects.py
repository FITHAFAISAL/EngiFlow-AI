from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database.connection import get_db
from app.models.entities import Project, WorkflowStage, AuditLog, Notification, Requirement, StageState, VerificationStatus
from app.services.progress_engine import ProgressEngine
from app.services.scheduling_engine import SchedulingEngine
from app.schemas.dtos import ProjectCreateDTO

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    results = []
    for p in projects:
        prog = ProgressEngine.calculate_project_progress(db, p.id)
        results.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "planned_start": p.planned_start.strftime("%Y-%m-%d"),
            "planned_end": p.planned_end.strftime("%Y-%m-%d"),
            "overall_progress": prog.overall_progress,
            "current_stage": prog.current_stage_name,
            "current_department": prog.current_department,
            "is_blocked": prog.is_blocked
        })
    return results

@router.post("")
def create_project(payload: ProjectCreateDTO, db: Session = Depends(get_db)):
    existing = db.query(Project).filter(Project.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project code '{payload.code}' already exists.")

    now = datetime.utcnow()
    start_date = payload.planned_start or now
    end_date = payload.planned_end or (start_date + timedelta(days=60))

    project = Project(
        code=payload.code,
        name=payload.name,
        description=payload.description or f"Engineering project {payload.code} for ABC Company.",
        status="IN_PROGRESS",
        planned_start=start_date,
        planned_end=end_date,
        actual_start=start_date
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Configurable Workflow Templates
    if payload.workflow_type == "SOFTWARE_AVIONICS":
        stages_data = [
            ("Requirements Engineering", "Requirements Department", 0.10, 1, StageState.IN_PROGRESS.value, 20.0, 0, 5),
            ("Software Architecture", "Avionics Software Lead", 0.15, 2, StageState.PENDING.value, 0.0, 5, 15),
            ("Software Development", "Software Engineering", 0.25, 3, StageState.PENDING.value, 0.0, 15, 35),
            ("System Integration", "Integration & Test", 0.20, 4, StageState.PENDING.value, 0.0, 35, 45),
            ("QA & Qualification", "Quality Assurance", 0.15, 5, StageState.PENDING.value, 0.0, 45, 52),
            ("Documentation", "Technical Documentation", 0.10, 6, StageState.PENDING.value, 0.0, 52, 57),
            ("Delivery", "Project Delivery", 0.05, 7, StageState.PENDING.value, 0.0, 57, 60)
        ]
    else:  # ANTENNA_RF default
        stages_data = [
            ("Requirements Engineering", "Requirements Department", 0.10, 1, StageState.IN_PROGRESS.value, 20.0, 0, 5),
            ("RF Design", "RF / Antenna Department", 0.15, 2, StageState.PENDING.value, 0.0, 5, 15),
            ("Design Review", "Systems Engineering Lead", 0.05, 3, StageState.PENDING.value, 0.0, 15, 18),
            ("Simulation", "Simulation & Modeling Department", 0.15, 4, StageState.PENDING.value, 0.0, 18, 28),
            ("Procurement", "Procurement Department", 0.10, 5, StageState.PENDING.value, 0.0, 28, 38),
            ("Manufacturing", "Manufacturing & Assembly", 0.20, 6, StageState.PENDING.value, 0.0, 38, 48),
            ("Testing", "Testing & Qualification", 0.15, 7, StageState.PENDING.value, 0.0, 48, 55),
            ("QA / Validation", "Quality Assurance", 0.05, 8, StageState.PENDING.value, 0.0, 55, 57),
            ("Documentation", "Technical Documentation", 0.05, 9, StageState.PENDING.value, 0.0, 57, 59),
            ("Delivery", "Project Delivery", 0.05, 10, StageState.PENDING.value, 0.0, 59, 60)
        ]

    for name, dept, wt, idx, st, prog, s_off, e_off in stages_data:
        ws = WorkflowStage(
            project_id=project.id,
            stage_name=name,
            department_name=dept,
            weight=wt,
            order_index=idx,
            state=st,
            progress_percentage=prog,
            planned_start=start_date + timedelta(days=s_off),
            planned_end=start_date + timedelta(days=e_off),
            actual_start=start_date + timedelta(days=s_off) if st == StageState.IN_PROGRESS.value else None,
            estimated_remaining_days=float(e_off - s_off)
        )
        db.add(ws)

    # Initial Requirement
    r1 = Requirement(
        project_id=project.id,
        req_code=f"{payload.code}-REQ-001",
        title="Baseline Technical Performance Specification",
        category="General Engineering",
        specification_text=f"Operational compliance specification for project {payload.name}.",
        target_value="Compliant",
        verification_status=VerificationStatus.UNVERIFIED.value
    )
    db.add(r1)

    # Audit log
    audit = AuditLog(
        project_id=project.id,
        user_name="Project Administrator",
        department="Project Management",
        action="PROJECT_CREATED",
        entity_type="Project",
        entity_id=project.code,
        details=f"Created new project '{project.name}' ({project.code}) with {payload.workflow_type} workflow template."
    )
    db.add(audit)

    db.commit()
    db.refresh(project)
    return {"message": "Project created successfully", "project_id": project.id, "code": project.code}

@router.get("/{project_id}/dashboard")
def get_project_dashboard(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    progress = ProgressEngine.calculate_project_progress(db, project_id)
    schedule = SchedulingEngine.calculate_schedule_metrics(db, project_id)

    recent_audits = db.query(AuditLog).filter(
        AuditLog.project_id == project_id
    ).order_by(AuditLog.timestamp.desc()).limit(8).all()

    recent_notifs = db.query(Notification).filter(
        Notification.project_id == project_id
    ).order_by(Notification.created_at.desc()).limit(5).all()

    return {
        "project": {
            "id": project.id,
            "code": project.code,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "planned_start": project.planned_start.strftime("%Y-%m-%d"),
            "planned_end": project.planned_end.strftime("%Y-%m-%d")
        },
        "progress": progress,
        "schedule": schedule,
        "recent_activity": [
            {
                "id": a.id,
                "user": a.user_name,
                "department": a.department,
                "action": a.action,
                "details": a.details,
                "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            } for a in recent_audits
        ],
        "notifications": [
            {
                "id": n.id,
                "department": n.target_department,
                "title": n.title,
                "message": n.message,
                "severity": n.severity,
                "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S")
            } for n in recent_notifs
        ]
    }
