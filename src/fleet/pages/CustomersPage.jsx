import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, CircularProgress,
  useTheme
} from '@mui/material';
import { Add, EditOutlined, DeleteOutline, People } from '@mui/icons-material';
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

const EMPTY_CUSTOMER = { name: '', phone: '', email: '', gstin: '', billingAddress: '', shippingAddress: '', customerCode: '', legalName: '', tradeName: '', customerType: 'B2B', pan: '', state: '', stateCode: '', pincode: '', contactPersonName: '', contactPersonPhone: '', paymentTermsDays: 0, creditLimit: 0, isGstRegistered: false, status: 'ACTIVE' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();
  const { hasPermission } = useAuth();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/customers', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSaveCustomer = async () => {
    if (!customerForm.name) return;
    try {
      if (customerForm.id) {
        await api.put(`/finance/customers/${customerForm.id}`, customerForm);
      } else {
        await api.post('/finance/customers', customerForm);
      }
      setDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer', err);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      await api.delete(`/finance/customers/${deleteConfirm.id}`);
      setDeleteConfirm({ open: false, id: null });
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer', err);
    }
  };

  const handleEdit = (r) => {
    setCustomerForm({ ...r });
    setDialogOpen(true);
  };

  if (loading && customers.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  );

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<People color="primary" sx={{ fontSize: 40 }}/>}
        action={
          hasPermission('finance_create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setCustomerForm(EMPTY_CUSTOMER); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
              Add Customer
            </Button>
          )
        }
      />
      

      <Card sx={{ mt: 3, mb: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['#', 'Customer Name', 'Email', 'Phone', 'GSTIN', 'Outstanding', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((r, i) => (
                <TableRow key={r.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{r.name || r.companyName || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{r.email || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{r.phone || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{r.gstin || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>{fmt(r.outstandingAmount ?? r.outstanding ?? r.balance)}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><StatusChip value={r.status} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handleEdit(r)}>
                        <EditOutlined fontSize="small" sx={{ color: '#06b6d4' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: r.id })}>
                        <DeleteOutline fontSize="small" sx={{ color: '#ef4444' }} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No customers found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{customerForm.id ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Customer Name" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} fullWidth size="small" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Customer Type" value={customerForm.customerType} onChange={e => setCustomerForm({ ...customerForm, customerType: e.target.value })} fullWidth size="small">
                <MenuItem value="B2B">B2B</MenuItem>
                <MenuItem value="B2C">B2C</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="GSTIN" value={customerForm.gstin} onChange={e => setCustomerForm({ ...customerForm, gstin: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="PAN" value={customerForm.pan} onChange={e => setCustomerForm({ ...customerForm, pan: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Credit Limit" type="number" value={customerForm.creditLimit} onChange={e => setCustomerForm({ ...customerForm, creditLimit: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Payment Terms (Days)" type="number" value={customerForm.paymentTermsDays} onChange={e => setCustomerForm({ ...customerForm, paymentTermsDays: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Billing Address" multiline rows={2} value={customerForm.billingAddress} onChange={e => setCustomerForm({ ...customerForm, billingAddress: e.target.value })} fullWidth size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCustomer} sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}>
            {customerForm.id ? 'Update Customer' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Customer"
        content="Are you sure you want to delete this customer?"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



