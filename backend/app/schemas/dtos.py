from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProjectCreateDTO(BaseModel):
    code: str  # e.g., P004
    name: str  # Airborne Radar Module
    description: Optional[str] = None
    workflow_type: str = "ANTENNA_RF"  # ANTENNA_RF or SOFTWARE_AVIONICS
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None

class WorkflowStageDTO(BaseModel):
    id: int
    project_id: int
    stage_name: str
    department_name: str
    weight: float
    order_index: int
    state: str
    progress_percentage: float
    planned_start: datetime
    planned_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    estimated_remaining_days: float
    is_blocked: bool
    block_reason: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectProgressDTO(BaseModel):
    project_id: int
    project_name: str
    overall_progress: float
    completed_weight: float
    remaining_weight: float
    current_stage_name: str
    current_department: str
    is_blocked: bool
    stages: List[WorkflowStageDTO]

class RequirementDTO(BaseModel):
    id: int
    project_id: int
    req_code: str
    title: str
    category: str
    specification_text: str
    target_value: Optional[str] = None
    verification_status: str
    current_version: int = 1

    class Config:
        from_attributes = True

class RequirementUpdateDTO(BaseModel):
    specification_text: Optional[str] = None
    target_value: Optional[str] = None
    change_reason: str = "Customer requirement updated"
    changed_by: str = "Lead Systems Engineer"

class ApprovalSubmitDTO(BaseModel):
    stage_id: int
    reviewer_name: str = "Lead Engineer"
    reviewer_role: str = "Department Head"
    verdict: str  # APPROVED, REJECTED, CHANGES_REQUESTED
    comments: Optional[str] = None

class PredictionResultDTO(BaseModel):
    project_id: int
    planned_completion: str
    predicted_completion: str
    predicted_delay_days: float
    confidence_score: float
    schedule_risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    top_risk_factors: List[Dict[str, Any]]
    explanation: str

class WhatIfRequestDTO(BaseModel):
    procurement_delay_days: float = 0.0
    manufacturing_engineer_delta: int = 0
    simulation_rerun_cycles: int = 0
    testing_delay_days: float = 0.0

class WhatIfResultDTO(BaseModel):
    original_completion: str
    simulated_completion: str
    schedule_variance_days: float
    impact_summary: str
    recovery_opportunities: List[str]

class RequirementImpactDTO(BaseModel):
    requirement_code: str
    old_value: str
    new_value: str
    total_affected_artifacts: int
    high_impact_artifacts: List[Dict[str, str]]
    medium_impact_artifacts: List[Dict[str, str]]
    low_impact_artifacts: List[Dict[str, str]]
    recommended_actions: List[str]
    critical_path_affected: bool

class RAGQueryRequestDTO(BaseModel):
    project_id: int
    query: str

class RAGQueryResponseDTO(BaseModel):
    query: str
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    has_insufficient_evidence: bool

class KnowledgeGraphDTO(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class AIReviewResultDTO(BaseModel):
    stage_id: int
    stage_name: str
    requirements_checked: int
    requirements_satisfied: int
    missing_evidence_count: int
    findings: List[Dict[str, Any]]
    ai_recommendation: str  # SUGGEST_APPROVE, CAUTION_REJECT
