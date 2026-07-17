import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, TableContainer, Typography, Chip, useTheme, Card, CircularProgress,
  Grid
} from '@mui/material';
import { Add, Payment, Payments } from '@mui/icons-material';
import { financeService } from '../../services/api';
import { PageHeader } from '../components/Common';

const paymentModes = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER'];

const emptyForm = {
  amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMode: 'BANK_TRANSFER',
  transactionId: '',
  tripBillingId: '',
  accountId: '',
  vendorId: '',
  customerId: '',
  referenceNumber: '',
  notes: ''
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const theme = useTheme();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.getPayments({ limit: 100 });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching payments', err);
      setPayments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSave = async () => {
    if (!form.amount || !form.paymentDate) return;
    setSaving(true);
    try {
      await financeService.createPayment({
        ...form,
        amount: Number(form.amount)
      });
      setDialogOpen(false);
      fetchPayments();
    } catch (err) {
      console.error('Error saving payment', err);
    }
    setSaving(false);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<Payments color="primary" sx={{ fontSize: 40 }}/>}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
            Record Payment
          </Button>
        }
      />
      

      <Card sx={{ mt: 3, mb: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Date', 'Amount', 'Mode', 'Reference', 'Linked Entities', 'Notes'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600, color: theme.palette.primary.main }}>₹{p.amount?.toLocaleString()}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={p.paymentMode?.replace('_', ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{p.referenceNumber || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {p.transactionId && <Chip label={`TXN: ${p.transactionId.substring(0,6)}`} size="small" color="default" />}
                      {p.tripBillingId && <Chip label={`INV: ${p.tripBillingId.substring(0,6)}`} size="small" color="primary" />}
                      {p.vendorId && <Chip label={`VEN: ${p.vendorId.substring(0,6)}`} size="small" color="secondary" />}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{p.notes || '-'}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment Closure</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Payment Date" InputLabelProps={{ shrink: true }} value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Payment Mode" value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                {paymentModes.map(m => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Reference Number" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Link Payment To (Optional)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Transaction ID" value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Trip Billing ID" value={form.tripBillingId} onChange={(e) => setForm({ ...form, tripBillingId: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Vendor ID" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.amount}>
            {saving ? 'Processing...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



