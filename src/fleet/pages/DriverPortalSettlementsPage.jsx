import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box,
  TableContainer, Typography, Chip, useTheme, Card, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid
} from '@mui/material';
import { Handshake, Visibility } from '@mui/icons-material';
import api from '../../services/api';
import { PageHeader } from '../components/Common';

export default function DriverPortalSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewSummary, setViewSummary] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const theme = useTheme();

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/me/driver-settlements', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setSettlements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching driver settlements', err);
      setSettlements([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleViewSummary = async (id) => {
    try {
      const res = await api.get(`/me/driver-settlements/${id}`);
      setViewSummary(res.data?.data || res.data || null);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching summary', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'SETTLED': return 'success';
      case 'REJECTED': return 'error';
      case 'UNDER_REVIEW': return 'warning';
      case 'SUBMITTED': return 'info';
      default: return 'default';
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<Handshake color="primary" sx={{ fontSize: 40 }}/>}
      />

      <Card sx={{ mt: 3, borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.No', 'Advance ID', 'Net Amount', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {settlements.map((s, i) => (
                <TableRow key={s.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{s.advanceId || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>₹{s.netAmount?.toLocaleString()}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={s.status || 'PENDING'} size="small" color={getStatusColor(s.status)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <IconButton size="small" color="primary" onClick={() => handleViewSummary(s.id)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {settlements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No settlements found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Settlement Details</DialogTitle>
        <DialogContent dividers>
          {viewSummary ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Net Amount</Typography>
                <Typography variant="h6" color={viewSummary.netAmount >= 0 ? 'success.main' : 'error.main'}>
                  ₹{viewSummary.netAmount?.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip label={viewSummary.status} size="small" color={getStatusColor(viewSummary.status)} sx={{ mt: 0.5, fontWeight: 'bold' }} />
              </Grid>
            </Grid>
          ) : (
            <Typography>Loading details...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
