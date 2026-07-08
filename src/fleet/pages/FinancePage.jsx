import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Chip,
  Snackbar, Alert, useTheme, useMediaQuery, Tab, Tabs,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination, CircularProgress,
  Checkbox, FormControlLabel
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddIcon from '@mui/icons-material/Add';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const fmt = (amount) => {
  const n = Number(amount ?? 0);
  return isNaN(n) ? '₹0' : `₹${n.toLocaleString('en-IN')}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const StatusChip = ({ value }) => {
  const colorMap = {
    COMPLETED: { color: '#10b981', bg: '#10b98120' },
    APPROVED: { color: '#10b981', bg: '#10b98120' },
    PAID: { color: '#10b981', bg: '#10b98120' },
    ACTIVE: { color: '#3b82f6', bg: '#3b82f620' },
    PENDING: { color: '#f59e0b', bg: '#f59e0b20' },
    PARTIAL: { color: '#f59e0b', bg: '#f59e0b20' },
    DRAFT: { color: '#94a3b8', bg: '#94a3b820' },
    CANCELLED: { color: '#ef4444', bg: '#ef444420' },
    REJECTED: { color: '#ef4444', bg: '#ef444420' },
    OVERDUE: { color: '#ef4444', bg: '#ef444420' },
  };
  const c = colorMap[value] || { color: '#94a3b8', bg: '#94a3b820' };
  return <Chip label={value || '—'} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', color: c.color, bgcolor: c.bg }} />;
};

const EMPTY_TX = { transactionType: 'EXPENSE', sourceModule: 'MANUAL', amount: '', taxAmount: '', transactionDate: new Date().toISOString().split('T')[0], paymentMode: 'BANK_TRANSFER', categoryId: '', accountId: '', vendorId: '', customerId: '', referenceNumber: '', description: '' };
const EMPTY_VENDOR = { name: '', vendorType: 'GENERAL', phone: '', email: '', gstin: '', address: '', vendorCode: '', legalName: '', tradeName: '', pan: '', state: '', stateCode: '', pincode: '', contactPersonName: '', contactPersonPhone: '', paymentTermsDays: 0, bankAccountMasked: '', ifscCode: '', upiId: '' };
const EMPTY_ACCOUNT = { name: '', type: 'BANK', accountNumberMasked: '', bankName: '', openingBalance: '', status: 'ACTIVE' };
const EMPTY_CUSTOMER = { name: '', phone: '', email: '', gstin: '', billingAddress: '', shippingAddress: '', customerCode: '', legalName: '', tradeName: '', customerType: 'B2B', pan: '', state: '', stateCode: '', pincode: '', contactPersonName: '', contactPersonPhone: '', paymentTermsDays: 0, creditLimit: 0, isGstRegistered: false };
const EMPTY_CATEGORY = { name: '', type: 'EXPENSE', module: 'GENERAL' };
const EMPTY_BILLING = { tripId: '', invoiceDate: new Date().toISOString().split('T')[0], customerId: '', invoiceNumber: '', billingAmount: '', taxAmount: '', discountAmount: '', dueDate: '', notes: '' };
const EMPTY_PAYMENT = { amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'BANK_TRANSFER', accountId: '', vendorId: '', customerId: '', referenceNumber: '', notes: '' };

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ mt: 2 }}>{children}</Box> : null;
}

const TABLE_CELL_SX = { borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'text.primary' };
const TH_SX = { fontWeight: 700, color: '#fff', fontSize: '0.82rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' };

function GenericTable({ headers, rows, renderRow, loading, page, onPageChange, total }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>{headers.map(h => <TableCell key={h} sx={TH_SX}>{h}</TableCell>)}</TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => renderRow(r, i))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={headers.length} align="center" sx={{ py: 6, color: 'text.secondary' }}>No records found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
      {!loading && total > 10 && (
        <TablePagination component="div" count={total} rowsPerPage={10} page={page}
          onPageChange={(e, p) => onPageChange(p)} rowsPerPageOptions={[10]}
          sx={{ color: 'text.primary', borderTop: '1px solid', borderColor: 'divider' }} />
      )}
    </Box>
  );
}

export default function FinancePage() {
  const [tab, setTab] = useState(0);
  const [pnl, setPnl] = useState({ revenue: 0, expenses: 0, netProfit: 0 });
  const [dashSummary, setDashSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tripBillings, setTripBillings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txPage, setTxPage] = useState(0);
  const [vendorPage, setVendorPage] = useState(0);
  const [customerPage, setCustomerPage] = useState(0);
  const [billingPage, setBillingPage] = useState(0);
  const [paymentPage, setPaymentPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_TX);
  const [vendorForm, setVendorForm] = useState(EMPTY_VENDOR);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT);
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [billingForm, setBillingForm] = useState(EMPTY_BILLING);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pnlRes, dashRes, txRes, vendorRes, customerRes, accountRes, billingRes, paymentRes, catRes] = await Promise.allSettled([
        api.get('/finance/pnl'),
        api.get('/finance/dashboard-summary'),
        api.get('/finance/transactions', { params: { limit: 100 } }),
        api.get('/finance/vendors', { params: { limit: 100 } }),
        api.get('/finance/customers', { params: { limit: 100 } }),
        api.get('/finance/accounts', { params: { limit: 100 } }),
        api.get('/finance/trip-billings', { params: { limit: 100 } }),
        api.get('/finance/payments', { params: { limit: 100 } }),
        api.get('/finance/categories', { params: { limit: 100 } }),
      ]);

      if (pnlRes.status === 'fulfilled' && pnlRes.value.data?.data) setPnl(pnlRes.value.data.data);
      if (dashRes.status === 'fulfilled' && dashRes.value.data?.data) setDashSummary(dashRes.value.data.data);

      const extract = (res) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value.data?.data;
        return d?.items ?? (Array.isArray(d) ? d : []);
      };

      setTransactions(extract(txRes));
      setVendors(extract(vendorRes));
      setCustomers(extract(customerRes));
      setAccounts(extract(accountRes));
      setTripBillings(extract(billingRes));
      setPayments(extract(paymentRes));
      setCategories(extract(catRes));
    } catch (err) {
      console.error('Finance fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveTx = async () => {
    if (!form.amount) { toast('Amount is required', 'error'); return; }
    try {
      const payload = { ...form, amount: Number(form.amount), transactionDate: new Date(form.transactionDate).toISOString() };
      await api.post('/finance/transactions', payload);
      toast('Transaction recorded');
      setDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast('Failed to record transaction', 'error');
    }
  };

  const handleSaveVendor = async () => {
    if (!vendorForm.name) { toast('Vendor name is required', 'error'); return; }
    try {
      if (vendorForm.id) {
        await api.put(`/finance/vendors/${vendorForm.id}`, vendorForm);
        toast('Vendor updated');
      } else {
        await api.post('/finance/vendors', vendorForm);
        toast('Vendor created');
      }
      setVendorDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast('Failed to save vendor', 'error');
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await api.delete(`/finance/vendors/${id}`);
      toast('Vendor deleted');
      fetchAll();
    } catch (err) {
      toast('Failed to delete vendor', 'error');
    }
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name) { toast('Account name is required', 'error'); return; }
    try {
      const payload = { ...accountForm, openingBalance: Number(accountForm.openingBalance) || 0 };
      if (accountForm.id) {
        await api.put(`/finance/accounts/${accountForm.id}`, payload);
        toast('Account updated');
      } else {
        await api.post('/finance/accounts', payload);
        toast('Account created');
      }
      setAccountDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast('Failed to save account', 'error');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api.delete(`/finance/accounts/${id}`);
      toast('Account deleted');
      fetchAll();
    } catch (err) {
      toast('Failed to delete account', 'error');
    }
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name) { toast('Customer name is required', 'error'); return; }
    try {
      if (customerForm.id) {
        await api.put(`/finance/customers/${customerForm.id}`, customerForm);
        toast('Customer updated');
      } else {
        await api.post('/finance/customers', customerForm);
        toast('Customer created');
      }
      setCustomerDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast('Failed to save customer', 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/finance/customers/${id}`);
      toast('Customer deleted');
      fetchAll();
    } catch (err) {
      toast('Failed to delete customer', 'error');
    }
  };

  const handleSaveBilling = async () => {
    if (!billingForm.tripId || !billingForm.invoiceDate) { toast('Trip ID and Invoice Date required', 'error'); return; }
    try {
      const payload = { ...billingForm, billingAmount: Number(billingForm.billingAmount)||0, invoiceDate: new Date(billingForm.invoiceDate).toISOString(), dueDate: billingForm.dueDate ? new Date(billingForm.dueDate).toISOString() : undefined };
      await api.post('/finance/trip-billings', payload);
      toast('Trip billing created');
      setBillingDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast('Failed to create billing', 'error');
    }
  };

  const handleSavePayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentDate) { toast('Amount and Date required', 'error'); return; }
    try {
      const payload = { ...paymentForm, amount: Number(paymentForm.amount), paymentDate: new Date(paymentForm.paymentDate).toISOString() };
      await api.post('/finance/payments', payload);
      toast('Payment created');
      setPaymentDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast('Failed to create payment', 'error');
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) { toast('Category name is required', 'error'); return; }
    try {
      await api.post('/finance/categories', categoryForm);
      toast('Category created');
      setCategoryDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast('Failed to create category', 'error');
    }
  };

  const pagedTx = transactions.slice(txPage * 10, (txPage + 1) * 10);
  const pagedVendors = vendors.slice(vendorPage * 10, (vendorPage + 1) * 10);
  const pagedCustomers = customers.slice(customerPage * 10, (customerPage + 1) * 10);
  const pagedBillings = tripBillings.slice(billingPage * 10, (billingPage + 1) * 10);
  const pagedPayments = payments.slice(paymentPage * 10, (paymentPage + 1) * 10);

  const summaryCards = [
    { label: 'Total Revenue', value: fmt(pnl.totalRevenue ?? pnl.revenue ?? dashSummary.totalRevenue ?? 0), icon: <TrendingUpIcon />, color: '#10b981' },
    { label: 'Total Expenses', value: fmt(pnl.totalExpenses ?? pnl.expenses ?? dashSummary.totalExpenses ?? 0), icon: <TrendingDownIcon />, color: '#ef4444' },
    { label: 'Net Profit', value: fmt(pnl.netProfit ?? dashSummary.netProfit ?? 0), icon: <MonetizationOnIcon />, color: (pnl.netProfit ?? 0) >= 0 ? '#3b82f6' : '#ef4444' },
    { label: 'Pending Payments', value: fmt(dashSummary.pendingPayments ?? 0), icon: <PaymentsIcon />, color: '#f59e0b' },
    { label: 'Total Vendors', value: vendors.length || (dashSummary.totalVendors ?? 0), icon: <BusinessIcon />, color: '#8b5cf6', isCnt: true },
    { label: 'Total Customers', value: customers.length || (dashSummary.totalCustomers ?? 0), icon: <PeopleIcon />, color: '#06b6d4', isCnt: true },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          {tab === 0 && hasPermission('finance_create') && (isMobile ? (
            <Button variant="contained" onClick={() => { setForm(EMPTY_TX); setDialogOpen(true); }} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}><AddIcon /></Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(EMPTY_TX); setDialogOpen(true); }} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>Record Transaction</Button>
          ))}
          {tab === 1 && hasPermission('finance_create') && (isMobile ? (
            <Button variant="contained" onClick={() => { setAccountForm(EMPTY_ACCOUNT); setAccountDialogOpen(true); }} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}><AddIcon /></Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setAccountForm(EMPTY_ACCOUNT); setAccountDialogOpen(true); }} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Add Account</Button>
          ))}
          {tab === 2 && hasPermission('finance_create') && (isMobile ? (
            <Button variant="contained" onClick={() => { setVendorForm(EMPTY_VENDOR); setVendorDialogOpen(true); }} sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}><AddIcon /></Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setVendorForm(EMPTY_VENDOR); setVendorDialogOpen(true); }} sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>Add Vendor</Button>
          ))}
          {tab === 3 && hasPermission('finance_create') && (isMobile ? (
            <Button variant="contained" onClick={() => { setCustomerForm(EMPTY_CUSTOMER); setCustomerDialogOpen(true); }} sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' }, minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}><AddIcon /></Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCustomerForm(EMPTY_CUSTOMER); setCustomerDialogOpen(true); }} sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}>Add Customer</Button>
          ))}
          {tab === 4 && hasPermission('finance_create') && (isMobile ? (
            <Button variant="contained" onClick={() => { setBillingForm(EMPTY_BILLING); setBillingDialogOpen(true); }} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}><AddIcon /></Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setBillingForm(EMPTY_BILLING); setBillingDialogOpen(true); }} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>Add Billing</Button>
          ))}
          {tab === 5 && hasPermission('finance_create') && (isMobile ? (
            <Button variant="contained" onClick={() => { setPaymentForm(EMPTY_PAYMENT); setPaymentDialogOpen(true); }} sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' }, minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}><AddIcon /></Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setPaymentForm(EMPTY_PAYMENT); setPaymentDialogOpen(true); }} sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}>Record Payment</Button>
          ))}
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        {summaryCards.map((c) => (
          <Grid item xs={12} sm={6} md={4} key={c.label}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: `${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>{c.icon}</Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.72rem' }}>{c.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.25, color: c.isCnt ? 'text.primary' : c.label === 'Net Profit' && (pnl.netProfit ?? 0) < 0 ? '#ef4444' : 'text.primary' }}>
                  {c.isCnt ? c.value : c.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2 }}>
            <Tab icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Transactions" />
            <Tab icon={<AccountBalanceIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Accounts" />
            <Tab icon={<BusinessIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Vendors" />
            <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Customers" />
            <Tab icon={<LocalShippingIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Trip Billings" />
            <Tab icon={<PaymentsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Payments" />
            <Tab icon={<FactCheckIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="POD & Billing" />
          </Tabs>
        </Box>

        {/* Transactions Tab */}
        <TabPanel value={tab} index={0}>
          <GenericTable
            headers={['#', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Status']}
            rows={pagedTx}
            loading={loading}
            page={txPage}
            onPageChange={setTxPage}
            total={transactions.length}
            renderRow={(r, i) => (
              <TableRow key={r.id || i} hover>
                <TableCell sx={TABLE_CELL_SX}>{txPage * 10 + i + 1}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{fmtDate(r.transactionDate || r.date)}</TableCell>
                <TableCell sx={TABLE_CELL_SX}><Chip label={r.transactionType || r.type} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', color: (r.transactionType || r.type) === 'INCOME' ? '#10b981' : '#ef4444', bgcolor: (r.transactionType || r.type) === 'INCOME' ? '#10b98120' : '#ef444420' }} /></TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.category?.name || r.category || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.description || '—'}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 700, color: (r.transactionType || r.type) === 'INCOME' ? '#10b981' : '#ef4444' }}>{fmt(r.amount)}</TableCell>
                <TableCell sx={TABLE_CELL_SX}><StatusChip value={r.status} /></TableCell>
              </TableRow>
            )}
          />
        </TabPanel>

        {/* Accounts Tab */}
        <TabPanel value={tab} index={1}>
          <GenericTable
            headers={['#', 'Account Name', 'Type', 'Bank', 'Current Balance', 'Status', 'Actions']}
            rows={accounts.slice(0, 50)}
            loading={loading}
            page={0}
            onPageChange={() => {}}
            total={accounts.length}
            renderRow={(r, i) => (
              <TableRow key={r.id || i} hover>
                <TableCell sx={TABLE_CELL_SX}>{i + 1}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 600 }}>{r.name || r.accountName || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.type || r.accountType || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.bankName || '—'}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 700 }}>{fmt(r.balance ?? r.currentBalance ?? r.openingBalance)}</TableCell>
                <TableCell sx={TABLE_CELL_SX}><StatusChip value={r.status} /></TableCell>
                <TableCell sx={TABLE_CELL_SX}>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => { setAccountForm({ ...r }); setAccountDialogOpen(true); }}>
                      <EditOutlinedIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteAccount(r.id)}>
                      <DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          />
        </TabPanel>

        {/* Vendors Tab */}
        <TabPanel value={tab} index={2}>
          <GenericTable
            headers={['#', 'Vendor Name', 'Type', 'Email', 'Phone', 'GSTIN', 'Status', 'Actions']}
            rows={pagedVendors}
            loading={loading}
            page={vendorPage}
            onPageChange={setVendorPage}
            total={vendors.length}
            renderRow={(r, i) => (
              <TableRow key={r.id || i} hover>
                <TableCell sx={TABLE_CELL_SX}>{vendorPage * 10 + i + 1}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 600 }}>{r.name || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.vendorType || r.type || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.email || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.phone || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.gstin || r.gstNumber || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}><StatusChip value={r.status} /></TableCell>
                <TableCell sx={TABLE_CELL_SX}>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => { setVendorForm({ ...r }); setVendorDialogOpen(true); }}>
                      <EditOutlinedIcon fontSize="small" sx={{ color: '#8b5cf6' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteVendor(r.id)}>
                      <DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          />
        </TabPanel>

        {/* Customers Tab */}
        <TabPanel value={tab} index={3}>
          <GenericTable
            headers={['#', 'Customer Name', 'Email', 'Phone', 'GSTIN', 'Outstanding', 'Status', 'Actions']}
            rows={pagedCustomers}
            loading={loading}
            page={customerPage}
            onPageChange={setCustomerPage}
            total={customers.length}
            renderRow={(r, i) => (
              <TableRow key={r.id || i} hover>
                <TableCell sx={TABLE_CELL_SX}>{customerPage * 10 + i + 1}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 600 }}>{r.name || r.companyName || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.email || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.phone || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.gstin || '—'}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 700 }}>{fmt(r.outstandingAmount ?? r.outstanding ?? r.balance)}</TableCell>
                <TableCell sx={TABLE_CELL_SX}><StatusChip value={r.status} /></TableCell>
                <TableCell sx={TABLE_CELL_SX}>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => { setCustomerForm({ ...r }); setCustomerDialogOpen(true); }}>
                      <EditOutlinedIcon fontSize="small" sx={{ color: '#06b6d4' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteCustomer(r.id)}>
                      <DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
          />
        </TabPanel>

        {/* Trip Billings Tab */}
        <TabPanel value={tab} index={4}>
          <GenericTable
            headers={['#', 'Trip / Invoice', 'Customer', 'Amount', 'Paid', 'Balance', 'Due Date', 'Status']}
            rows={pagedBillings}
            loading={loading}
            page={billingPage}
            onPageChange={setBillingPage}
            total={tripBillings.length}
            renderRow={(r, i) => (
              <TableRow key={r.id || i} hover>
                <TableCell sx={TABLE_CELL_SX}>{billingPage * 10 + i + 1}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 600 }}>{r.invoiceNumber || r.tripId || r.id}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.customer?.name || r.customerName || '—'}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 700 }}>{fmt(r.totalAmount ?? r.amount)}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, color: '#10b981' }}>{fmt(r.paidAmount ?? r.paid)}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, color: '#ef4444' }}>{fmt(r.balanceAmount ?? r.balance)}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{fmtDate(r.dueDate)}</TableCell>
                <TableCell sx={TABLE_CELL_SX}><StatusChip value={r.status} /></TableCell>
              </TableRow>
            )}
          />
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value={tab} index={5}>
          <GenericTable
            headers={['#', 'Date', 'Reference', 'Vendor / Customer', 'Method', 'Amount', 'Status']}
            rows={pagedPayments}
            loading={loading}
            page={paymentPage}
            onPageChange={setPaymentPage}
            total={payments.length}
            renderRow={(r, i) => (
              <TableRow key={r.id || i} hover>
                <TableCell sx={TABLE_CELL_SX}>{paymentPage * 10 + i + 1}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{fmtDate(r.paymentDate || r.date)}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 600 }}>{r.referenceNumber || r.reference || r.id}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.vendor?.name || r.customer?.name || r.vendorName || r.customerName || '—'}</TableCell>
                <TableCell sx={TABLE_CELL_SX}>{r.paymentMethod || r.method || '—'}</TableCell>
                <TableCell sx={{ ...TABLE_CELL_SX, fontWeight: 700 }}>{fmt(r.amount)}</TableCell>
                <TableCell sx={TABLE_CELL_SX}><StatusChip value={r.status} /></TableCell>
              </TableRow>
            )}
          />
        </TabPanel>

        {/* POD & Billing Tab */}
        <TabPanel value={tab} index={6}>
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f3e8ff', color: '#9333ea', display: 'flex' }}>
              <FactCheckIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>POD & Billing Chain</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Verify delivery proof, auto-create billing drafts, and complete finance approval.</Typography>
            </Box>
          </Box>
          <Grid container spacing={3} mb={4}>
            {[{label:'PODs pending',val:0,col:'#f59e0b', bg:'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'},{label:'PODs verified',val:3,col:'#10b981', bg:'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'},{label:'Billing approvals',val:0,col:'#3b82f6', bg:'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'},{label:'PODs rejected',val:1,col:'#ef4444', bg:'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'}].map(c => (
              <Grid item xs={12} sm={6} md={3} key={c.label}>
                <Card sx={{ p: 3, background: c.bg, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                  <Typography variant="h3" sx={{ fontWeight: 800, color: c.col, mb: 0.5 }}>{c.val}</Typography>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600, opacity: 0.8 }}>{c.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><FactCheckIcon sx={{ color: '#f59e0b', fontSize: 20 }}/> POD Verification Queue</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Driver delivery proofs waiting for admin/manager verification.</Typography>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <TextField label="Rate/km for auto billing" placeholder="Example: 50" size="small" fullWidth />
                  <TextField label="Verification notes" placeholder="Optional notes" size="small" fullWidth multiline rows={2} />
                </Box>
                <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', bgcolor: '#fafafa' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <FactCheckIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>No POD pending</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Completed trip POD uploads will appear here.</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><ReceiptLongIcon sx={{ color: '#3b82f6', fontSize: 20 }}/> Finance Approval Queue</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Billing drafts created after POD verification.</Typography>
                </Box>
                <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', bgcolor: '#fafafa' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <ReceiptLongIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>No billing pending</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Verified PODs will auto-create billing drafts here.</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><FactCheckIcon sx={{ color: '#10b981', fontSize: 20 }}/> Verified / Rejected History</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Recent POD decisions for audit and follow-up.</Typography>
                </Box>
                <Box sx={{ p: 2, flex: 1, bgcolor: '#ffffff' }}>
                  <Stack spacing={2}>
                    {[{s:'VERIFIED',t:'TR-MR92BV3D-9M30',m:'POD verified',c:'#10b981',bg:'#d1fae5'},{s:'VERIFIED',t:'TR-MR26AIJL-YFP3',m:'Verified for billing rejection test',c:'#10b981',bg:'#d1fae5'},{s:'VERIFIED',t:'TR-MR5Y26ZD-S51J',m:'POD verified - good delivery proof',c:'#10b981',bg:'#d1fae5'},{s:'REJECTED',t:'TR-MR26AIJL-YFP3',m:'POD image is blurry and illegible',c:'#ef4444',bg:'#fee2e2'}].map((h,i) => (
                      <Box key={i} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{h.t}</Typography>
                          <Chip label={h.s} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, color: h.c, bgcolor: h.bg, borderRadius: 1 }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>{h.m}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Record Transaction Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Record Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField select label="Transaction Type" value={form.transactionType} onChange={e => setForm({ ...form, transactionType: e.target.value })} fullWidth size="small">
                <MenuItem value="INCOME">Income</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
                <MenuItem value="TRANSFER">Transfer</MenuItem>
                <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Source Module" value={form.sourceModule} onChange={e => setForm({ ...form, sourceModule: e.target.value })} fullWidth size="small">
                <MenuItem value="MANUAL">Manual</MenuItem>
                <MenuItem value="TRIP">Trip</MenuItem>
                <MenuItem value="FUEL">Fuel</MenuItem>
                <MenuItem value="EXPENSE">Expense</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="REPAIR">Repair</MenuItem>
                <MenuItem value="COMPLIANCE">Compliance</MenuItem>
                <MenuItem value="DRIVER">Driver</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Vendor ID" value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Customer ID" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Account" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} fullWidth size="small">
                <MenuItem value="">Select Account</MenuItem>
                {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Category ID" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} fullWidth size="small" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Tax Amount" type="number" value={form.taxAmount} onChange={e => setForm({ ...form, taxAmount: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Transaction Date" type="date" value={form.transactionDate} onChange={e => setForm({ ...form, transactionDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Payment Mode" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })} fullWidth size="small">
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Reference Number" value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTx} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={vendorDialogOpen} onClose={() => setVendorDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>{vendorForm.id ? 'EditOutlined Vendor' : 'New Vendor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Name" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} fullWidth size="small" required />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select label="Vendor Type" value={vendorForm.vendorType} onChange={e => setVendorForm({ ...vendorForm, vendorType: e.target.value })} fullWidth size="small">
                <MenuItem value="GENERAL">General</MenuItem>
                <MenuItem value="FUEL_STATION">Fuel Station</MenuItem>
                <MenuItem value="WORKSHOP">Workshop</MenuItem>
                <MenuItem value="INSURANCE">Insurance</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Phone" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Email" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="GSTIN" value={vendorForm.gstin} onChange={e => setVendorForm({ ...vendorForm, gstin: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Vendor Code" value={vendorForm.vendorCode} onChange={e => setVendorForm({ ...vendorForm, vendorCode: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Legal Name" value={vendorForm.legalName} onChange={e => setVendorForm({ ...vendorForm, legalName: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Trade Name" value={vendorForm.tradeName} onChange={e => setVendorForm({ ...vendorForm, tradeName: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="PAN" value={vendorForm.pan} onChange={e => setVendorForm({ ...vendorForm, pan: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="State" value={vendorForm.state} onChange={e => setVendorForm({ ...vendorForm, state: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="State Code" value={vendorForm.stateCode} onChange={e => setVendorForm({ ...vendorForm, stateCode: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Pincode" value={vendorForm.pincode} onChange={e => setVendorForm({ ...vendorForm, pincode: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Contact Person Name" value={vendorForm.contactPersonName} onChange={e => setVendorForm({ ...vendorForm, contactPersonName: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Contact Person Phone" value={vendorForm.contactPersonPhone} onChange={e => setVendorForm({ ...vendorForm, contactPersonPhone: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Payment Terms (Days)" type="number" value={vendorForm.paymentTermsDays} onChange={e => setVendorForm({ ...vendorForm, paymentTermsDays: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Bank Account (Masked)" value={vendorForm.bankAccountMasked} onChange={e => setVendorForm({ ...vendorForm, bankAccountMasked: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="IFSC Code" value={vendorForm.ifscCode} onChange={e => setVendorForm({ ...vendorForm, ifscCode: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="UPI ID" value={vendorForm.upiId} onChange={e => setVendorForm({ ...vendorForm, upiId: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} fullWidth size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVendorDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVendor} sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
            {vendorForm.id ? 'Update Vendor' : 'Save Vendor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Account Dialog */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>{accountForm.id ? 'EditOutlined Account' : 'New Account'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
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
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAccount} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
            {accountForm.id ? 'Update Account' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={customerDialogOpen} onClose={() => setCustomerDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>{customerForm.id ? 'EditOutlined Customer' : 'New Customer'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Name" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} fullWidth size="small" required />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select label="Customer Type" value={customerForm.customerType} onChange={e => setCustomerForm({ ...customerForm, customerType: e.target.value })} fullWidth size="small">
                <MenuItem value="B2B">B2B</MenuItem>
                <MenuItem value="B2C">B2C</MenuItem>
                <MenuItem value="INDIVIDUAL">Individual</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Phone" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="GSTIN" value={customerForm.gstin} onChange={e => setCustomerForm({ ...customerForm, gstin: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Customer Code" value={customerForm.customerCode} onChange={e => setCustomerForm({ ...customerForm, customerCode: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Legal Name" value={customerForm.legalName} onChange={e => setCustomerForm({ ...customerForm, legalName: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Trade Name" value={customerForm.tradeName} onChange={e => setCustomerForm({ ...customerForm, tradeName: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="PAN" value={customerForm.pan} onChange={e => setCustomerForm({ ...customerForm, pan: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="State" value={customerForm.state} onChange={e => setCustomerForm({ ...customerForm, state: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="State Code" value={customerForm.stateCode} onChange={e => setCustomerForm({ ...customerForm, stateCode: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Pincode" value={customerForm.pincode} onChange={e => setCustomerForm({ ...customerForm, pincode: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Contact Person Name" value={customerForm.contactPersonName} onChange={e => setCustomerForm({ ...customerForm, contactPersonName: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Contact Person Phone" value={customerForm.contactPersonPhone} onChange={e => setCustomerForm({ ...customerForm, contactPersonPhone: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Payment Terms (Days)" type="number" value={customerForm.paymentTermsDays} onChange={e => setCustomerForm({ ...customerForm, paymentTermsDays: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Credit Limit" type="number" value={customerForm.creditLimit} onChange={e => setCustomerForm({ ...customerForm, creditLimit: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6} md={4} display="flex" alignItems="center">
              <FormControlLabel control={<Checkbox checked={customerForm.isGstRegistered || false} onChange={e => setCustomerForm({ ...customerForm, isGstRegistered: e.target.checked })} />} label="GST Registered" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Billing Address" value={customerForm.billingAddress} onChange={e => setCustomerForm({ ...customerForm, billingAddress: e.target.value })} fullWidth size="small" multiline rows={2} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Shipping Address" value={customerForm.shippingAddress} onChange={e => setCustomerForm({ ...customerForm, shippingAddress: e.target.value })} fullWidth size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCustomer} sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}>
            {customerForm.id ? 'Update Customer' : 'Save Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Billing Dialog */}
      <Dialog open={billingDialogOpen} onClose={() => setBillingDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Add Trip Billing</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Trip ID" value={billingForm.tripId} onChange={e => setBillingForm({ ...billingForm, tripId: e.target.value })} fullWidth size="small" required />
            <TextField label="Invoice Date" type="date" value={billingForm.invoiceDate} onChange={e => setBillingForm({ ...billingForm, invoiceDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} required />
            <TextField select label="Customer" value={billingForm.customerId} onChange={e => setBillingForm({ ...billingForm, customerId: e.target.value })} fullWidth size="small">
              <MenuItem value="">Select Customer</MenuItem>
              {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Billing Amount" type="number" value={billingForm.billingAmount} onChange={e => setBillingForm({ ...billingForm, billingAmount: e.target.value })} fullWidth size="small" />
            <TextField label="Due Date" type="date" value={billingForm.dueDate} onChange={e => setBillingForm({ ...billingForm, dueDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={billingForm.notes} onChange={e => setBillingForm({ ...billingForm, notes: e.target.value })} fullWidth size="small" multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBillingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBilling} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Amount" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} fullWidth size="small" required />
            <TextField label="Payment Date" type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} required />
            <TextField select label="Payment Mode" value={paymentForm.paymentMode} onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })} fullWidth size="small">
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="CARD">Card</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
            </TextField>
            <TextField select label="Account" value={paymentForm.accountId} onChange={e => setPaymentForm({ ...paymentForm, accountId: e.target.value })} fullWidth size="small">
              <MenuItem value="">Select Account</MenuItem>
              {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </TextField>
            <TextField select label="Vendor" value={paymentForm.vendorId} onChange={e => setPaymentForm({ ...paymentForm, vendorId: e.target.value })} fullWidth size="small">
              <MenuItem value="">Select Vendor</MenuItem>
              {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
            </TextField>
            <TextField label="Reference Number" value={paymentForm.referenceNumber} onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePayment} sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
