import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  TextField, Button, useTheme, Chip, Stack
} from '@mui/material';
import {
  TrendingUp, TrendingDown, MonetizationOn, Payments, Business, People,
  AccountBalanceWallet, Add
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api, { financeService } from '../../services/api';
import { PageHeader } from '../components/Common';

export default function FinancePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [pnl, setPnl] = useState({});
  const [transactions, setTransactions] = useState([]);

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Expenses data for chart
  const [expenses, setExpenses] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [repairs, setRepairs] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pnlParams = {};
      if (fromDate) pnlParams.startDate = fromDate;
      if (toDate) pnlParams.endDate = toDate;

      const [sumRes, pnlRes, txRes, expRes, fuelRes, maintRes, repRes] = await Promise.allSettled([
        api.get('/finance/dashboard-summary'),
        api.get('/finance/pnl', { params: pnlParams }),
        financeService.getTransactions({ limit: 5 }),
        api.get('/expenses', { params: { limit: 100 } }),
        api.get('/fuel', { params: { limit: 100 } }),
        api.get('/maintenance', { params: { limit: 100 } }),
        api.get('/repairs', { params: { limit: 100 } })
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data?.data || {});
      if (pnlRes.status === 'fulfilled') setPnl(pnlRes.value.data?.data || {});

      let gotTx = [];
      if (txRes.status === 'fulfilled') {
        gotTx = txRes.value.data?.data?.items || txRes.value.data?.data || [];
        if (!Array.isArray(gotTx)) gotTx = [];
      }
      setTransactions(gotTx.slice(0, 5));

      const extract = (res) => res.status === 'fulfilled' ? (res.value.data?.data?.items || res.value.data?.data || []) : [];
      setExpenses(extract(expRes));
      setFuel(extract(fuelRes));
      setMaintenance(extract(maintRes));
      setRepairs(extract(repRes));

    } catch (error) {
      console.error('Error fetching finance dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatAmount = (amt) => {
    const num = Number(amt) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getSum = (arr, field = 'amount') => arr.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);

  const rawExp = getSum(expenses);
  const rawFuel = getSum(fuel, 'totalCost');
  const rawMaint = getSum(maintenance, 'cost');
  const rawRepairs = getSum(repairs, 'cost');

  const chartData = [
    { name: 'Expenses', value: rawExp, color: '#f59e0b' },
    { name: 'Fuel', value: rawFuel, color: '#3b82f6' },
    { name: 'Maintenance', value: rawMaint, color: '#10b981' },
    { name: 'Repairs', value: rawRepairs, color: '#ef4444' },
    { name: 'Trip Billing', value: 0, color: '#8b5cf6' } // Typically income, but based on prompt
  ];

  const pnlTableData = [
    { category: 'Trip Billing', type: 'EXPENSE', total: 0 },
    { category: 'Fuel', type: 'EXPENSE', total: rawFuel },
    { category: 'Expenses', type: 'EXPENSE', total: rawExp },
    { category: 'Maintenance', type: 'EXPENSE', total: rawMaint },
    { category: 'Repairs', type: 'EXPENSE', total: rawRepairs }
  ];

  const kpiCards = [
    { label: 'Total Revenue', value: formatAmount(pnl.totalRevenue || summary.totalRevenue || 0), icon: <TrendingUp />, color: '#10b981' },
    { label: 'Total Expenses', value: formatAmount(pnl.totalExpenses || summary.totalExpenses || 0), icon: <TrendingDown />, color: '#ef4444' },
    { label: 'Net Profit', value: formatAmount(pnl.netProfit || summary.netProfit || 0), icon: <MonetizationOn />, color: (pnl.netProfit || 0) >= 0 ? '#3b82f6' : '#ef4444' },
    { label: 'Pending Payments', value: formatAmount(summary.pendingPayments || 0), icon: <Payments />, color: '#f59e0b' },
    { label: 'Total Vendors', value: summary.totalVendors || 0, icon: <Business />, color: '#8b5cf6' },
    { label: 'Total Customers', value: summary.totalCustomers || 0, icon: <People />, color: '#06b6d4' },
  ];

  if (loading && Object.keys(summary).length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0 }}>
        <PageHeader 
        subicon={<AccountBalanceWallet color="primary" sx={{ fontSize: 40 }}/>}
        />
              </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, pb: 8 }}>
        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiCards.map((c, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid', borderColor: 'divider',
              display: 'flex', alignItems: 'center', p: 2
            }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${c.color}20`, color: c.color, mr: 2, display: 'flex' }}>
                {c.icon}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{c.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{c.value}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
        </Grid>

        <Grid container spacing={4}>
          {/* Expense Breakdown Chart */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Expense Breakdown</Typography>
                <Typography variant="body2" color="text.secondary">By category</Typography>
              </Box>
              <Box sx={{ pt: 1, px: 3, pb: 3, height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} angle={-25} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip
                      cursor={{ fill: theme.palette.action.hover }}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          {/* Profit & Loss Table */}
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Profit & Loss</Typography>
                  <Typography variant="body2" color="text.secondary">Overall financial performance</Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    type="date"
                    label="Date From"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <TextField
                    type="date"
                    label="Date To"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </Stack>
              </Box>

              <Box sx={{ p: 2, display: 'flex', gap: 4, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Income</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="#10b981">{formatAmount(pnl.totalRevenue || 0)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Expenses</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="#ef4444">{formatAmount(pnl.totalExpenses || 0)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Net Profit</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color={(pnl.netProfit || 0) >= 0 ? '#3b82f6' : '#ef4444'}>
                    {formatAmount(pnl.netProfit || 0)}
                  </Typography>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: 220, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pnlTableData.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>
                          <Chip label={row.type} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', bgcolor: '#fee2e2', borderRadius: 1 }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(row.total)}</TableCell>
                      </TableRow>
                    ))}
                    {pnlTableData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data available for selected dates</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Transactions</Typography>
                <Typography variant="body2" color="text.secondary">Last 5 transactions</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Transaction#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Vendor/Customer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((t, idx) => (
                      <TableRow key={t.id || idx} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{t.transactionNumber || t.id}</TableCell>
                        <TableCell>
                          <Chip label={t.transactionType || t.type} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, borderRadius: 1, color: t.transactionType === 'INCOME' ? '#10b981' : (t.transactionType === 'EXPENSE' ? '#ef4444' : '#3b82f6'), bgcolor: t.transactionType === 'INCOME' ? '#d1fae5' : (t.transactionType === 'EXPENSE' ? '#fee2e2' : '#dbeafe') }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatAmount(t.amount)}</TableCell>
                        <TableCell>
                          <Chip label={t.status || 'PAID'} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700, borderRadius: 1 }} />
                        </TableCell>
                        <TableCell>{fmtDate(t.transactionDate || t.date)}</TableCell>
                        <TableCell>{t.vendor?.name || t.customer?.name || t.vendorId || t.customerId || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No recent transactions found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
