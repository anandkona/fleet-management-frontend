import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, useTheme, Skeleton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { AccountBalanceWallet, TrendingUp, AccessTime } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { financeService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

function extractItems(res) {
  const raw = res?.data;
  if (!raw) return [];
  if (raw?.data?.items && Array.isArray(raw.data.items)) return raw.data.items;
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw)) return raw;
  return [];
}

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];

export default function AccountantDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pnl, setPnl] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [trRes, pyRes, pnlRes] = await Promise.allSettled([
        api.get('/finance/transactions', { params: { limit: 200 } }),
        api.get('/finance/payments', { params: { limit: 200 } }),
        api.get('/finance/pnl').catch(() => ({ data: {} })),
      ]);
      setTransactions(trRes.status === 'fulfilled' ? extractItems(trRes.value) : []);
      setPayments(pyRes.status === 'fulfilled' ? extractItems(pyRes.value) : []);
      const pnlData = pnlRes.status === 'fulfilled' ? (pnlRes.value?.data?.data ?? pnlRes.value?.data ?? {}) : {};
      setPnl(pnlData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';

  // ── Computed metrics (fully dynamic) ───────────────────────────────────────
  const totalRevenue = pnl.totalRevenue ?? pnl.revenue
    ?? transactions.filter(t => t.type === 'INCOME' || t.type === 'REVENUE').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpenses = pnl.totalExpenses ?? pnl.expenses
    ?? transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount || 0), 0);
  const profit = pnl.netProfit ?? (totalRevenue - totalExpenses);
  const pendingPayments = payments.filter(p =>
    ['PENDING', 'UNPAID', 'OVERDUE'].includes(p.status?.toUpperCase())
  ).reduce((s, p) => s + Number(p.amount || 0), 0);

  // ── Income vs Expense by date ──────────────────────────────────────────────
  const dateMap = {};
  transactions.forEach(t => {
    const label = new Date(t.date || t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dateMap[label]) dateMap[label] = { name: label, income: 0, expense: 0 };
    if (t.type === 'INCOME' || t.type === 'REVENUE') dateMap[label].income += Number(t.amount || 0);
    if (t.type === 'EXPENSE') dateMap[label].expense += Number(t.amount || 0);
  });
  const incVsExpData = Object.values(dateMap)
    .sort((a, b) => new Date(a.name) - new Date(b.name))
    .slice(-7);

  // ── Expense breakdown by category ──────────────────────────────────────────
  const catMap = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    const cat = t.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + Number(t.amount || 0);
  });
  const breakdownData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  const totalBreakdown = breakdownData.reduce((s, d) => s + d.value, 0);

  const recentExpenses = transactions.filter(t => t.type === 'EXPENSE').slice(0, 5);
  const recentIncome = transactions.filter(t => t.type === 'INCOME' || t.type === 'REVENUE').slice(0, 5);

  const MetricCard = ({ title, val, icon, color, bg }) => (
    <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: bg, color }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
          {loading ? <Skeleton width={80} height={28} /> :
            <Typography variant="h6" fontWeight="bold">{val}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Welcome back, {user?.firstName || 'Accountant'}!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Revenue" val={`₹ ${Number(totalRevenue).toLocaleString()}`} icon={<TrendingUp />} color="#4caf50" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Expenses" val={`₹ ${Number(totalExpenses).toLocaleString()}`} icon={<AccountBalanceWallet />} color="#f44336" bg="#ffebee" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Net Profit" val={`₹ ${Number(profit).toLocaleString()}`} icon={<TrendingUp />} color={profit >= 0 ? '#2e7d32' : '#d32f2f'} bg={profit >= 0 ? '#e8f5e9' : '#ffebee'} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Pending Payments" val={`₹ ${Number(pendingPayments).toLocaleString()}`} icon={<AccessTime />} color="#ed6c02" bg="#fff3e0" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Income vs Expense (by Date)</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} /> :
              incVsExpData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={incVsExpData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`₹ ${v.toLocaleString()}`, '']} />
                    <Bar dataKey="income" name="Income" fill="#4caf50" barSize={14} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#f44336" barSize={14} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No transaction data available</Typography>
                </Box>
              )}
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Expense Breakdown by Category</Typography>
            {loading ? <Skeleton variant="circular" width={150} height={150} sx={{ mx: 'auto' }} /> :
              breakdownData.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', height: 250 }}>
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie data={breakdownData} innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                        {breakdownData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`₹ ${v.toLocaleString()}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing={1}>
                      {breakdownData.map((d, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: d.color }} />
                            <Typography variant="caption">{d.name}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {totalBreakdown > 0 ? `${((d.value / totalBreakdown) * 100).toFixed(1)}%` : '0%'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No expense category data</Typography>
                </Box>
              )}
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Recent Expenses</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>) :
                    recentExpenses.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>{new Date(t.date || t.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{t.category || '—'}</TableCell>
                        <TableCell>{t.description || t.notes || '—'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Number(t.amount).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  {!loading && recentExpenses.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No recent expenses</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Recent Income</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount (₹)</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>) :
                    recentIncome.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>{new Date(t.date || t.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{t.description || t.notes || t.category || '—'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Number(t.amount).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip label={t.status || 'Received'} size="small" color="success" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && recentIncome.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No recent income records</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
