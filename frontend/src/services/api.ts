import axios from 'axios';
import {
  ProjectProgress, Requirement, PredictionResult, CriticalPathResult,
  WhatIfResult, RequirementImpactResult, RAGResponse, KnowledgeGraphData, AIReviewResult
} from '../types';

const API_BASE = '/api';

export const api = {
  getProjects: async () => {
    const res = await axios.get(`${API_BASE}/projects`);
    return res.data;
  },

  createProject: async (data: { code: string; name: string; description?: string; workflow_type: string }) => {
    const res = await axios.post(`${API_BASE}/projects`, data);
    return res.data;
  },

  getProjectDashboard: async (projectId: number) => {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/dashboard`);
    return res.data;
  },

  updateStageState: async (stageId: number, state: string, comments?: string) => {
    const res = await axios.post(`${API_BASE}/workflow/stages/${stageId}/transition`, null, {
      params: { state, comments }
    });
    return res.data;
  },

  approveStage: async (stageId: number, verdict: string, comments?: string) => {
    const res = await axios.post(`${API_BASE}/workflow/stages/${stageId}/approve`, {
      stage_id: stageId,
      reviewer_name: 'Lead Systems Engineer',
      reviewer_role: 'Engineering Lead',
      verdict,
      comments
    });
    return res.data;
  },

  getAIStageReview: async (stageId: number): Promise<AIReviewResult> => {
    const res = await axios.get(`${API_BASE}/workflow/stages/${stageId}/ai-review`);
    return res.data;
  },

  triggerDesignRevision: async (projectId: number, designCode: string, reason: string) => {
    const res = await axios.post(`${API_BASE}/workflow/projects/${projectId}/trigger-revision`, null, {
      params: { design_code: designCode, reason }
    });
    return res.data;
  },

  getRequirements: async (projectId: number): Promise<Requirement[]> => {
    const res = await axios.get(`${API_BASE}/requirements/project/${projectId}`);
    return res.data;
  },

  updateRequirementImpact: async (reqId: number, newTarget: string, newSpec: string, reason: string): Promise<RequirementImpactResult> => {
    const res = await axios.put(`${API_BASE}/requirements/${reqId}/update-impact`, {
      target_value: newTarget,
      specification_text: newSpec,
      change_reason: reason
    });
    return res.data;
  },

  getPredictions: async (projectId: number): Promise<PredictionResult> => {
    const res = await axios.get(`${API_BASE}/predictions/project/${projectId}`);
    return res.data;
  },

  getCriticalPath: async (projectId: number): Promise<CriticalPathResult> => {
    const res = await axios.get(`${API_BASE}/predictions/project/${projectId}/critical-path`);
    return res.data;
  },

  runWhatIfSimulation: async (projectId: number, procDelay: number, engDelta: number, simCycles: number): Promise<WhatIfResult> => {
    const res = await axios.post(`${API_BASE}/whatif/project/${projectId}/simulate`, {
      procurement_delay_days: procDelay,
      manufacturing_engineer_delta: engDelta,
      simulation_rerun_cycles: simCycles
    });
    return res.data;
  },

  queryRAG: async (projectId: number, query: string): Promise<RAGResponse> => {
    const res = await axios.post(`${API_BASE}/rag/query`, {
      project_id: projectId,
      query
    });
    return res.data;
  },

  getKnowledgeGraph: async (projectId: number): Promise<KnowledgeGraphData> => {
    const res = await axios.get(`${API_BASE}/graph/project/${projectId}`);
    return res.data;
  }
};
