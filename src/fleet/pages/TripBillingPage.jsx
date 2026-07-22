import { LocalShipping } from '@mui/icons-material';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  TableContainer, Typography, Chip, useTheme, Card, CircularProgress,
  Grid
} from '@mui/material';
import { Add, Edit, Delete as DeleteIcon, Receipt } from '@mui/icons-material';
import { financeService } from '../../services/api';
import { PageHeader, ConfirmDialog } from '../components/Common';

const emptyForm = {
  tripId: '',
  customerId: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  billingAmount: '',
  taxAmount: '0',
  discountAmount: '0',
  dueDate: '',
  notes: ''
};

export default function TripBillingPage() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.getTripBillings({ limit: 100 });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setBillings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching trip billings', err);
      setBillings([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const handleSave = async () => {
    if (!form.tripId || !form.invoiceDate) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        billingAmount: Number(form.billingAmount),
        taxAmount: Number(form.taxAmount || 0),
        discountAmount: Number(form.discountAmount || 0)
      };

      if (editingId) {
        await financeService.updateTripBilling(editingId, payload);
      } else {
        await financeService.createTripBilling(payload);
      }
      setDialogOpen(false);
      fetchBillings();
    } catch (err) {
      console.error('Error saving trip billing', err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await financeService.deleteTripBilling(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: null });
      fetchBillings();
    } catch (err) {
      console.error('Error deleting trip billing', err);
    }
  };

  const handleEdit = (b) => {
    setForm({
      tripId: b.tripId || '',
      customerId: b.customerId || '',
      invoiceNumber: b.invoiceNumber || '',
      invoiceDate: b.invoiceDate ? new Date(b.invoiceDate).toISOString().split('T')[0] : '',
      billingAmount: b.billingAmount || '',
      taxAmount: b.taxAmount || '0',
      discountAmount: b.discountAmount || '0',
      dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : '',
      notes: b.notes || ''
    });
    setEditingId(b.id);
    setDialogOpen(true);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<LocalShipping color="primary" sx={{ fontSize: 40 }}/>}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
          Generate Invoice
        </Button>
        }
      />
      

      <Card sx={{ mt: 3, mb: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.No', 'Invoice ID', 'Date', 'Trip ID', 'Customer', 'Amount', 'Status / POD Chain', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {billings.map((b, index) => {
                const total = Number(b.billingAmount || 0) + Number(b.taxAmount || 0) - Number(b.discountAmount || 0);
                return (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{index + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{b.invoiceNumber || 'DRAFT'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{new Date(b.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.85rem' }}>
                        {`TRIP-${b.tripId?.substring(0, 6).toUpperCase()}`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{b.customerId || '-'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>₹{total.toLocaleString()}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Chip label={b.paymentStatus || 'PENDING'} size="small" color={b.paymentStatus === 'PAID' ? 'success' : 'warning'} sx={{ fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }} align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <IconButton size="small" onClick={() => handleEdit(b)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                          <Edit sx={{ fontSize: 17 }}   />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: b.id })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                          <DeleteIcon sx={{ fontSize: 17 }}   />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {billings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No trip billings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Invoice' : 'Generate Invoice'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Trip ID" value={form.tripId} onChange={(e) => setForm({ ...form, tripId: e.target.value })} helperText="Required for linking POD Chain" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Invoice Number" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Invoice Date" InputLabelProps={{ shrink: true }} value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Base Amount" value={form.billingAmount} onChange={(e) => setForm({ ...form, billingAmount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Tax Amount" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Discount" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Internal Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.tripId || !form.invoiceDate}>
            {saving ? 'Saving...' : 'Save Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Trip Invoice"
        content="Are you sure you want to delete this invoice? This will remove billing details for the associated trip."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



