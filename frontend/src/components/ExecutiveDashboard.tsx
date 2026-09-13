import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, LinearProgress, Chip, Card, CardContent,
  Divider, Button, Alert
} from '@mui/material';
import {
  TrendingUp, AlertTriangle, ShieldCheck, Clock, Layers, Cpu,
  ArrowRight, Activity, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { ProjectProgress, PredictionResult, CriticalPathResult } from '../types';

interface DashboardProps {
  projectId: number;
  onNavigate: (tab: string) => void;
}

export const ExecutiveDashboard: React.FC<DashboardProps> = ({ projectId, onNavigate }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [criticalPath, setCriticalPath] = useState<CriticalPathResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getProjectDashboard(projectId);
      const pred = await api.getPredictions(projectId);
      const cp = await api.getCriticalPath(projectId);
      setDashboardData(data);
      setPrediction(pred);
      setCriticalPath(cp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData || !prediction) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress color="primary" />
        <Typography sx={{ mt: 2, color: '#94a3b8' }}>Loading EngiFlow AI Analytics...</Typography>
      </Box>
    );
  }

  const { project, progress, schedule, recent_activity } = dashboardData;
  const hasBottleneck = criticalPath?.bottlenecks && criticalPath.bottlenecks.length > 0;

  // Prepare data for Bar Charts
  const departmentChartData = progress.stages.map((stg: any) => ({
    name: stg.stage_name,
    progress: stg.progress_percentage,
    weight: (stg.weight * 100).toFixed(0),
    isBlocked: stg.is_blocked
  }));

  const durationChartData = schedule.stages_timeline.map((stg: any) => ({
    name: stg.stage_name,
    planned: stg.planned_duration_days,
    actual: stg.actual_duration_days,
    variance: stg.schedule_variance_days
  }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip label={project.code} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                {project.name}
              </Typography>
              <Chip
                label={project.status}
                size="small"
                sx={{ bgcolor: '#0284c7', color: '#ffffff', fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              {project.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, color: '#cbd5e1' }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Clock size={14} color="#38bdf8" /> Planned: {project.planned_start} → {project.planned_end}
              </Typography>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Layers size={14} color="#a855f7" /> Current Stage: <strong>{progress.current_stage_name}</strong> ({progress.current_department})
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ bgcolor: '#090d16', p: 2.5, borderRadius: 2, border: '1px solid #1e293b' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Weighted Project Completion</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#38bdf8' }}>
                  {progress.overall_progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.overall_progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#1e293b',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)'
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Bottleneck Alert */}
      {hasBottleneck && (
        <Alert
          severity="warning"
          icon={<AlertTriangle color="#f59e0b" />}
          sx={{
            mb: 3,
            bgcolor: '#17120a',
            color: '#fde68a',
            border: '1px solid #78350f',
            borderRadius: 2
          }}
          action={
            <Button color="warning" size="small" onClick={() => onNavigate('gantt')}>
              View Critical Path
            </Button>
          }
        >
          <strong>BOTTLENECK DETECTED:</strong> {criticalPath.bottlenecks[0].reason} — {criticalPath.bottlenecks[0].impact}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>AI PREDICTED COMPLETION</Typography>
                <TrendingUp size={18} color="#38bdf8" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                {prediction.predicted_completion}
              </Typography>
              <Typography variant="caption" sx={{ color: prediction.predicted_delay_days > 0 ? '#f87171' : '#4ade80' }}>
                {prediction.predicted_delay_days > 0 ? `+${prediction.predicted_delay_days} days late vs baseline` : 'On schedule'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>SCHEDULE RISK</Typography>
                <AlertTriangle size={18} color={prediction.schedule_risk_level === 'MEDIUM' ? '#f59e0b' : '#ef4444'} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {prediction.schedule_risk_level}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Confidence: {prediction.confidence_score}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>REQUIREMENTS VERIFIED</Typography>
                <ShieldCheck size={18} color="#4ade80" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#4ade80' }}>
                83.3%
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                5/6 customer specs satisfied
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>CURRENT BOTTLENECK</Typography>
                <Cpu size={18} color="#f43f5e" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f43f5e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Component Procurement
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                CNC Chassis PO-902 (+4d)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DYNAMIC BAR CHARTS SECTION */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Bar Chart 1: Department Stage Progress % */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart2 color="#38bdf8" size={18} /> Department Stage Completion (%) Bar Chart
              </Typography>
              <Chip label="Weighted" size="small" variant="outlined" sx={{ color: '#38bdf8', fontSize: 10 }} />
            </Box>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-30} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#ffffff' }}
                    formatter={(val: any) => [`${val}%`, 'Progress']}
                  />
                  <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                    {departmentChartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isBlocked ? '#f87171' : entry.progress === 100 ? '#4ade80' : '#38bdf8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Bar Chart 2: Planned vs Actual Stage Duration (Days) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock color="#a855f7" size={18} /> Planned vs Actual Duration (Days) Bar Chart
              </Typography>
              <Chip label="Schedule Variance" size="small" variant="outlined" sx={{ color: '#a855f7', fontSize: 10 }} />
            </Box>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-30} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#ffffff' }}
                  />
                  <Bar dataKey="planned" fill="#64748b" name="Planned Days" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#a855f7" name="Actual/Est Days" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Insights & Department Audit Log */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cpu color="#38bdf8" size={20} /> AI Engineering Intelligence Insights
              </Typography>
              <Button size="small" endIcon={<ArrowRight size={16} />} onClick={() => onNavigate('whatif')}>
                What-If Simulator
              </Button>
            </Box>

            <Box sx={{ bgcolor: '#1e293b', p: 2, borderRadius: 2, mb: 2, borderLeft: '4px solid #38bdf8' }}>
              <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 600 }}>
                Why did the predicted delivery shift to {prediction.predicted_completion}?
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                {prediction.explanation}
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 600 }}>
              Top Delay Factors:
            </Typography>
            {prediction.top_risk_factors.map((tf, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px dashed #334155' }}>
                <Typography variant="body2" sx={{ color: '#e2e8f0' }}>{tf.factor}</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip label={tf.estimated_delay_impact} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                  <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>{tf.detail}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Audit Log */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f8fafc', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Activity color="#a855f7" size={20} /> Audit Trail & Handoff History
            </Typography>

            <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
              {recent_activity.map((act: any) => (
                <Box key={act.id} sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid #1e293b' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontSize: 13 }}>
                      {act.user} ({act.department})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {act.timestamp.split(' ')[1]}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: 13 }}>
                    {act.details}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
