import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, useTheme, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { LocalGasStation, AttachMoney, MonetizationOn } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

export default function FuelManagerDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [fuel, setFuel] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const f = await api.get('/fuel', { params: { limit: 200 } }).catch(() => ({ data: [] }));
      setFuel(extractItems(f));
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
  const todayStr = new Date().toDateString();
  const fuelToday = fuel
    .filter(f => new Date(f.date || f.createdAt).toDateString() === todayStr)
    .reduce((sum, f) => sum + (Number(f.quantityLiters) || 0), 0);
  const costToday = fuel
    .filter(f => new Date(f.date || f.createdAt).toDateString() === todayStr)
    .reduce((sum, f) => sum + (Number(f.totalCost) || 0), 0);

  const now = new Date();
  const fuelMonth = fuel
    .filter(f => {
      const d = new Date(f.date || f.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, f) => sum + (Number(f.quantityLiters) || 0), 0);
  const costMonth = fuel
    .filter(f => {
      const d = new Date(f.date || f.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, f) => sum + (Number(f.totalCost) || 0), 0);

  // ── Fuel trend by date ─────────────────────────────────────────────────────
  const dateMap = {};
  fuel.forEach(f => {
    const label = new Date(f.date || f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dateMap[label] = (dateMap[label] || 0) + (Number(f.quantityLiters) || 0);
  });
  const trendData = Object.entries(dateMap)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-7)
    .map(([name, fuel]) => ({ name, fuel: Math.round(fuel) }));

  // ── Fuel by vehicle ────────────────────────────────────────────────────────
  const vehicleMap = {};
  fuel.forEach(f => {
    const key = f.vehicle?.vehicleNumber || f.vehicleId || 'Unknown';
    vehicleMap[key] = (vehicleMap[key] || 0) + (Number(f.quantityLiters) || 0);
  });
  const vehicleData = Object.entries(vehicleMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, fuel]) => ({ name, fuel: Math.round(fuel) }));

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
        Welcome back, {user?.firstName || 'Fuel Manager'}!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Fuel Dispensed Today" val={`${fuelToday.toLocaleString()} L`} icon={<LocalGasStation />} color="#4caf50" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Today's Fuel Cost" val={`₹ ${costToday.toLocaleString()}`} icon={<AttachMoney />} color="#9c27b0" bg="#f3e5f5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="This Month (L)" val={`${fuelMonth.toLocaleString()} L`} icon={<LocalGasStation />} color="#1976d2" bg="#e3f2fd" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="This Month Cost" val={`₹ ${costMonth.toLocaleString()}`} icon={<MonetizationOn />} color="#ed6c02" bg="#fff3e0" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Fuel Consumption Trend (L)</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} /> :
              trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${v} L`, 'Fuel']} />
                    <Line type="monotone" dataKey="fuel" stroke="#2196f3" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No fuel trend data available</Typography>
                </Box>
              )}
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Top Vehicles by Fuel (All Time)</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} /> :
              vehicleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={vehicleData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} L`, 'Fuel']} />
                    <Bar dataKey="fuel" fill="#4caf50" barSize={14} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No vehicle fuel data</Typography>
                </Box>
              )}
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">Recent Fuel Logs</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Vehicle No.</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Fuel Station</TableCell>
                <TableCell align="right">Quantity (L)</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>) :
                fuel.slice(0, 8).map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{new Date(f.date || f.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{f.vehicle?.vehicleNumber || f.vehicleId || '—'}</TableCell>
                    <TableCell>{f.driver?.name || f.driver?.firstName || '—'}</TableCell>
                    <TableCell>{f.stationName || f.fuelStation || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Number(f.quantityLiters).toLocaleString()}</TableCell>
                    <TableCell align="right">₹ {Number(f.totalCost || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              {!loading && fuel.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">No fuel logs found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
