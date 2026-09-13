from datetime import datetime
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    WorkflowStage, StageState, AuditLog, Notification,
    Project, Design, DesignVersion, Simulation, Review
)

class WorkflowEngine:
    @staticmethod
    def process_stage_transition(
        db: Session,
        stage_id: int,
        new_state: str,
        user_name: str = "System",
        department: str = "Engineering",
        comments: Optional[str] = None
    ) -> Tuple[bool, str, WorkflowStage]:
        stage = db.query(WorkflowStage).filter(WorkflowStage.id == stage_id).first()
        if not stage:
            return False, "Workflow stage not found.", None

        current_state = stage.state

        # Check if stage is blocked
        if stage.is_blocked and new_state not in [StageState.PENDING.value, StageState.IN_PROGRESS.value]:
            return False, f"Stage is currently BLOCKED ({stage.block_reason}). Resolve block first.", stage

        # Validate legal transition matrix
        valid_transitions = {
            StageState.PENDING.value: [StageState.IN_PROGRESS.value],
            StageState.IN_PROGRESS.value: [StageState.SUBMITTED.value, StageState.BLOCKED.value],
            StageState.SUBMITTED.value: [StageState.UNDER_REVIEW.value, StageState.REJECTED.value, StageState.APPROVED.value],
            StageState.UNDER_REVIEW.value: [StageState.APPROVED.value, StageState.REJECTED.value, StageState.CHANGES_REQUESTED.value],
            StageState.CHANGES_REQUESTED.value: [StageState.IN_PROGRESS.value, StageState.SUBMITTED.value],
            StageState.REJECTED.value: [StageState.IN_PROGRESS.value, StageState.CHANGES_REQUESTED.value],
            StageState.APPROVED.value: [StageState.COMPLETED.value],
            StageState.COMPLETED.value: [],
            StageState.BLOCKED.value: [StageState.PENDING.value, StageState.IN_PROGRESS.value]
        }

        allowed = valid_transitions.get(current_state, [])
        if new_state not in allowed and new_state != current_state:
            return False, f"Invalid state transition from {current_state} to {new_state}.", stage

        # Apply state update
        stage.state = new_state
        if new_state == StageState.IN_PROGRESS.value and not stage.actual_start:
            stage.actual_start = datetime.utcnow()
        elif new_state == StageState.APPROVED.value or new_state == StageState.COMPLETED.value:
            stage.progress_percentage = 100.0
            if not stage.actual_end:
                stage.actual_end = datetime.utcnow()

        # Audit record
        audit = AuditLog(
            project_id=stage.project_id,
            user_name=user_name,
            department=department,
            action=f"STAGE_STATE_CHANGED_{new_state}",
            entity_type="WorkflowStage",
            entity_id=str(stage.id),
            details=f"Stage '{stage.stage_name}' moved from {current_state} to {new_state}. Comments: {comments or 'N/A'}"
        )
        db.add(audit)

        # Trigger downstream actions upon approval
        if new_state == StageState.APPROVED.value:
            WorkflowEngine._activate_next_stage(db, stage)
        elif new_state in [StageState.REJECTED.value, StageState.CHANGES_REQUESTED.value]:
            WorkflowEngine._handle_rejection(db, stage, comments or "Review rejected design/simulation criteria.")

        db.commit()
        db.refresh(stage)
        return True, f"Stage successfully updated to {new_state}.", stage

    @staticmethod
    def _activate_next_stage(db: Session, current_stage: WorkflowStage):
        next_stage = db.query(WorkflowStage).filter(
            WorkflowStage.project_id == current_stage.project_id,
            WorkflowStage.order_index == current_stage.order_index + 1
        ).first()

        if next_stage:
            if next_stage.state == StageState.PENDING.value:
                next_stage.state = StageState.IN_PROGRESS.value
                next_stage.actual_start = datetime.utcnow()
                next_stage.is_blocked = False
                
                # Notify next department
                notif = Notification(
                    project_id=current_stage.project_id,
                    target_department=next_stage.department_name,
                    title=f"Stage Activated: {next_stage.stage_name}",
                    message=f"Previous stage '{current_stage.stage_name}' approved. Stage '{next_stage.stage_name}' is now IN_PROGRESS.",
                    severity="INFO"
                )
                db.add(notif)

    @staticmethod
    def _handle_rejection(db: Session, current_stage: WorkflowStage, reason: str):
        # Block downstream stages
        downstream_stages = db.query(WorkflowStage).filter(
            WorkflowStage.project_id == current_stage.project_id,
            WorkflowStage.order_index > current_stage.order_index
        ).all()

        for stg in downstream_stages:
            stg.is_blocked = True
            stg.block_reason = f"Blocked by upstream rejection at '{current_stage.stage_name}'"

        # Notify responsible engineer
        notif = Notification(
            project_id=current_stage.project_id,
            target_department=current_stage.department_name,
            title=f"Rejection / Re-work Required: {current_stage.stage_name}",
            message=f"Stage '{current_stage.stage_name}' rejected. Downstream stages BLOCKED. Reason: {reason}",
            severity="WARNING"
        )
        db.add(notif)

    @staticmethod
    def trigger_design_revision(db: Session, project_id: int, design_code: str, reason: str) -> Optional[DesignVersion]:
        """
        Preserves V1, creates Design V2, resets stage state & unblocks workflows upon submission.
        """
        design = db.query(Design).filter(
            Design.project_id == project_id,
            Design.design_code == design_code
        ).first()

        if not design:
            return None

        new_version_num = design.current_version_number + 1
        design.current_version_number = new_version_num

        # Copy geometry from previous version and update horn aperture
        prev_ver = db.query(DesignVersion).filter(
            DesignVersion.design_id == design.id,
            DesignVersion.version_number == new_version_num - 1
        ).first()

        geom = prev_ver.geometry_spec if prev_ver else "Optimized Airborne Horn Array Geometry"
        if "Aperture" in geom:
            geom = geom + f" (Revision V{new_version_num}: Horn flare angle expanded +15%, flared aperture 145x95mm)"

        new_version = DesignVersion(
            design_id=design.id,
            version_number=new_version_num,
            geometry_spec=geom,
            frequency_range="8.0 - 12.0 GHz",
            polarization="Dual Linear",
            parameters_json={"gain_target_dbi": 15.0, "vswr_target": 1.5, "revision_notes": reason},
            notes=f"Revision V{new_version_num} generated to address: {reason}",
            status="SUBMITTED"
        )
        db.add(new_version)

        audit = AuditLog(
            project_id=project_id,
            user_name="RF Lead Engineer",
            department="RF / Antenna Department",
            action="DESIGN_REVISION_CREATED",
            entity_type="DesignVersion",
            entity_id=f"{design_code}-V{new_version_num}",
            details=f"Created {design_code} V{new_version_num} to resolve: {reason}"
        )
        db.add(audit)
        db.commit()
        db.refresh(new_version)
        return new_version
