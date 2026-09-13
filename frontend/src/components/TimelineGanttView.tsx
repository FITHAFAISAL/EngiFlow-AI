import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, LinearProgress, Chip, Grid } from '@mui/material';
import { Clock, AlertTriangle, Cpu, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { api } from '../services/api';
import { CriticalPathResult } from '../types';

interface GanttProps {
  projectId: number;
}

export const TimelineGanttView: React.FC<GanttProps> = ({ projectId }) => {
  const [criticalPath, setCriticalPath] = useState<CriticalPathResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGantt();
  }, [projectId]);

  const loadGantt = async () => {
    setLoading(true);
    try {
      const data = await api.getCriticalPath(projectId);
      setCriticalPath(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !criticalPath) return <LinearProgress color="primary" />;

  const chartData = criticalPath.graph_nodes.map((n) => ({
    name: n.label,
    duration: n.duration_days,
    department: n.department,
    isBlocked: n.is_blocked
  }));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
        Project Timeline & Critical Path Schedule
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
        Calculated using NetworkX DAG longest path & deterministic dependency analysis.
      </Typography>

      {/* Critical Path Flow Header */}
      <Paper sx={{ p: 2.5, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 700, mb: 1 }}>
          CRITICAL PATH SEQUENCE:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {criticalPath.critical_path.map((node, i) => (
            <React.Fragment key={i}>
              <Chip
                label={node}
                color={node === 'Procurement' ? 'error' : 'primary'}
                sx={{ fontWeight: 700 }}
              />
              {i < criticalPath.critical_path.length - 1 && (
                <Typography variant="body2" sx={{ color: '#64748b' }}>→</Typography>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Paper>

      {/* Stage Duration Bar Chart */}
      <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart2 color="#38bdf8" size={20} /> Stage Execution Duration (Days) Bar Chart
          </Typography>
          <Chip label="NetworkX Path Weight" size="small" variant="outlined" sx={{ color: '#38bdf8' }} />
        </Box>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#ffffff' }}
                formatter={(val: any) => [`${val} days`, 'Duration']}
              />
              <Bar dataKey="duration" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Stage Duration (Days)" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Gantt Timeline Bars */}
      <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 600 }}>
          Workflow Stage Execution Progress Bars
        </Typography>

        {criticalPath.graph_nodes.map((node) => (
          <Box key={node.id} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                {node.label} ({node.department})
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Est Duration: {node.duration_days} days
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (node.duration_days / 15) * 100)}
              sx={{
                height: 14,
                borderRadius: 7,
                bgcolor: '#1e293b',
                '& .MuiLinearProgress-bar': {
                  bgcolor: node.is_blocked ? '#ef4444' : node.state === 'APPROVED' ? '#10b981' : '#38bdf8'
                }
              }}
            />
          </Box>
        ))}
      </Paper>
    </Box>
  );
};
