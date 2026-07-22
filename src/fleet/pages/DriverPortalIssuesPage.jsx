import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box,
  TableContainer, Chip, useTheme, Card, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid
} from '@mui/material';
import { ReportProblem, Add } from '@mui/icons-material';
import { PageHeader } from '../components/Common';
import api from '../../services/api';

export default function DriverPortalIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const theme = useTheme();

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/me/driver-issues', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching driver issues', err);
      setIssues([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      case 'OPEN': return 'error';
      case 'IN_PROGRESS': return 'warning';
      default: return 'info';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  const handleRequestSubmit = async () => {
    try {
      await api.post('/me/driver-issues', {
        title: form.title,
        description: form.description,
        priority: form.priority
      });
      setRequestDialog(false);
      setForm({ title: '', description: '', priority: 'MEDIUM' });
      fetchIssues();
    } catch (err) {
      console.error(err);
      alert('Failed to report issue');
    }
  };

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<ReportProblem color="primary" sx={{ fontSize: 40 }}/>}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setRequestDialog(true)} sx={{ borderRadius: 2, px: 3, py: 1 }}>
            Report Issue
          </Button>
        }
      />

      <Card sx={{ mt: 3, borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Reported Date', 'Issue', 'Description', 'Priority', 'Status'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.map((issue, i) => (
                <TableRow key={issue.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>
                    {issue.reportedAt || issue.createdAt ? new Date(issue.reportedAt || issue.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {issue.title || issue.issueType || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {issue.description || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={issue.priority || 'MEDIUM'} size="small" color={getPriorityColor(issue.priority)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={issue.status || 'OPEN'} size="small" color={getStatusColor(issue.status)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                </TableRow>
              ))}
              {issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No issues reported.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report an Issue</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Issue Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Engine Making Noise, Flat Tire" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label="Detailed Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRequestSubmit} disabled={!form.title}>
            Submit Issue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}