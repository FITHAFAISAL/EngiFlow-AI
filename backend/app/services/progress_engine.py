from sqlalchemy.orm import Session
from app.models.entities import Project, WorkflowStage, StageState
from app.schemas.dtos import ProjectProgressDTO, WorkflowStageDTO

class ProgressEngine:
    @staticmethod
    def calculate_project_progress(db: Session, project_id: int) -> ProjectProgressDTO:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project with ID {project_id} not found.")

        stages = db.query(WorkflowStage).filter(
            WorkflowStage.project_id == project_id
        ).order_by(WorkflowStage.order_index).all()

        total_weight = sum(s.weight for s in stages) or 1.0
        completed_weight = 0.0
        weighted_progress_sum = 0.0

        current_stage_name = "Completed"
        current_department = "Management"
        is_blocked = False

        stage_dtos = []
        found_current = False

        for stage in stages:
            # Stage contribution
            stage_prog = stage.progress_percentage
            if stage.state in [StageState.APPROVED.value, StageState.COMPLETED.value]:
                stage_prog = 100.0
                completed_weight += stage.weight
            
            weighted_progress_sum += (stage_prog / 100.0) * stage.weight

            if not found_current and stage.state in [StageState.IN_PROGRESS.value, StageState.SUBMITTED.value, StageState.UNDER_REVIEW.value, StageState.BLOCKED.value, StageState.CHANGES_REQUESTED.value]:
                current_stage_name = stage.stage_name
                current_department = stage.department_name
                if stage.is_blocked:
                    is_blocked = True
                found_current = True

            stage_dtos.append(WorkflowStageDTO.model_validate(stage))

        overall_progress = round((weighted_progress_sum / total_weight) * 100.0, 2)
        remaining_weight = round(total_weight - (completed_weight / total_weight), 2)

        return ProjectProgressDTO(
            project_id=project.id,
            project_name=project.name,
            overall_progress=overall_progress,
            completed_weight=round(completed_weight, 2),
            remaining_weight=remaining_weight,
            current_stage_name=current_stage_name,
            current_department=current_department,
            is_blocked=is_blocked,
            stages=stage_dtos
        )
