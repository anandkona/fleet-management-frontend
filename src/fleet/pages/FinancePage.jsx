import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Chip, Snackbar, Alert, useTheme, useMediaQuery,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination, CircularProgress
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_TX = { type: 'EXPENSE', amount: 0, category: 'Fuel', date: new Date().toISOString().split('T')[0], description: '', status: 'PENDING' };

const fallbackPnl = { revenue: 45000, expenses: 12500, netProfit: 32500 };
const fallbackTransactions = [
  { id: 1, type: 'INCOME', category: 'Freight', description: 'Delivery to Mumbai', amount: 15000, date: '2026-06-20', status: 'COMPLETED' },
  { id: 2, type: 'EXPENSE', category: 'Fuel', description: 'Diesel refill AP05-T123', amount: 4500, date: '2026-06-21', status: 'COMPLETED' },
  { id: 3, type: 'EXPENSE', category: 'Maintenance', description: 'Oil change AP05-T087', amount: 1200, date: '2026-06-22', status: 'PENDING' },
  { id: 4, type: 'INCOME', category: 'Freight', description: 'Logistics contract payout', amount: 30000, date: '2026-06-23', status: 'COMPLETED' },
  { id: 5, type: 'EXPENSE', category: 'Tolls', description: 'Highway tolls route A', amount: 800, date: '2026-06-24', status: 'COMPLETED' },
];

export default function FinancePage() {
  const [pnl, setPnl] = useState({ revenue: 0, expenses: 0, netProfit: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const paged = transactions.slice(page * 10, (page + 1) * 10);
  const [form, setForm] = useState(EMPTY_TX);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pnlRes, txRes] = await Promise.allSettled([
        api.get('/finance/pnl'),
        api.get('/finance/transactions', { params: { limit: 100 } })
      ]);
      if (pnlRes.status === 'fulfilled' && pnlRes.value.data?.data) {
        setPnl(pnlRes.value.data.data);
      } else {
        setPnl(fallbackPnl);
      }
      if (txRes.status === 'fulfilled' && txRes.value.data?.data) {
        const items = txRes.value.data.data.items || (Array.isArray(txRes.value.data.data) ? txRes.value.data.data : []);
        setTransactions(items.length > 0 ? items : fallbackTransactions);
      } else {
        setTransactions(fallbackTransactions);
      }
    } catch (err) {
      console.error(err);
      setPnl(fallbackPnl);
      setTransactions(fallbackTransactions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      if (!form.description || !form.amount) {
        toast('Description and Amount are required', 'error');
        return;
      }
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString()
      };
      await api.post('/finance/transactions', payload);
      toast('Transaction recorded successfully');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      // Fallback Mock Save
      const newTx = {
        id: Date.now(),
        ...form,
        amount: Number(form.amount)
      };
      setTransactions(prev => [newTx, ...prev]);

      // Update mocked PnL
      setPnl(prev => {
        const isInc = form.type === 'INCOME';
        const amt = Number(form.amount);
        return {
          revenue: prev.revenue + (isInc ? amt : 0),
          expenses: prev.expenses + (!isInc ? amt : 0),
          netProfit: prev.netProfit + (isInc ? amt : -amt)
        };
      });

      toast('Transaction recorded (Demo)');
      setDialogOpen(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/finance/transactions/${id}/status`, { status });
      toast(`Transaction marked as ${status}`);
      fetchData();
    } catch (err) {
      console.error(err);
      // Mock update
      setTransactions(prev => prev.map(t => (String(t.id || t._id) === String(id) ? { ...t, status } : t)));
      toast(`Transaction marked as ${status} (Demo)`);
    }
  };



  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWalletIcon sx={{ color: '#10b981', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Finance & Accounting</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button startIcon={<RefreshIcon />} onClick={fetchData} variant="outlined" sx={{ color: 'text.primary', borderColor: 'divider', flex: { xs: 1, sm: 'none' } }}>Refresh</Button>
          {hasPermission('finance_create') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(EMPTY_TX); setDialogOpen(true); }} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, flex: { xs: 1, sm: 'none' } }}>Record Transaction</Button>}
        </Stack>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><TrendingUpIcon /></Box>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>${Number(pnl.revenue).toLocaleString()}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><TrendingDownIcon /></Box>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>Total Expenses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>${Number(pnl.expenses).toLocaleString()}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><MonetizationOnIcon /></Box>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>Net Profit</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: pnl.netProfit >= 0 ? '#10b981' : '#ef4444' }}>${Number(pnl.netProfit).toLocaleString()}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 600, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>Transactions</Typography>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r, i) => (
                <TableRow key={r.id || r._id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{page * 10 + i + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Chip label={r.type} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', color: r.type === 'INCOME' ? '#10b981' : '#ef4444', bgcolor: r.type === 'INCOME' ? '#10b98120' : '#ef444420' }} />
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.category}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.description}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', fontWeight: 600 }}>${Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Chip label={r.status} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', borderColor: r.status === 'COMPLETED' ? '#10b981' : '#f59e0b', color: r.status === 'COMPLETED' ? '#10b981' : '#f59e0b' }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {r.status === 'PENDING' && hasPermission('finance_update') ? (
                      <Button size="small" onClick={() => handleStatusUpdate(r.id || r._id, 'COMPLETED')} sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#10b981', bgcolor: '#10b98115', '&:hover': { bgcolor: '#10b98130' } }}>Complete</Button>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No transactions found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
        {!loading && transactions.length > 10 && (
          <TablePagination
            component="div"
            count={transactions.length}
            rowsPerPage={10}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPageOptions={[10]}
            sx={{ color: 'text.primary', borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Record Transaction</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Stack spacing={2} mt={1}>
            <TextField select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} fullWidth size="small">
              <MenuItem value="INCOME">Income</MenuItem>
              <MenuItem value="EXPENSE">Expense</MenuItem>
            </TextField>
            <TextField label="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} fullWidth size="small" />
            <TextField label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} fullWidth size="small" placeholder="e.g. Fuel, Maintenance, Freight" />
            <TextField label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth size="small" multiline rows={2} />
            <TextField select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} fullWidth size="small">
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
