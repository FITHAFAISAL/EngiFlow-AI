from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import Project, WorkflowStage

class SchedulingEngine:
    @staticmethod
    def calculate_schedule_metrics(db: Session, project_id: int) -> Dict[str, Any]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {}

        stages = db.query(WorkflowStage).filter(
            WorkflowStage.project_id == project_id
        ).order_by(WorkflowStage.order_index).all()

        timeline_data = []
        total_variance_days = 0.0
        now = datetime.utcnow()

        for stage in stages:
            planned_start = stage.planned_start
            planned_end = stage.planned_end
            actual_start = stage.actual_start or planned_start
            actual_end = stage.actual_end or (now if stage.state != "PENDING" else planned_end)

            planned_dur = max(1.0, (planned_end - planned_start).total_seconds() / 86400.0)
            actual_dur = max(0.0, (actual_end - actual_start).total_seconds() / 86400.0)
            variance = actual_dur - planned_dur

            if stage.state not in ["PENDING", "APPROVED", "COMPLETED"]:
                # Current active or delayed stage
                if now > planned_end:
                    variance += (now - planned_end).total_seconds() / 86400.0

            total_variance_days += variance

            timeline_data.append({
                "id": stage.id,
                "stage_name": stage.stage_name,
                "department": stage.department_name,
                "state": stage.state,
                "planned_start": planned_start.strftime("%Y-%m-%d"),
                "planned_end": planned_end.strftime("%Y-%m-%d"),
                "actual_start": actual_start.strftime("%Y-%m-%d") if stage.actual_start else None,
                "actual_end": actual_end.strftime("%Y-%m-%d") if stage.actual_end else None,
                "planned_duration_days": round(planned_dur, 1),
                "actual_duration_days": round(actual_dur, 1),
                "schedule_variance_days": round(variance, 1),
                "is_blocked": stage.is_blocked
            })

        planned_total_dur = (project.planned_end - project.planned_start).total_seconds() / 86400.0

        return {
            "project_id": project.id,
            "planned_start": project.planned_start.strftime("%Y-%m-%d"),
            "planned_end": project.planned_end.strftime("%Y-%m-%d"),
            "planned_duration_days": round(planned_total_dur, 1),
            "total_schedule_variance_days": round(total_variance_days, 1),
            "stages_timeline": timeline_data
        }
