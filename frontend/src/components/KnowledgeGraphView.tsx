import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Paper, Typography, Chip, LinearProgress, Grid, Card, CardContent,
  Button, IconButton, TextField, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import {
  Share2, ZoomIn, ZoomOut, RefreshCw, Layers, ShieldCheck, Cpu, FileText,
  ArrowRight, BarChart2, PieChart as PieChartIcon, Search, Database
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { KnowledgeGraphData } from '../types';

interface GraphProps {
  projectId: number;
}

interface NodePosition {
  id: string;
  label: string;
  title: string;
  category: string;
  color: string;
  x: number;
  y: number;
}

export const KnowledgeGraphView: React.FC<GraphProps> = ({ projectId }) => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodePosition | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    loadGraph();
  }, [projectId]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getKnowledgeGraph(projectId);
      setGraphData(data);

      // Hierarchical Layered Layout Logic
      const width = 1000;
      const height = 550;

      const layerCategories = ['Project', 'Requirement', 'Design', 'Simulation', 'Test', 'Procurement', 'Document'];
      const layerY: Record<string, number> = {
        Project: 60,
        Requirement: 140,
        Design: 230,
        Simulation: 320,
        Test: 410,
        Procurement: 410,
        Document: 490
      };

      const categoryGroup: Record<string, any[]> = {};
      data.nodes.forEach((n) => {
        if (!categoryGroup[n.category]) categoryGroup[n.category] = [];
        categoryGroup[n.category].push(n);
      });

      const nodes: NodePosition[] = [];
      Object.keys(categoryGroup).forEach((cat) => {
        const catNodes = categoryGroup[cat];
        const count = catNodes.length;
        const targetY = layerY[cat] || 300;

        catNodes.forEach((n, idx) => {
          const spacing = width / (count + 1);
          const targetX = spacing * (idx + 1);
          nodes.push({
            ...n,
            x: targetX,
            y: targetY
          });
        });
      });

      setNodePositions(nodes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNodeId) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNodeId) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;
        setNodePositions((prev) =>
          prev.map((n) => (n.id === draggedNodeId ? { ...n, x: mouseX, y: mouseY } : n))
        );
      }
      return;
    }
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  if (loading || !graphData) return <LinearProgress color="primary" />;

  // Prepare Analytical Bar Chart Data
  const categoryCounts: Record<string, number> = {};
  graphData.nodes.forEach((n) => {
    categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
  });

  const categoryBarData = Object.keys(categoryCounts).map((cat) => ({
    category: cat,
    count: categoryCounts[cat]
  }));

  const relationCounts: Record<string, number> = {};
  graphData.edges.forEach((e) => {
    relationCounts[e.relation] = (relationCounts[e.relation] || 0) + 1;
  });

  const relationPieData = Object.keys(relationCounts).map((rel) => ({
    name: rel,
    value: relationCounts[rel]
  }));

  const pieColors = ['#00bcd4', '#9c27b0', '#4caf50', '#ff9800', '#e91e63', '#3f51b5'];

  const filteredNodePositions = nodePositions.filter((n) => {
    const matchCat = selectedCategory === 'ALL' || n.category === selectedCategory;
    const matchSearch = !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredNodeIds = new Set(filteredNodePositions.map((n) => n.id));

  const categoryColors: Record<string, string> = {
    Project: '#3f51b5',
    Requirement: '#00bcd4',
    Design: '#9c27b0',
    Simulation: '#4caf50',
    Procurement: '#e91e63',
    Test: '#ff9800',
    Document: '#607d8b'
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc' }}>
            Engineering Knowledge Graph & Dependency Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Multi-layered semantic graph connecting customer specifications, RF designs, simulations, procurement orders, and compliance reports.
          </Typography>
        </Box>
        <Chip
          icon={<Database size={14} color="#38bdf8" />}
          label={`${graphData.nodes.length} Entities | ${graphData.edges.length} Semantic Edges`}
          variant="outlined"
          sx={{ color: '#38bdf8', borderColor: '#0284c7', fontWeight: 600 }}
        />
      </Box>

      {/* ANALYTICAL GRAPH SECTION (BAR CHART & DONUT CHART) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Bar Chart: Entity Distribution */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart2 color="#38bdf8" size={18} /> Entity Type Distribution Bar Chart
              </Typography>
              <Chip label="Node Metrics" size="small" variant="outlined" sx={{ color: '#38bdf8', fontSize: 10 }} />
            </Box>
            <Box sx={{ width: '100%', height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#ffffff' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Entities Count">
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || '#38bdf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Donut Chart: Relationship Types */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChartIcon color="#a855f7" size={18} /> Relationship Edges Breakdown
              </Typography>
              <Chip label="Semantic Links" size="small" variant="outlined" sx={{ color: '#a855f7', fontSize: 10 }} />
            </Box>
            <Box sx={{ width: '100%', height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={relationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {relationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#ffffff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* GRAPHICAL CANVAS SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
          Interactive Layered Dependency Canvas
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ bgcolor: '#1e293b', minWidth: 200 }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))} sx={{ bgcolor: '#1e293b', color: '#38bdf8' }}>
              <ZoomIn size={18} />
            </IconButton>
            <IconButton onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))} sx={{ bgcolor: '#1e293b', color: '#38bdf8' }}>
              <ZoomOut size={18} />
            </IconButton>
            <IconButton onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); loadGraph(); }} sx={{ bgcolor: '#1e293b', color: '#38bdf8' }}>
              <RefreshCw size={18} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Filter Category Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {['ALL', 'Project', 'Requirement', 'Design', 'Simulation', 'Procurement', 'Test', 'Document'].map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setSelectedCategory(cat)}
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              bgcolor: selectedCategory === cat ? (categoryColors[cat] || '#0284c7') : '#1e293b',
              color: '#ffffff'
            }}
          />
        ))}
      </Box>

      {/* Modern SVG Graph Canvas */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          width: '100%',
          height: 560,
          bgcolor: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: 3,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          mb: 4
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 1000 550"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <rect width="2000" height="2000" x="-500" y="-500" fill="url(#grid)" />

            {/* Edge Curves with Relationship Labels */}
            {graphData.edges.map((edge, idx) => {
              const srcNode = nodePositions.find((n) => n.id === edge.source);
              const tgtNode = nodePositions.find((n) => n.id === edge.target);

              if (!srcNode || !tgtNode) return null;
              if (selectedCategory !== 'ALL' && (!filteredNodeIds.has(srcNode.id) && !filteredNodeIds.has(tgtNode.id))) {
                return null;
              }

              const isSelected = selectedNode && (selectedNode.id === srcNode.id || selectedNode.id === tgtNode.id);
              const midX = (srcNode.x + tgtNode.x) / 2;
              const midY = (srcNode.y + tgtNode.y) / 2;

              return (
                <g key={idx}>
                  <path
                    d={`M ${srcNode.x} ${srcNode.y} Q ${midX} ${midY - 15} ${tgtNode.x} ${tgtNode.y}`}
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    markerEnd={isSelected ? 'url(#arrow-active)' : 'url(#arrow)'}
                  />
                  <rect
                    x={midX - 35}
                    y={midY - 20}
                    width={70}
                    height={16}
                    rx={4}
                    fill="#0f172a"
                    stroke={isSelected ? '#0284c7' : '#1e293b'}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    fill={isSelected ? '#38bdf8' : '#94a3b8'}
                    fontSize="9"
                    fontWeight="600"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {edge.relation}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodePositions.map((node) => {
              if (!filteredNodeIds.has(node.id)) return null;

              const isSelected = selectedNode?.id === node.id;
              const isProject = node.category === 'Project';
              const nodeRadius = isProject ? 30 : 22;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedNodeId(node.id);
                  }}
                  onClick={() => setSelectedNode(node)}
                  style={{ cursor: 'pointer' }}
                >
                  {isSelected && (
                    <circle
                      r={nodeRadius + 6}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />
                  )}

                  <circle
                    r={nodeRadius}
                    fill={node.color}
                    stroke={isSelected ? '#ffffff' : '#0f172a'}
                    strokeWidth={3}
                    style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}
                  />

                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#ffffff"
                    fontSize={isProject ? '11' : '9'}
                    fontWeight="700"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label}
                  </text>

                  <rect
                    x="-50"
                    y={nodeRadius + 5}
                    width="100"
                    height="16"
                    rx="4"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y={nodeRadius + 16}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="9"
                    fontWeight="500"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </Paper>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: '#0f172a', border: '1px solid #0284c7', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                {selectedNode.label}
              </Typography>
              <Chip label={selectedNode.category} size="small" sx={{ bgcolor: selectedNode.color, color: '#ffffff', fontWeight: 700 }} />
            </Box>
            <Button size="small" onClick={() => setSelectedNode(null)}>Close</Button>
          </Box>
          <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
            {selectedNode.title}
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#38bdf8', mb: 1, fontWeight: 600 }}>
            Connected Entity Relationships:
          </Typography>
          <Grid container spacing={1.5}>
            {graphData.edges
              .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
              .map((edge, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Box sx={{ bgcolor: '#1e293b', p: 1.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700 }}>{edge.source}</Typography>
                    <Chip label={edge.relation} size="small" variant="outlined" sx={{ color: '#a855f7', fontSize: 9 }} />
                    <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 700 }}>{edge.target}</Typography>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Paper>
      )}

      {/* Entity Table */}
      <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 600 }}>
          Structured Knowledge Base Entities ({filteredNodePositions.length} items)
        </Typography>

        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>NODE CODE</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>CATEGORY</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>TITLE / METADATA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNodePositions.map((node) => (
              <TableRow key={node.id} hover onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                <TableCell sx={{ color: '#38bdf8', fontWeight: 700 }}>{node.label}</TableCell>
                <TableCell><Chip label={node.category} size="small" sx={{ bgcolor: node.color, color: '#fff', fontSize: 10 }} /></TableCell>
                <TableCell sx={{ color: '#cbd5e1' }}>{node.title}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};
