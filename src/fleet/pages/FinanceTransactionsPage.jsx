import { ReceiptLong } from '@mui/icons-material';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, TableContainer, Typography, Chip, useTheme, Card, CircularProgress,
  Grid, Stack
} from '@mui/material';
import { Add, Edit, Delete as DeleteIcon, AccountBalance } from '@mui/icons-material';
import { financeService } from '../../services/api';
import { PageHeader, ConfirmDialog } from '../components/Common';

const transactionTypes = ['INCOME', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT'];
const sourceModules = ['TRIP', 'FUEL', 'EXPENSE', 'MAINTENANCE', 'REPAIR', 'COMPLIANCE', 'DRIVER', 'MANUAL'];
const paymentModes = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER'];

const emptyForm = {
  transactionType: 'EXPENSE',
  sourceModule: 'MANUAL',
  amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  paymentMode: 'BANK_TRANSFER',
  description: '',
  referenceNumber: ''
};

export default function FinanceTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.getTransactions({ limit: 100 });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching transactions', err);
      setTransactions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSave = async () => {
    if (!form.amount || !form.transactionDate) return;
    setSaving(true);
    try {
      const payload = {
        transactionType: form.transactionType,
        sourceModule: form.sourceModule,
        amount: Number(form.amount),
        transactionDate: form.transactionDate,
        paymentMode: form.paymentMode,
        description: form.description,
        referenceNumber: form.referenceNumber
      };
      await financeService.createTransaction(payload);
      setDialogOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error('Error saving transaction', err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await financeService.deleteTransaction(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: null });
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction', err);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'INCOME': return 'success';
      case 'EXPENSE': return 'error';
      case 'TRANSFER': return 'info';
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
          subicon={<ReceiptLong color="primary" sx={{ fontSize: 40 }} />}
          action={
            <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
              New Transaction
            </Button>
          }
        />

      </Box>

      <Card sx={{ mt: 1, mb: 2, borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' } }}>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Payment </TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell>{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', color: getTypeColor(tx.transactionType) === 'success' ? '#10b981' : (getTypeColor(tx.transactionType) === 'error' ? '#ef4444' : 'text.primary') }}>
                      {tx.transactionType}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>₹{tx.amount?.toLocaleString()}</TableCell>
                  <TableCell>{tx.sourceModule}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
                      {tx.paymentMode?.replace('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell>{tx.description || tx.referenceNumber || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small"  onClick={() => setDeleteConfirm({ open: true, id: tx.id })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                      <DeleteIcon sx={{ fontSize: 17 }}  />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Transaction</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Type" value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })}>
                {transactionTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Source Module" value={form.sourceModule} onChange={(e) => setForm({ ...form, sourceModule: e.target.value })}>
                {sourceModules.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} />
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
              <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.amount}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Transaction"
        content="Are you sure you want to delete this transaction? This action cannot be undone and may affect PnL."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



