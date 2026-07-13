import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, CircularProgress, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, Stack, Skeleton, Snackbar, Alert, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../services/api';
import { PageHeader } from '../components/Common';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [viewReport, setViewReport] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setReports(items);
    } catch (err) {
      console.error('reports fetch failed', err?.response?.status, err?.response?.data || err.message);
      setReports([]);
      setSnack({ open: true, msg: 'Failed to load reports', severity: 'error' });
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const types = [...new Set(reports.map(r => r.type))];

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.name || '').toLowerCase().includes(q) || (r.type || '').toLowerCase().includes(q) || (r.period || '').toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    return matchQ && matchType;
  });

  const paged = filtered.slice(page * 10, (page + 1) * 10);

  const typeColors = {
    Performance: '#1976d2', Fuel: '#f59e0b', Maintenance: '#ef4444',
    Safety: '#10b981', Operations: '#8b5cf6', Finance: '#06b6d4',
  };

  const handleExport = (report) => {
    setSnack({ open: true, msg: `Exporting "${report.name}"...`, severity: 'info' });
  };

  return (
    <Box>
      <PageHeader title="Reports" subtitle={`${filtered.length} reports available`} icon={AssessmentIcon}
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button startIcon={<DownloadIcon />} variant="contained" onClick={() => setSnack({ open: true, msg: 'Export all feature coming soon', severity: 'info' })} sx={{ flex: { xs: 1, sm: 'none' } }}>Export All</Button>
          </Stack>
        }
      />

      <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ py: 2, pr: 2, pl: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-start', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField placeholder="Search reports…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.primary' }} /></InputAdornment> }}
            sx={{ width: { xs: '100%', sm: 400 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }} size="small" />
          <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
              sx={{ bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3a3a42' } }}>
              <MenuItem value="all">All Types</MenuItem>
              {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2, p: 2 }}>
          <Card sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>TOTAL REPORTS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{reports.length}</Typography>
          </Card>
          <Card sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>READY</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>{reports.filter(r => r.status === 'Ready').length}</Typography>
          </Card>
          <Card sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>GENERATING</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>{reports.filter(r => r.status === 'Generating').length}</Typography>
          </Card>
          <Card sx={{ p: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>TOTAL RECORDS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#60a5fa' }}>{reports.reduce((s, r) => s + (r.records || 0), 0).toLocaleString()}</Typography>
          </Card>
        </Box>

        <Box sx={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : reports.length === 0 ? (
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
                {paged.map((r, i) => (
                  <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{page * 10 + i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', color: 'text.primary' }}>{r.name}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}><Chip label={r.type} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: (typeColors[r.type] || '#666') + '22', color: typeColors[r.type] || '#aaa' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.period}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.records?.toLocaleString() || '—'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Chip label={r.status?.toUpperCase()} size="small"
                        color={r.status === 'Ready' ? 'success' : r.status === 'Generating' ? 'warning' : 'default'}
                        sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setViewReport(r)} sx={{ color: '#60a5fa', textTransform: 'none', fontSize: '0.75rem' }}>
                          View
                        </Button>
                        {r.status === 'Ready' && (
                          <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExport(r)} sx={{ color: '#60a5fa', textTransform: 'none', fontSize: '0.75rem' }}>
                            Export
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No reports match your filters</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Box>

        <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={10} onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[10]}
          sx={{ borderTop: '1px solid', borderColor: 'divider', color: 'text.primary' }} />
      </Card>

      <Dialog open={Boolean(viewReport)} onClose={() => setViewReport(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', color: 'text.primary' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Report Details</Typography>
          <IconButton onClick={() => setViewReport(null)} size="small"><CloseIcon sx={{ color: 'text.primary' }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper' }}>
          {viewReport && (
            <Grid container spacing={3} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Report Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>{viewReport.name || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Type</Typography>
                <Box sx={{ mt: 0.5 }}><Chip label={viewReport.type} size="small" sx={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: (typeColors[viewReport.type] || '#666') + '22', color: typeColors[viewReport.type] || '#aaa' }} /></Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Period</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>{viewReport.period || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Records</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>{viewReport.records?.toLocaleString() || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={viewReport.status?.toUpperCase()} size="small"
                    color={viewReport.status === 'Ready' ? 'success' : viewReport.status === 'Generating' ? 'warning' : 'default'}
                    sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                </Box>
              </Grid>
              {viewReport.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Description</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>{viewReport.description}</Typography>
                </Grid>
              )}
              {viewReport.createdAt && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Created</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
                    {new Date(viewReport.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', px: 3, py: 2 }}>
          <Button onClick={() => setViewReport(null)} sx={{ color: 'text.primary' }}>Close</Button>
          {viewReport?.status === 'Ready' && (
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => { handleExport(viewReport); setViewReport(null); }}>Export</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
