import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, CircularProgress, Button, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../../services/api';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports', { params: { limit: 100 } });
      console.debug('/reports response', res?.status, res?.data);
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setReports(items);
    } catch (err) {
      console.error('reports fetch failed', err?.response?.status, err?.response?.data || err.message);
      setReports([]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const types = [...new Set(reports.map(r => r.type))];
  const filtered = typeFilter === 'all' ? reports : reports.filter(r => r.type === typeFilter);

  const typeColors = {
    Performance: '#1976d2', Fuel: '#f59e0b', Maintenance: '#ef4444',
    Safety: '#10b981', Operations: '#8b5cf6', Finance: '#06b6d4',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 140, flex: { xs: 1, sm: 'none' } }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}
              sx={{ bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3a3a42' } }}>
              <MenuItem value="all">All Types</MenuItem>
              {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2, mb: 3 }}>
        <Card sx={{ p: 2 }}>
          <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>TOTAL REPORTS</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{reports.length}</Typography>
        </Card>
        <Card sx={{ p: 2 }}>
          <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>READY</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>{reports.filter(r => r.status === 'Ready').length}</Typography>
        </Card>
        <Card sx={{ p: 2 }}>
          <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>GENERATING</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>{reports.filter(r => r.status === 'Generating').length}</Typography>
        </Card>
        <Card sx={{ p: 2 }}>
          <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>TOTAL RECORDS</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#60a5fa' }}>{reports.reduce((s, r) => s + (r.records || 0), 0).toLocaleString()}</Typography>
        </Card>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          reports.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="h6">No reports found</Typography>
              <Typography sx={{ mt: 1, fontSize: '0.9rem' }}>Reports will appear here when available from the backend.</Typography>
            </Box>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['S.NO', 'Report Name', 'Type', 'Period', 'Records', 'Status', 'Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}><Chip label={r.type} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: (typeColors[r.type] || '#666') + '22', color: typeColors[r.type] || '#aaa' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.period}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.records?.toLocaleString() || '—'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Chip label={r.status?.toUpperCase()} size="small"
                        color={r.status === 'Ready' ? 'success' : r.status === 'Generating' ? 'warning' : 'default'}
                        sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      {r.status === 'Ready' && (
                        <Button size="small" startIcon={<DownloadIcon />} sx={{ color: '#60a5fa', textTransform: 'none', fontSize: '0.75rem' }}>
                          Export
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </Card>
    </Box>
  );
}
