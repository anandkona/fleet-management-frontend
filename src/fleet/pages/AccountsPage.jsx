import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, CircularProgress,
  useTheme, Tooltip
} from '@mui/material';
import { Add, Edit, Delete as DeleteIcon, AccountBalance } from '@mui/icons-material';
import api from '../../services/api';
import { PageHeader, ConfirmDialog } from '../components/Common';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (amount) => {
  const n = Number(amount ?? 0);
  return isNaN(n) ? '₹0' : `₹${n.toLocaleString('en-IN')}`;
};

const StatusChip = ({ value }) => {
  const colorMap = {
    ACTIVE: { color: '#3b82f6', bg: '#3b82f620' },
    INACTIVE: { color: '#94a3b8', bg: '#94a3b820' },
  };
  const c = colorMap[value] || { color: '#94a3b8', bg: '#94a3b820' };
  return <Chip label={value || '—'} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', color: c.color, bgcolor: c.bg }} />;
};

const EMPTY_ACCOUNT = { name: '', type: 'BANK', accountNumberMasked: '', bankName: '', openingBalance: '', status: 'ACTIVE' };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();
  const { hasPermission } = useAuth();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/accounts', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching accounts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSaveAccount = async () => {
    if (!accountForm.name) return;
    try {
      const payload = { ...accountForm, openingBalance: Number(accountForm.openingBalance) || 0 };
      if (accountForm.id) {
        await api.put(`/finance/accounts/${accountForm.id}`, payload);
      } else {
        await api.post('/finance/accounts', payload);
      }
      setDialogOpen(false);
      fetchAccounts();
    } catch (err) {
      console.error('Error saving account', err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete(`/finance/accounts/${deleteConfirm.id}`);
      setDeleteConfirm({ open: false, id: null });
      fetchAccounts();
    } catch (err) {
      console.error('Error deleting account', err);
    }
  };

  const handleEdit = (r) => {
    setAccountForm({ ...r });
    setDialogOpen(true);
  };

  if (loading && accounts.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  );

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<AccountBalance color="primary" sx={{ fontSize: 40 }}/>}
        action={
          hasPermission('finance_create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setAccountForm(EMPTY_ACCOUNT); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
              Add Account
            </Button>
          )
        }
      />
      

      <Card sx={{ mt: 3, mb: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['#', 'Account Name', 'Type', 'Bank', 'Current Balance', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((r, i) => (
                <TableRow key={r.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{r.name || r.accountName || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{r.type || r.accountType || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{r.bankName || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>{fmt(r.balance ?? r.currentBalance ?? r.openingBalance)}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><StatusChip value={r.status} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit Account">
                        <IconButton size="small" onClick={() => handleEdit(r)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                          <Edit sx={{ fontSize: 17 }}   />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Account">
                        <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: r.id })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                          <DeleteIcon sx={{ fontSize: 17 }}   />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No accounts found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{accountForm.id ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Account Name" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} fullWidth size="small" required />
            <TextField select label="Type" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })} fullWidth size="small">
              <MenuItem value="BANK">Bank</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="WALLET">Wallet</MenuItem>
              <MenuItem value="CREDIT">Credit</MenuItem>
            </TextField>
            <TextField label="Bank Name" value={accountForm.bankName} onChange={e => setAccountForm({ ...accountForm, bankName: e.target.value })} fullWidth size="small" />
            <TextField label="Account Number (Masked)" value={accountForm.accountNumberMasked} onChange={e => setAccountForm({ ...accountForm, accountNumberMasked: e.target.value })} fullWidth size="small" />
            <TextField label="Opening Balance" type="number" value={accountForm.openingBalance} onChange={e => setAccountForm({ ...accountForm, openingBalance: e.target.value })} fullWidth size="small" />
            <TextField select label="Status" value={accountForm.status || 'ACTIVE'} onChange={e => setAccountForm({ ...accountForm, status: e.target.value })} fullWidth size="small">
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAccount} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
            {accountForm.id ? 'Update Account' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Account"
        content="Are you sure you want to delete this account?"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



