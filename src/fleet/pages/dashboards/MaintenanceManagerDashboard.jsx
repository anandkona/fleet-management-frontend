import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Chip
} from '@mui/material';
import { DirectionsCar, Build, CheckCircle, WarningAmber } from '@mui/icons-material';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../../services/api';
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

export default function MaintenanceManagerDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [maintenance, setMaintenance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, inv] = await Promise.allSettled([
        api.get('/maintenance', { params: { limit: 200 } }),
        api.get('/inventory', { params: { limit: 200 } }),
      ]);
      setMaintenance(m.status === 'fulfilled' ? extractItems(m.value) : []);
      setInventory(inv.status === 'fulfilled' ? extractItems(inv.value) : []);
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

  // ── Computed metrics ────────────────────────────────────────────────────────
  const awaiting = maintenance.filter(m => m.status?.toUpperCase() === 'PENDING').length;
  const inProgress = maintenance.filter(m => m.status?.toUpperCase() === 'IN_PROGRESS').length;
  const completed = maintenance.filter(m => m.status?.toUpperCase() === 'COMPLETED').length;
  const overdue = maintenance.filter(m => {
    if (m.status?.toUpperCase() === 'COMPLETED') return false;
    const due = new Date(m.scheduledDate || m.requestDate || m.date);
    return due < new Date();
  }).length;

  const totalMaintCost = maintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

  // ── Pie data ───────────────────────────────────────────────────────────────
  const pieData = [
    { name: 'Completed', value: completed, color: '#4CAF50' },
    { name: 'In Progress', value: inProgress, color: '#2196F3' },
    { name: 'Pending', value: awaiting, color: '#FF9800' },
    { name: 'Overdue', value: overdue, color: '#F44336' },
  ].filter(p => p.value > 0);

  // ── Cost trend: group by date ──────────────────────────────────────────────
  const costMap = {};
  maintenance.forEach(m => {
    const d = new Date(m.completedDate || m.scheduledDate || m.createdAt);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    costMap[label] = (costMap[label] || 0) + (Number(m.cost) || 0);
  });
  const costData = Object.entries(costMap)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-7)
    .map(([name, cost]) => ({ name, cost }));

  // ── Low stock inventory ────────────────────────────────────────────────────
  const lowStockItems = inventory
    .filter(i => Number(i.quantity) <= (Number(i.reorderLevel) || 10))
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  // ── Upcoming services (pending, sorted by date) ────────────────────────────
  const upcomingServices = maintenance
    .filter(m => m.status?.toUpperCase() === 'PENDING')
    .sort((a, b) => new Date(a.scheduledDate || a.createdAt) - new Date(b.scheduledDate || b.createdAt));

  const MetricCard = ({ title, val, icon, color, bg }) => (
    <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: bg, color }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
          {loading ? <Skeleton width={50} height={28} /> :
            <Typography variant="h6" fontWeight="bold">{val}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Welcome back, {user?.firstName || 'Maintenance Manager'}!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Awaiting Service" val={awaiting} icon={<DirectionsCar />} color="#1976d2" bg="#e3f2fd" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="In Progress" val={inProgress} icon={<Build />} color="#2e7d32" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Completed" val={completed} icon={<CheckCircle />} color="#4caf50" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Overdue" val={overdue} icon={<WarningAmber />} color="#d32f2f" bg="#ffebee" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Service Status</Typography>
            {loading ? <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto' }} /> :
              pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No maintenance data</Typography>
                </Box>
              )}
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Maintenance Cost Trend</Typography>
              {!loading && <Typography variant="h6" fontWeight="bold">₹ {totalMaintCost.toLocaleString()}</Typography>}
            </Box>
            {loading ? <Skeleton variant="rectangular" height={250} /> :
              costData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`₹ ${v.toLocaleString()}`, 'Cost']} />
                    <Line type="monotone" dataKey="cost" stroke="#2196f3" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                  <Typography color="text.secondary">No cost data available</Typography>
                </Box>
              )}
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Upcoming Services</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle No.</TableCell>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Scheduled Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>) :
                    upcomingServices.slice(0, 5).map(m => (
                      <TableRow key={m.id}>
                        <TableCell>{m.vehicle?.vehicleNumber || m.vehicleId || '—'}</TableCell>
                        <TableCell>{m.serviceType || m.type || '—'}</TableCell>
                        <TableCell>{new Date(m.scheduledDate || m.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip label={m.status} size="small" color="warning" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && upcomingServices.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No upcoming services</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Low Stock Spare Parts</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Reorder At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>) :
                    lowStockItems.slice(0, 5).map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>{item.quantity}</TableCell>
                        <TableCell align="right">{item.reorderLevel || 10}</TableCell>
                      </TableRow>
                    ))}
                  {!loading && lowStockItems.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center">All stock levels OK</TableCell></TableRow>
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
