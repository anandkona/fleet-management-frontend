import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, useTheme, Skeleton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { People, VerifiedUser, Business, Badge } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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

const ROLE_COLORS = ['#1976d2', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#795548'];

export default function HrManagerDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [usersList, setUsersList] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.allSettled([
        api.get('/users', { params: { limit: 200 } }),
        api.get('/drivers', { params: { limit: 200 } }),
      ]);
      setUsersList(uRes.status === 'fulfilled' ? extractItems(uRes.value) : []);
      setDrivers(dRes.status === 'fulfilled' ? extractItems(dRes.value) : []);
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
  const totalUsers = usersList.length;
  const activeUsers = usersList.filter(u => u.status?.toUpperCase() !== 'INACTIVE' && u.status?.toUpperCase() !== 'DISABLED').length;

  // Unique branches from users
  const branchSet = new Set(usersList.map(u => u.branch?.name || u.branchId).filter(Boolean));
  const totalBranches = branchSet.size;

  // Drivers with license expiry within 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringDrivers = drivers.filter(d => {
    if (!d.licenseExpiryDate) return false;
    const expiry = new Date(d.licenseExpiryDate);
    return expiry >= now && expiry <= thirtyDaysFromNow;
  });

  // ── Users by role pie ──────────────────────────────────────────────────────
  const roleCounts = {};
  usersList.forEach(u => {
    const role = u.role?.name || u.role?.key || u.role || 'Unknown';
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });
  const pieData = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: ROLE_COLORS[i % ROLE_COLORS.length] }));

  // ── Recent users (newest first) ────────────────────────────────────────────
  const recentUsers = [...usersList]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

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
        Welcome back, {user?.firstName || 'HR Manager'}!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Users" val={totalUsers} icon={<People />} color="#1976d2" bg="#e3f2fd" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Active Users" val={activeUsers} icon={<VerifiedUser />} color="#4caf50" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Branch Offices" val={totalBranches || '—'} icon={<Business />} color="#ff9800" bg="#fff3e0" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Licenses Expiring (30d)" val={expiringDrivers.length} icon={<Badge />} color="#d32f2f" bg="#ffebee" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Users by Role</Typography>
            {loading ? <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto' }} /> :
              pieData.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', height: 250 }}>
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing={1}>
                      {pieData.map((d, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: d.color }} />
                            <Typography variant="caption">{d.name}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">{d.value}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No user data</Typography>
                </Box>
              )}
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2, overflow: 'auto' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Recently Added Users</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>) :
                    recentUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>{u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.name || '—'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role?.name || u.role || '—'}</TableCell>
                        <TableCell align="right" sx={{ color: u.status?.toUpperCase() === 'INACTIVE' ? '#f44336' : '#4caf50', fontWeight: 'bold' }}>
                          {u.status || 'Active'}
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && usersList.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No users found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" mb={2}>
          Driver License Expiry (Next 30 Days) — {expiringDrivers.length} driver(s)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Driver Name</TableCell>
                <TableCell>License No.</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell align="right">Days Left</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>) :
                expiringDrivers.slice(0, 8).map(d => {
                  const expiry = new Date(d.licenseExpiryDate);
                  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                  return (
                    <TableRow key={d.id}>
                      <TableCell>{d.firstName ? `${d.firstName} ${d.lastName || ''}`.trim() : d.name || '—'}</TableCell>
                      <TableCell>{d.licenseNumber || '—'}</TableCell>
                      <TableCell>{expiry.toLocaleDateString()}</TableCell>
                      <TableCell align="right" sx={{ color: daysLeft <= 7 ? '#d32f2f' : '#ed6c02', fontWeight: 'bold' }}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {!loading && expiringDrivers.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">No licenses expiring in the next 30 days</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
