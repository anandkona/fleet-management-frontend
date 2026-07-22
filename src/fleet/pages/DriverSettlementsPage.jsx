import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  TableContainer, Typography, Chip, useTheme, Card, CircularProgress,
  Grid
} from '@mui/material';
import { Add, CheckCircle, Cancel, Handshake, Visibility, Edit, Delete as DeleteIcon } from '@mui/icons-material';
import { driverSettlementService } from '../../services/api';
import { PageHeader, ConfirmDialog } from '../components/Common';

export default function DriverSettlementsPage() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewSummary, setViewSummary] = useState(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [form, setForm] = useState({ advanceId: '', driverId: '', netAmount: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driverSettlementService.getAll({ limit: 100 });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setSettlements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching settlements', err);
      setSettlements([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') await driverSettlementService.approve(id, 'Approved by admin');
      if (action === 'reject') await driverSettlementService.reject(id, 'Rejected by admin');
      fetchSettlements();
    } catch (err) {
      console.error(`Error ${action} settlement`, err);
    }
  };

  const handleSave = async () => {
    if (!form.advanceId || !form.driverId) return;
    setSaving(true);
    try {
      if (editingId) {
        await driverSettlementService.update(editingId, { ...form, netAmount: Number(form.netAmount) });
      } else {
        await driverSettlementService.create({ ...form, netAmount: Number(form.netAmount) });
      }
      setFormDialogOpen(false);
      fetchSettlements();
    } catch (err) {
      console.error('Error saving settlement', err);
    }
    setSaving(false);
  };

  const handleEdit = (s) => {
    setForm({
      advanceId: s.advanceId || '',
      driverId: s.driverId || '',
      netAmount: s.netAmount || '',
      notes: s.notes || ''
    });
    setEditingId(s.id);
    setFormDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await driverSettlementService.delete(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: null });
      fetchSettlements();
    } catch (err) {
      console.error('Error deleting settlement', err);
    }
  };

  const handleViewSummary = async (id) => {
    try {
      const res = await driverSettlementService.getSummary(id);
      setViewSummary(res.data?.data || res.data || null);
      setViewDialogOpen(true);
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
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ advanceId: '', driverId: '', netAmount: '', notes: '' }); setEditingId(null); setFormDialogOpen(true); }} sx={{ borderRadius: 2 }}>
            Record Settlement
          </Button>
        }
      />
      

      <Card sx={{ mt: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Advance ID', 'Driver ID', 'Net Amount', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {settlements.map((s, idx) => (
                <TableRow key={s.id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', fontWeight: 600 }}>{idx + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{s.advanceId || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{s.driverId || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>₹{s.netAmount?.toLocaleString() || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Chip label={s.status || 'PENDING'} size="small" color={getStatusColor(s.status)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <IconButton size="small"  onClick={() => handleViewSummary(s.id)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                      <Visibility sx={{ fontSize: 17 }}  />
                    </IconButton>
                    <IconButton size="small"  onClick={() => handleEdit(s)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                      <Edit sx={{ fontSize: 17 }}  />
                    </IconButton>
                    <IconButton size="small"  onClick={() => setDeleteConfirm({ open: true, id: s.id })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                      <DeleteIcon sx={{ fontSize: 17 }}  />
                    </IconButton>
                    {(s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW') && (
                      <>
                        <IconButton size="small"  onClick={() => handleAction(s.id, 'approve')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
                          <CheckCircle sx={{ fontSize: 17 }}  />
                        </IconButton>
                        <IconButton size="small"  onClick={() => handleAction(s.id, 'reject')} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                          <Cancel sx={{ fontSize: 17 }}  />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {settlements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    No settlements found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Settlement' : 'Record Settlement'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Advance ID" value={form.advanceId} onChange={(e) => setForm({ ...form, advanceId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Driver ID" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Net Amount" value={form.netAmount} onChange={(e) => setForm({ ...form, netAmount: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.advanceId || !form.driverId}>
            {saving ? 'Processing...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Settlement Summary</DialogTitle>
        <DialogContent dividers>
          {viewSummary ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Advance Amount</Typography>
                <Typography variant="h6">₹{viewSummary.advanceAmount?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                <Typography variant="h6">₹{viewSummary.totalExpenses?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Net Payable / Receivable</Typography>
                <Typography variant="h6" color={viewSummary.netAmount >= 0 ? 'success.main' : 'error.main'}>
                  ₹{viewSummary.netAmount?.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography>Loading summary...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Settlement"
        content="Are you sure you want to delete this settlement?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



