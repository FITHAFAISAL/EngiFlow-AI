import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Chip, Alert, LinearProgress, Divider } from '@mui/material';
import { Search, FileText, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { RAGResponse } from '../types';

interface RAGProps {
  projectId: number;
}

export const DocumentRAGChat: React.FC<RAGProps> = ({ projectId }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    'What is the required gain?',
    'What test procedure verifies REQ-003?',
    'Which document contains operating temperature limits?'
  ];

  const handleQuery = async (qText?: string) => {
    const searchText = qText || query;
    if (!searchText) return;
    setLoading(true);
    try {
      const res = await api.queryRAG(projectId, searchText);
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
        Engineering Document Intelligence & RAG System
      </Typography>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
        Query customer specs, HFSS simulation reports, and MIL-STD standards with evidence-backed source citations.
      </Typography>

      {/* Query Bar */}
      <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Ask an engineering specification question..."
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            sx={{ bgcolor: '#1e293b' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleQuery()}
            disabled={loading}
            startIcon={<Search size={18} />}
          >
            Query
          </Button>
        </Box>

        <Typography variant="caption" sx={{ color: '#94a3b8', mr: 1 }}>Sample Queries:</Typography>
        <Box sx={{ display: 'inline-flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {sampleQueries.map((sq, i) => (
            <Chip
              key={i}
              label={sq}
              size="small"
              onClick={() => { setQuery(sq); handleQuery(sq); }}
              sx={{ bgcolor: '#1e293b', color: '#38bdf8', cursor: 'pointer', '&:hover': { bgcolor: '#334155' } }}
            />
          ))}
        </Box>
      </Paper>

      {loading && <LinearProgress color="secondary" sx={{ mb: 3 }} />}

      {/* RAG Answer Display */}
      {result && (
        <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #1e293b', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileText color="#38bdf8" size={20} /> Verified Engineering Answer
            </Typography>
            <Chip
              label={`Confidence: ${(result.confidence * 100).toFixed(0)}%`}
              color={result.has_insufficient_evidence ? 'error' : 'success'}
              size="small"
            />
          </Box>

          {result.has_insufficient_evidence ? (
            <Alert severity="error">
              <strong>INSUFFICIENT EVIDENCE:</strong> {result.answer}
            </Alert>
          ) : (
            <Box>
              <Box sx={{ bgcolor: '#1e293b', p: 2.5, borderRadius: 2, mb: 3, borderLeft: '4px solid #38bdf8' }}>
                <Typography variant="body1" sx={{ color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {result.answer}
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1, fontWeight: 600 }}>
                Retrieved Document Source Evidence:
              </Typography>
              {result.sources.map((src, i) => (
                <Paper key={i} sx={{ p: 2, bgcolor: '#131b2e', border: '1px solid #1e293b', mb: 1.5, borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ color: '#38bdf8' }}>
                      [{src.doc_code}] {src.doc_title} — {src.section}
                    </Typography>
                    <Chip label={`Match Score: ${(src.score * 100).toFixed(0)}%`} size="small" variant="outlined" sx={{ color: '#a855f7' }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontStyle: 'italic', fontFamily: 'monospace' }}>
                    "{src.text}"
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};
