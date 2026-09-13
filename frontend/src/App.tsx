import React, { useEffect, useState } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography,
  Tabs, Tab, Container, Select, MenuItem, FormControl, InputLabel, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid
} from '@mui/material';
import {
  LayoutDashboard, GitBranch, Link2, Calendar, Cpu, FileText, Share2, Layers, Plus
} from 'lucide-react';
import { api } from './services/api';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { WorkflowBoard } from './components/WorkflowBoard';
import { TraceabilityMatrix } from './components/TraceabilityMatrix';
import { TimelineGanttView } from './components/TimelineGanttView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { DocumentRAGChat } from './components/DocumentRAGChat';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0f19',
      paper: '#0f172a'
    },
    primary: {
      main: '#38bdf8'
    },
    secondary: {
      main: '#a855f7'
    },
    success: {
      main: '#4ade80'
    },
    warning: {
      main: '#f59e0b'
    },
    error: {
      main: '#f87171'
    }
  },
  typography: {
    fontFamily: '"Inter", sans-serif'
  }
});

export const App: React.FC = () => {
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // New Project Dialog State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newWorkflowType, setNewWorkflowType] = useState<string>('ANTENNA_RF');
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjectsList(data);
      if (data.length > 0 && !data.some((p: any) => p.id === selectedProjectId)) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async () => {
    if (!newCode || !newName) {
      alert('Please fill in Project Code and Project Name.');
      return;
    }
    setCreating(true);
    try {
      const res = await api.createProject({
        code: newCode,
        name: newName,
        description: newDesc,
        workflow_type: newWorkflowType
      });
      setCreateModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      await loadProjects();
      setSelectedProjectId(res.project_id);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error creating project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#0b0f19', pb: 6 }}>
        {/* Top Navbar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#0f172a', borderBottom: '1px solid #1e293b' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ bgcolor: '#0284c7', p: 1, borderRadius: 1.5, display: 'flex' }}>
                <Layers color="#ffffff" size={22} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
                  EngiFlow AI
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11 }}>
                  AI-Native Engineering Workflow & Predictive Delivery Platform
                </Typography>
              </Box>
            </Box>

            {/* Active Project Switcher & New Project Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label="ABC Company" size="small" variant="outlined" sx={{ color: '#38bdf8', borderColor: '#0284c7', fontWeight: 700 }} />
              
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel sx={{ color: '#94a3b8' }}>Active Project</InputLabel>
                <Select
                  value={selectedProjectId}
                  label="Active Project"
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  sx={{ bgcolor: '#1e293b', color: '#f8fafc' }}
                >
                  {projectsList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.code}: {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={() => setCreateModalOpen(true)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                New Project
              </Button>
            </Box>
          </Toolbar>

          {/* Navigation Tabs */}
          <Container maxWidth="xl">
            <Tabs
              value={currentTab}
              onChange={(_, val) => setCurrentTab(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: 13,
                  py: 1.5,
                  minHeight: 48
                },
                '& .Mui-selected': {
                  color: '#38bdf8'
                }
              }}
            >
              <Tab icon={<LayoutDashboard size={16} />} iconPosition="start" label="Executive Dashboard" value="dashboard" />
              <Tab icon={<GitBranch size={16} />} iconPosition="start" label="Workflow & Approvals" value="workflow" />
              <Tab icon={<Link2 size={16} />} iconPosition="start" label="Requirements & Traceability" value="traceability" />
              <Tab icon={<Calendar size={16} />} iconPosition="start" label="Timeline & Gantt" value="gantt" />
              <Tab icon={<Cpu size={16} />} iconPosition="start" label="What-If Simulator" value="whatif" />
              <Tab icon={<FileText size={16} />} iconPosition="start" label="Document RAG Chat" value="rag" />
              <Tab icon={<Share2 size={16} />} iconPosition="start" label="Knowledge Graph" value="graph" />
            </Tabs>
          </Container>
        </AppBar>

        {/* Main View Area */}
        <Container maxWidth="xl" sx={{ mt: 3 }}>
          {currentTab === 'dashboard' && <ExecutiveDashboard projectId={selectedProjectId} onNavigate={setCurrentTab} />}
          {currentTab === 'workflow' && <WorkflowBoard projectId={selectedProjectId} />}
          {currentTab === 'traceability' && <TraceabilityMatrix projectId={selectedProjectId} />}
          {currentTab === 'gantt' && <TimelineGanttView projectId={selectedProjectId} />}
          {currentTab === 'whatif' && <WhatIfSimulator projectId={selectedProjectId} />}
          {currentTab === 'rag' && <DocumentRAGChat projectId={selectedProjectId} />}
          {currentTab === 'graph' && <KnowledgeGraphView projectId={selectedProjectId} />}
        </Container>

        {/* Create Project Modal Dialog */}
        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#0f172a', color: '#f8fafc', fontWeight: 700 }}>
            Create New Engineering Project
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#0f172a', color: '#cbd5e1', pt: 2 }}>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Project Code"
                  placeholder="e.g. P004"
                  variant="outlined"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  sx={{ bgcolor: '#1e293b' }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Project Name"
                  placeholder="e.g. Airborne Radar Power Module"
                  variant="outlined"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  sx={{ bgcolor: '#1e293b' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description / Scope"
                  placeholder="Engineering requirements, baseline specs, department objectives..."
                  variant="outlined"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  sx={{ bgcolor: '#1e293b' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Configurable Workflow Template</InputLabel>
                  <Select
                    value={newWorkflowType}
                    label="Configurable Workflow Template"
                    onChange={(e) => setNewWorkflowType(e.target.value)}
                    sx={{ bgcolor: '#1e293b', color: '#f8fafc' }}
                  >
                    <MenuItem value="ANTENNA_RF">Antenna / RF Hardware Workflow (Requirements → RF Design → Sim → Procurement → Mfg → Test → QA)</MenuItem>
                    <MenuItem value="SOFTWARE_AVIONICS">Software / Avionics Workflow (Requirements → SW Design → Dev → Integration → QA → Delivery)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#0f172a', p: 2.5 }}>
            <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#94a3b8' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateProject}
              disabled={creating}
            >
              {creating ? 'Creating Project...' : 'Initialize Project'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};
