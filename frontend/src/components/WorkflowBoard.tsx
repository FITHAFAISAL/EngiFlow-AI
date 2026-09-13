import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, LinearProgress, Divider, Card, CardContent
} from '@mui/material';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck, Cpu, ArrowRight, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { WorkflowStage, AIReviewResult } from '../types';

interface WorkflowBoardProps {
  projectId: number;
}

export const WorkflowBoard: React.FC<WorkflowBoardProps> = ({ projectId }) => {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [aiReview, setAiReview] = useState<AIReviewResult | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [revisionSuccessMsg, setRevisionSuccessMsg] = useState('');

  useEffect(() => {
    loadStages();
  }, [projectId]);

  const loadStages = async () => {
    setLoading(true);
    try {
      const data = await api.getProjectDashboard(projectId);
      setStages(data.progress.stages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (stage: WorkflowStage) => {
    setSelectedStage(stage);
    setReviewModalOpen(true);
    setAiReviewLoading(true);
    try {
      const rev = await api.getAIStageReview(stage.id);
      setAiReview(rev);
    } catch (err) {
      console.error(err);
    } finally {
      setAiReviewLoading(false);
    }
  };

  const handleApproveOrReject = async (verdict: 'APPROVED' | 'REJECTED') => {
    if (!selectedStage) return;
    try {
      await api.approveStage(selectedStage.id, verdict, comments);
      setReviewModalOpen(false);
      setComments('');
      loadStages();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error processing stage transition');
    }
  };

  const handleTriggerRevision = async () => {
    try {
      const res = await api.triggerDesignRevision(
        projectId,
        'DESIGN-021',
        'Gain requirement updated to >= 15 dBi. Refined horn flare angle required.'
      );
      setRevisionSuccessMsg(`Design Revision V${res.version} created! Stages updated.`);
      loadStages();
    } catch (err) {
      console.error(err);
    }
  };

  const getStageColor = (state: string, isBlocked: boolean) => {
    if (isBlocked) return { bg: '#2a1215', border: '#7f1d1d', text: '#f87171' };
    switch (state) {
      case 'APPROVED':
      case 'COMPLETED':
        return { bg: '#062319', border: '#047857', text: '#34d399' };
      case 'IN_PROGRESS':
        return { bg: '#0c2a3a', border: '#0369a1', text: '#38bdf8' };
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return { bg: '#2e1065', border: '#6d28d9', text: '#c084fc' };
      case 'REJECTED':
        return { bg: '#361214', border: '#991b1b', text: '#f87171' };
      default:
        return { bg: '#1e293b', border: '#334155', text: '#94a3b8' };
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
          Department-to-Department Workflow Board
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RefreshCw size={16} />}
          onClick={handleTriggerRevision}
        >
          Simulate Re-work / Design Revision (V2)
        </Button>
      </Box>

      {revisionSuccessMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setRevisionSuccessMsg('')}>
          {revisionSuccessMsg}
        </Alert>
      )}

      {/* Stepper Pipeline Flow */}
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, mb: 4 }}>
        {stages.map((stg, idx) => {
          const colors = getStageColor(stg.state, stg.is_blocked);
          return (
            <Paper
              key={stg.id}
              sx={{
                minWidth: 200,
                p: 2,
                bgcolor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                position: 'relative'
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                STAGE 0{stg.order_index}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', my: 0.5 }}>
                {stg.stage_name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mb: 1 }}>
                {stg.department_name}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Chip
                  label={stg.is_blocked ? 'BLOCKED' : stg.state}
                  size="small"
                  sx={{ bgcolor: colors.border, color: colors.text, fontWeight: 700, fontSize: 10 }}
                />
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {(stg.weight * 100).toFixed(0)}% wt
                </Typography>
              </Box>

              {(stg.state === 'SUBMITTED' || stg.state === 'IN_PROGRESS') && !stg.is_blocked && (
                <Button
                  size="small"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 1.5, fontSize: 11, bgcolor: '#0284c7' }}
                  onClick={() => handleOpenReview(stg)}
                >
                  Review & Approve
                </Button>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Detailed Department Stage Cards */}
      <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 600 }}>
        Controlled Stage Details & Approval Log
      </Typography>

      {stages.map((stg) => (
        <Paper
          key={stg.id}
          sx={{
            p: 2.5,
            mb: 2,
            bgcolor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                  {stg.stage_name}
                </Typography>
                <Chip label={stg.department_name} size="small" variant="outlined" sx={{ color: '#94a3b8' }} />
                <Chip
                  label={stg.is_blocked ? 'BLOCKED' : stg.state}
                  size="small"
                  color={stg.state === 'APPROVED' ? 'success' : stg.is_blocked ? 'error' : 'primary'}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
                Planned: {stg.planned_start.split('T')[0]} to {stg.planned_end.split('T')[0]} | Weight: {(stg.weight * 100).toFixed(0)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#38bdf8' }}>
                {stg.progress_percentage}% Completed
              </Typography>
              {!stg.is_blocked && stg.state !== 'APPROVED' && (
                <Button size="small" variant="contained" sx={{ mt: 1 }} onClick={() => handleOpenReview(stg)}>
                  Submit for Approval
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      ))}

      {/* AI Pre-Review & Approval Dialog */}
      <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#f8fafc' }}>
          Human-in-the-Loop Engineering Approval: {selectedStage?.stage_name}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0f172a', color: '#cbd5e1' }}>
          {aiReviewLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <LinearProgress color="secondary" />
              <Typography sx={{ mt: 2 }}>AI Engineering Review Agent evaluating compliance & evidence...</Typography>
            </Box>
          ) : aiReview ? (
            <Box sx={{ py: 1 }}>
              <Alert
                severity={aiReview.ai_recommendation === 'SUGGEST_APPROVE' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                <strong>AI RECOMMENDATION:</strong> {aiReview.ai_recommendation} (Satisfied {aiReview.requirements_satisfied}/{aiReview.requirements_checked} specs)
              </Alert>

              <Typography variant="subtitle2" sx={{ color: '#f8fafc', mb: 1, fontWeight: 600 }}>
                Verification Findings & Evidence Check:
              </Typography>
              {aiReview.findings.map((f, i) => (
                <Box key={i} sx={{ bgcolor: '#1e293b', p: 1.5, borderRadius: 1.5, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: f.status === 'PASS' ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    [{f.req_code}] {f.status} — {f.finding}
                  </Typography>
                </Box>
              ))}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reviewer Comments & Verdict Rationale"
                variant="outlined"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                sx={{ mt: 2, bgcolor: '#1e293b', input: { color: '#ffffff' } }}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0f172a', p: 2 }}>
          <Button onClick={() => setReviewModalOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button color="error" variant="outlined" onClick={() => handleApproveOrReject('REJECTED')}>
            Reject / Request Changes
          </Button>
          <Button color="success" variant="contained" onClick={() => handleApproveOrReject('APPROVED')}>
            Approve & Move to Next Stage
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
