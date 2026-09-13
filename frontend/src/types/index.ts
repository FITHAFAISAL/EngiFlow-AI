export interface WorkflowStage {
  id: number;
  project_id: number;
  stage_name: string;
  department_name: string;
  weight: number;
  order_index: number;
  state: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'COMPLETED' | 'BLOCKED';
  progress_percentage: number;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  estimated_remaining_days: number;
  is_blocked: boolean;
  block_reason?: string;
}

export interface ProjectProgress {
  project_id: number;
  project_name: string;
  overall_progress: number;
  completed_weight: number;
  remaining_weight: number;
  current_stage_name: string;
  current_department: string;
  is_blocked: boolean;
  stages: WorkflowStage[];
}

export interface Requirement {
  id: number;
  req_code: string;
  title: string;
  category: string;
  specification_text: string;
  target_value?: string;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'FAILED';
  version_count: number;
}

export interface PredictionResult {
  project_id: number;
  planned_completion: string;
  predicted_completion: string;
  predicted_delay_days: number;
  confidence_score: number;
  schedule_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  top_risk_factors: { factor: string; estimated_delay_impact: string; detail: string }[];
  explanation: string;
}

export interface CriticalPathResult {
  critical_path: string[];
  bottlenecks: { stage_name: string; department: string; reason: string; impact: string; severity: string }[];
  graph_nodes: { id: string; label: string; department: string; state: string; duration_days: number; is_blocked: boolean }[];
  graph_edges: { source: string; target: string }[];
}

export interface WhatIfResult {
  original_completion: string;
  simulated_completion: string;
  schedule_variance_days: number;
  impact_summary: string;
  recovery_opportunities: string[];
}

export interface RequirementImpactResult {
  requirement_code: string;
  old_value: string;
  new_value: string;
  total_affected_artifacts: number;
  high_impact_artifacts: { code: string; type: string; title: string; action: string }[];
  medium_impact_artifacts: { code: string; type: string; title: string; action: string }[];
  low_impact_artifacts: { code: string; type: string; title: string; action: string }[];
  recommended_actions: string[];
}

export interface RAGResponse {
  query: string;
  answer: string;
  confidence: number;
  sources: { doc_code: string; doc_title: string; section: string; text: string; score: number }[];
  has_insufficient_evidence: boolean;
}

export interface KnowledgeGraphData {
  nodes: { id: string; label: string; title: string; category: string; color: string }[];
  edges: { source: string; target: string; relation: string }[];
}

export interface AIReviewResult {
  stage_id: number;
  stage_name: string;
  requirements_checked: number;
  requirements_satisfied: number;
  missing_evidence_count: number;
  findings: { req_code: string; status: string; severity: string; finding: string; evidence: string }[];
  ai_recommendation: 'SUGGEST_APPROVE' | 'CAUTION_REJECT';
}
