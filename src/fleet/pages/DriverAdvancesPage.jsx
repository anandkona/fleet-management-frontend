import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  TableContainer, Typography, Chip, useTheme, Card, CircularProgress,
  Grid
} from '@mui/material';
import { Add, Edit, CheckCircle, Cancel, RequestQuote, Delete as DeleteIcon } from '@mui/icons-material';
import { driverAdvanceService } from '../../services/api';
import { PageHeader, ConfirmDialog } from '../components/Common';

export default function DriverAdvancesPage() {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ driverId: '', vehicleId: '', amount: '', purpose: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driverAdvanceService.getAll({ limit: 100 });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setAdvances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching advances', err);
      setAdvances([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  const handleSave = async () => {
    if (!form.driverId || !form.amount) return;
    setSaving(true);
    try {
      if (editingId) {
        await driverAdvanceService.update(editingId, { ...form, amount: Number(form.amount) });
      } else {
        await driverAdvanceService.create({ ...form, amount: Number(form.amount) });
      }
      setDialogOpen(false);
      fetchAdvances();
    } catch (err) {
      console.error('Error saving advance', err);
    }
    setSaving(false);
  };

  const handleEdit = (a) => {
    setForm({
      driverId: a.driverId || '',
      vehicleId: a.vehicleId || '',
      amount: a.amount || '',
      purpose: a.purpose || '',
      notes: a.notes || ''
    });
    setEditingId(a.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await driverAdvanceService.delete(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: null });
      fetchAdvances();
    } catch (err) {
      console.error('Error deleting advance', err);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') await driverAdvanceService.approve(id, 'Approved by admin');
      if (action === 'reject') await driverAdvanceService.reject(id, 'Rejected by admin');
      fetchAdvances();
    } catch (err) {
      console.error(`Error ${action} advance`, err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'SUBMITTED': return 'info';
      case 'ISSUED': return 'primary';
      default: return 'default';
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ p: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0 }}>
        <PageHeader 
        subicon={<RequestQuote color="primary" sx={{ fontSize: 40 }}/>}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ driverId: '', vehicleId: '', amount: '', purpose: '', notes: '' }); setEditingId(null); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
              Record Advance
            </Button>
        }
      />
        
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, pb: 8 }}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={4} md={2}>
          <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Issued</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.main' }}>
              ₹{advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0).toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Outstanding</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: 'error.main' }}>
              ₹{advances.filter(a => a.status === 'ISSUED').reduce((acc, a) => acc + (Number(a.amount) || 0), 0).toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Returned</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
              ₹0
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Settled/Spent</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>
              ₹{advances.filter(a => a.status === 'SETTLED' || a.status === 'APPROVED').reduce((acc, a) => acc + (Number(a.amount) || 0), 0).toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Overdue</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: 'warning.main' }}>
              0
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Advances</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
              {advances.length}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 700 }}>Individual Driver Stats</Typography>
      <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 300, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Driver', 'Advances', 'Issued', 'Spent/Settled', 'Returned', 'Outstanding', 'Overdue'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(advances.reduce((acc, a) => {
                if (!acc[a.driverId]) {
                  acc[a.driverId] = { count: 0, issued: 0, spent: 0, returned: 0, outstanding: 0, overdue: 0 };
                }
                const amt = Number(a.amount) || 0;
                acc[a.driverId].count += 1;
                acc[a.driverId].issued += amt;
                if (a.status === 'SETTLED' || a.status === 'APPROVED') acc[a.driverId].spent += amt;
                else if (a.status === 'ISSUED') acc[a.driverId].outstanding += amt;
                return acc;
              }, {})).map(([driver, stats]) => (
                <TableRow key={driver} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{driver}</TableCell>
                  <TableCell>{stats.count}</TableCell>
                  <TableCell>₹{stats.issued.toLocaleString()}</TableCell>
                  <TableCell>₹{stats.spent.toLocaleString()}</TableCell>
                  <TableCell>₹{stats.returned.toLocaleString()}</TableCell>
                  <TableCell sx={{ color: stats.outstanding > 0 ? 'error.main' : 'inherit', fontWeight: stats.outstanding > 0 ? 'bold' : 'normal' }}>
                    ₹{stats.outstanding.toLocaleString()}
                  </TableCell>
                  <TableCell>{stats.overdue}</TableCell>
                </TableRow>
              ))}
              {advances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>No driver stats available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box sx={{ mt: 4, mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Advance Logs</Typography>
      </Box>

      <Card sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Driver ID', 'Vehicle ID', 'Amount', 'Purpose', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {advances.map((a, idx) => (
                <TableRow key={a.id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', fontWeight: 600 }}>{idx + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.driverId || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.vehicleId || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>₹{a.amount?.toLocaleString() || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.purpose || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Chip label={a.status || 'DRAFT'} size="small" color={getStatusColor(a.status)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <IconButton size="small"  onClick={() => handleEdit(a)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                      <Edit sx={{ fontSize: 17 }}  />
                    </IconButton>
                    <IconButton size="small"  onClick={() => setDeleteConfirm({ open: true, id: a.id })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                      <DeleteIcon sx={{ fontSize: 17 }}  />
                    </IconButton>
                    {(a.status === 'SUBMITTED' || a.status === 'DRAFT') && (
                      <>
                        <IconButton size="small"  onClick={() => handleAction(a.id, 'approve')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
                          <CheckCircle sx={{ fontSize: 17 }}  />
                        </IconButton>
                        <IconButton size="small"  onClick={() => handleAction(a.id, 'reject')} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                          <Cancel sx={{ fontSize: 17 }}  />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {advances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    No advances found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Card>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Advance' : 'Record Advance'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Driver ID" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Vehicle ID" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.driverId || !form.amount}>
            {saving ? 'Processing...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Advance"
        content="Are you sure you want to delete this advance?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



