import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Skeleton, Chip
} from '@mui/material';
import { LocalShipping, Person, Assignment, Build } from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
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

export default function FleetManagerDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [v, d, t, m, f] = await Promise.allSettled([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/trips'),
        api.get('/maintenance'),
        api.get('/fuel'),
      ]);
      setVehicles(v.status === 'fulfilled' ? extractItems(v.value) : []);
      setDrivers(d.status === 'fulfilled' ? extractItems(d.value) : []);
      setTrips(t.status === 'fulfilled' ? extractItems(t.value) : []);
      setMaintenance(m.status === 'fulfilled' ? extractItems(m.value) : []);
      setFuel(f.status === 'fulfilled' ? extractItems(f.value) : []);
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
  const mutedText = theme.palette.text.secondary;

  // ── Computed metrics ────────────────────────────────────────────────────────
  const myVehicles = vehicles.length;
  const driversOnDuty = drivers.filter(d =>
    ['ACTIVE', 'ON_TRIP', 'ASSIGNED'].includes(d.status?.toUpperCase())
  ).length;
  const activeTrips = trips.filter(t =>
    ['IN_PROGRESS', 'ACTIVE', 'ON_TRIP', 'STARTED'].includes(t.status?.toUpperCase())
  ).length;
  const maintDue = maintenance.filter(m => m.status?.toUpperCase() === 'PENDING').length;

  // ── Trip summary: last 6 unique calendar days with trips ────────────────────
  const tripDateMap = {};
  trips.forEach(t => {
    const d = new Date(t.startTime || t.createdAt);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    tripDateMap[label] = (tripDateMap[label] || 0) + 1;
  });
  const tripSummaryData = Object.entries(tripDateMap)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-7)
    .map(([name, trips]) => ({ name, trips }));

  // ── Fuel consumption: last 7 days ──────────────────────────────────────────
  const fuelDateMap = {};
  fuel.forEach(f => {
    const d = new Date(f.date || f.createdAt);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    fuelDateMap[label] = (fuelDateMap[label] || 0) + (Number(f.quantityLiters) || 0);
  });
  const fuelData = Object.entries(fuelDateMap)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-7)
    .map(([name, fuel]) => ({ name, fuel: Math.round(fuel) }));

  // ── Vehicle status pie ──────────────────────────────────────────────────────
  const pieData = [
    { name: 'In Use', value: vehicles.filter(v => ['ACTIVE', 'ON_TRIP', 'IN_USE'].includes(v.status?.toUpperCase())).length, color: '#4CAF50' },
    { name: 'Idle', value: vehicles.filter(v => ['AVAILABLE', 'IDLE'].includes(v.status?.toUpperCase())).length, color: '#2196F3' },
    { name: 'Maintenance', value: vehicles.filter(v => v.status?.toUpperCase() === 'MAINTENANCE').length, color: '#FF9800' },
  ].filter(p => p.value > 0);

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
        Welcome back, {user?.firstName || 'Fleet Manager'}!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="My Vehicles" val={myVehicles} icon={<LocalShipping />} color="#1976d2" bg="#e3f2fd" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Drivers on Duty" val={driversOnDuty} icon={<Person />} color="#2e7d32" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Active Trips" val={activeTrips} icon={<Assignment />} color="#ed6c02" bg="#fff3e0" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Maintenance Due" val={maintDue} icon={<Build />} color="#d32f2f" bg="#ffebee" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Trip Summary (by Date)</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} /> :
              tripSummaryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tripSummaryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="trips" fill="#4caf50" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No trip data available</Typography>
                </Box>
              )}
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Fuel Consumption (L by Date)</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} /> :
              fuelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={fuelData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="fuel" stroke="#9c27b0" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No fuel data available</Typography>
                </Box>
              )}
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Vehicle Status</Typography>
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
                  <Typography color="text.secondary">No vehicle data</Typography>
                </Box>
              )}
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Recent Trips</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Trip ID</TableCell>
                    <TableCell>Origin → Destination</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [0, 1, 2].map(i => (
                      <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>
                    ))
                  ) : trips.slice(0, 5).map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{t.tripNumber || t.id?.substring(0, 8)}</TableCell>
                      <TableCell>{t.origin?.city || t.startLocation || '—'} → {t.destination?.city || t.endLocation || '—'}</TableCell>
                      <TableCell>{new Date(t.startTime || t.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={t.status} size="small"
                          color={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'primary' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && trips.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No recent trips</TableCell></TableRow>
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
