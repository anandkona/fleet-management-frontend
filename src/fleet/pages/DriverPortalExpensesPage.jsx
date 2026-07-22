import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box,
  TableContainer, Chip, useTheme, Card, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, MenuItem, Typography, IconButton
} from '@mui/material';
import { Receipt, Add, CloudUpload, Visibility } from '@mui/icons-material';
import { PageHeader } from '../components/Common';
import api, { driverPortalService } from '../../services/api';

const EXPENSE_CATEGORIES = ['Tolls', 'Food & Meals', 'Lodging', 'Maintenance', 'Supplies', 'Fines', 'Other'];

export default function DriverPortalExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', amount: '', notes: '', category: '', receiptNumber: '', receiptFile: null });
  const [vehicles, setVehicles] = useState([]);
  const theme = useTheme();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/me/driver-expenses', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching driver expenses', err);
      setExpenses([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
    driverPortalService.getVehicles()
      .then(res => {
        const vData = res.data?.data?.vehicles || res.data?.data?.items || res.data?.data || [];
        setVehicles(Array.isArray(vData) ? vData : []);
      })
      .catch(err => console.error('Failed to fetch vehicles', err));
  }, [fetchExpenses]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'SUBMITTED': return 'info';
      case 'PENDING': return 'warning';
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
      // Note: Backend currently requires JSON. If backend gets updated to multipart/form-data, 
      // we can switch this to a FormData payload.
      await api.post('/me/driver-expenses', {
        vehicleId: form.vehicleId,
        amount: Number(form.amount),
        category: form.category,
        notes: form.notes,
        receiptNumber: form.receiptNumber || undefined,
        // receiptFile: form.receiptFile (Ready for backend integration)
      });
      setRequestDialog(false);
      setForm({ vehicleId: '', amount: '', notes: '', category: '', receiptNumber: '', receiptFile: null });
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert('Failed to submit expense');
    }
  };

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<Receipt color="primary" sx={{ fontSize: 40 }}/>}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setRequestDialog(true)} sx={{ borderRadius: 2, px: 3, py: 1 }}>
            Submit Expense
          </Button>
        }
      />

      <Card sx={{ mt: 3, borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Date', 'Category', 'Description', 'Amount', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((exp, idx) => (
                <TableRow key={exp.id || idx} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{idx + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>
                    {exp.expenseDate || exp.createdAt ? new Date(exp.expenseDate || exp.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {exp.category?.name || exp.categoryId || exp.category || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {exp.description || exp.notes || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600, color: 'primary.main' }}>
                    ₹{exp.amount ? Number(exp.amount).toLocaleString() : '0'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={exp.status || 'DRAFT'} size="small" color={getStatusColor(exp.status)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <IconButton size="small"  onClick={() => { setSelectedExpense(exp); setViewDialog(true);}} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }} >
<Visibility sx={{ fontSize: 17 }}    />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No expenses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Expense</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Vehicle *" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                {vehicles.map((v) => <MenuItem key={v.id || v._id} value={v.id || v._id}>{v.registrationNumber || v.vehicleNumber || v.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Amount (₹)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button component="label" variant="outlined" startIcon={<CloudUpload />} fullWidth sx={{ py: 1.5, borderStyle: 'dashed' }}>
                {form.receiptFile ? form.receiptFile.name : 'Upload Receipt Image / Document (Optional)'}
                <input type="file" hidden onChange={(e) => setForm({ ...form, receiptFile: e.target.files[0] })} accept="image/*,.pdf" />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRequestSubmit} disabled={!form.vehicleId || !form.amount || !form.category}>
            Submit Expense
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent dividers>
          {selectedExpense && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedExpense.expenseDate || selectedExpense.createdAt ? new Date(selectedExpense.expenseDate || selectedExpense.createdAt).toLocaleDateString() : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight={500} color="primary.main">₹{selectedExpense.amount ? Number(selectedExpense.amount).toLocaleString() : '0'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedExpense.category?.name || selectedExpense.categoryId || selectedExpense.category || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box mt={0.5}><Chip label={selectedExpense.status || 'DRAFT'} size="small" color={getStatusColor(selectedExpense.status)} sx={{ fontWeight: 'bold' }} /></Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedExpense.vehicle?.vehicleNumber || selectedExpense.vehicleId || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Notes / Description</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedExpense.description || selectedExpense.notes || '-'}</Typography>
              </Grid>
              {(selectedExpense.receiptUrl || selectedExpense.receipt) && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Receipt Document</Typography>
                  <Box mt={1}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Receipt />} 
                      onClick={() => window.open(selectedExpense.receiptUrl || selectedExpense.receipt, '_blank')}
                    >
                      View Uploaded Receipt
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}