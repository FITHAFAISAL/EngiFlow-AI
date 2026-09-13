import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, LinearProgress, Grid
} from '@mui/material';
import { ShieldCheck, AlertCircle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Requirement, RequirementImpactResult } from '../types';

interface TraceabilityProps {
  projectId: number;
}

export const TraceabilityMatrix: React.FC<TraceabilityProps> = ({ projectId }) => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [impactResult, setImpactResult] = useState<RequirementImpactResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadReqs();
  }, [projectId]);

  const loadReqs = async () => {
    setLoading(true);
    try {
      const data = await api.getRequirements(projectId);
      setRequirements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImpactSim = (req: Requirement) => {
    setSelectedReq(req);
    setNewTarget(req.target_value || '>= 15.0 dBi');
    setNewSpec(req.specification_text);
    setImpactResult(null);
    setImpactModalOpen(true);
  };

  const handleRunImpactAnalysis = async () => {
    if (!selectedReq) return;
    setAnalyzing(true);
    try {
      const res = await api.updateRequirementImpact(
        selectedReq.id,
        newTarget,
        newSpec,
        'Customer requested higher gain for long-range airborne telemetry'
      );
      setImpactResult(res);
      loadReqs();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
            Engineering Requirements & Traceability Matrix
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Requirement → Design → Simulation → Test → Verification → Document → Delivery
          </Typography>
        </Box>
      </Box>

      {/* Traceability Table */}
      <TableContainer component={Paper} sx={{ bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, mb: 4 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>REQ CODE</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>REQUIREMENT TITLE</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>CATEGORY</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>SPECIFICATION / TARGET</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>STATUS</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requirements.map((req) => (
              <TableRow key={req.id} sx={{ '&:hover': { bgcolor: '#1e293b' } }}>
                <TableCell sx={{ color: '#38bdf8', fontWeight: 700 }}>{req.req_code}</TableCell>
                <TableCell sx={{ color: '#f8fafc', fontWeight: 600 }}>{req.title}</TableCell>
                <TableCell><Chip label={req.category} size="small" variant="outlined" sx={{ color: '#cbd5e1' }} /></TableCell>
                <TableCell sx={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{req.target_value || req.specification_text}</TableCell>
                <TableCell>
                  <Chip
                    label={req.verification_status}
                    size="small"
                    color={req.verification_status === 'VERIFIED' ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Zap size={14} />}
                    onClick={() => handleOpenImpactSim(req)}
                  >
                    Simulate Change Impact
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Requirement Change Impact Dialog */}
      <Dialog open={impactModalOpen} onClose={() => setImpactModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: '#f8fafc' }}>
          AI Requirement Change Impact Simulator ({selectedReq?.req_code})
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0f172a', color: '#cbd5e1' }}>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Simulate a customer specification change to trace downstream engineering impact across RF designs, simulations, and test procedures.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Target Specification Value"
                  variant="outlined"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  sx={{ bgcolor: '#1e293b' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Specification Description"
                  variant="outlined"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  sx={{ bgcolor: '#1e293b' }}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              color="primary"
              onClick={handleRunImpactAnalysis}
              disabled={analyzing}
              startIcon={analyzing ? <RefreshCw size={16} /> : <Zap size={16} />}
            >
              {analyzing ? 'Analyzing Impact Graph...' : 'Run AI Impact Analysis'}
            </Button>

            {impactResult && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>REQUIREMENT CHANGE DETECTED:</strong> {impactResult.total_affected_artifacts} engineering artifacts impacted on critical path!
                </Alert>

                <Typography variant="subtitle2" sx={{ color: '#f87171', fontWeight: 700, mb: 1 }}>
                  High Impact Artifacts (Rework Required):
                </Typography>
                {impactResult.high_impact_artifacts.map((hi, i) => (
                  <Box key={i} sx={{ bgcolor: '#2a1215', borderLeft: '4px solid #ef4444', p: 1.5, mb: 1, borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#f87171' }}>[{hi.code}] {hi.type} — {hi.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>{hi.action}</Typography>
                  </Box>
                ))}

                <Typography variant="subtitle2" sx={{ color: '#f59e0b', fontWeight: 700, mt: 2, mb: 1 }}>
                  Recommended Engineering Actions:
                </Typography>
                {impactResult.recommended_actions.map((act, i) => (
                  <Typography key={i} variant="body2" sx={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                    <ArrowRight size={14} color="#38bdf8" /> {act}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0f172a', p: 2 }}>
          <Button onClick={() => setImpactModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
