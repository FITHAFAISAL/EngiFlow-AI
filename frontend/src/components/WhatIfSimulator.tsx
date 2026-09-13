import React, { useState } from 'react';
import { Box, Paper, Typography, Slider, Button, Grid, Alert, Card, CardContent } from '@mui/material';
import { Cpu, RefreshCw, ArrowRight, ShieldCheck, TrendingDown } from 'lucide-react';
import { api } from '../services/api';
import { WhatIfResult } from '../types';

interface WhatIfProps {
  projectId: number;
}

export const WhatIfSimulator: React.FC<WhatIfProps> = ({ projectId }) => {
  const [procDelay, setProcDelay] = useState<number>(0);
  const [engDelta, setEngDelta] = useState<number>(0);
  const [simCycles, setSimCycles] = useState<number>(0);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.runWhatIfSimulation(projectId, procDelay, engDelta, simCycles);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
        Predictive "What-If" Schedule Simulator
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
        Simulate schedule adjustments in an isolated Python sandbox without modifying live project data.
      </Typography>

      <Grid container spacing={3}>
        {/* Controls Panel */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 600 }}>
              Simulation Parameter Controls
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>
                Procurement Delay Adjustment: <strong>{procDelay > 0 ? `+${procDelay}` : procDelay} days</strong>
              </Typography>
              <Slider
                value={procDelay}
                onChange={(_, val) => setProcDelay(val as number)}
                min={-5}
                max={15}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>
                Manufacturing Engineers Added: <strong>+{engDelta} engineers</strong>
              </Typography>
              <Slider
                value={engDelta}
                onChange={(_, val) => setEngDelta(val as number)}
                min={0}
                max={4}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>
                HFSS Simulation Rework Cycles: <strong>+{simCycles} cycle(s)</strong>
              </Typography>
              <Slider
                value={simCycles}
                onChange={(_, val) => setSimCycles(val as number)}
                min={0}
                max={3}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSimulate}
              disabled={loading}
              startIcon={<Cpu size={18} />}
            >
              {loading ? 'Running Simulation Engine...' : 'Run Simulation Sandbox'}
            </Button>
          </Paper>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={7}>
          {result ? (
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 600 }}>
                Simulated Completion Forecast
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
                    <CardContent>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>ORIGINAL FORECAST</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                        {result.original_completion}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #0284c7' }}>
                    <CardContent>
                      <Typography variant="caption" sx={{ color: '#38bdf8' }}>SIMULATED FORECAST</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#38bdf8' }}>
                        {result.simulated_completion}
                      </Typography>
                      <Typography variant="caption" sx={{ color: result.schedule_variance_days > 0 ? '#f87171' : '#4ade80' }}>
                        {result.schedule_variance_days > 0 ? `+${result.schedule_variance_days} days shift` : 'Schedule recovered'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>IMPACT SUMMARY:</strong> {result.impact_summary}
              </Alert>

              <Typography variant="subtitle2" sx={{ color: '#4ade80', fontWeight: 700, mb: 1 }}>
                Recommended Recovery Strategies:
              </Typography>
              {result.recovery_opportunities.map((rec, i) => (
                <Typography key={i} variant="body2" sx={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                  <ArrowRight size={14} color="#4ade80" /> {rec}
                </Typography>
              ))}
            </Paper>
          ) : (
            <Paper sx={{ p: 5, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, textAlign: 'center' }}>
              <Cpu size={32} color="#38bdf8" />
              <Typography variant="h6" sx={{ color: '#f8fafc', mt: 2 }}>Ready for What-If Simulation</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Adjust parameters on the left and click "Run Simulation Sandbox" to see instant schedule forecasts.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
