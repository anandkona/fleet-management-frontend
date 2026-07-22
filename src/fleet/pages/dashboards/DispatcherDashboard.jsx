import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, useTheme, Skeleton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Assignment, LocalShipping, Person, WarningAmber, Map } from '@mui/icons-material';
import api, { dispatchService } from '../../../services/api';
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

export default function DispatcherDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, vRes, dRes, bRes] = await Promise.allSettled([
        api.get('/trips', { params: { limit: 200 } }),
        api.get('/vehicles', { params: { limit: 200 } }),
        api.get('/drivers', { params: { limit: 200 } }),
        dispatchService.getBoard(),
      ]);
      setTrips(tRes.status === 'fulfilled' ? extractItems(tRes.value) : []);
      setVehicles(vRes.status === 'fulfilled' ? extractItems(vRes.value) : []);
      setDrivers(dRes.status === 'fulfilled' ? extractItems(dRes.value) : []);
      setBoard(bRes.status === 'fulfilled' ? bRes.value?.data?.data : null);
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

  // ── Computed metrics (all dynamic) ─────────────────────────────────────────
  const activeTrips = trips.filter(t =>
    ['IN_PROGRESS', 'ACTIVE', 'ON_TRIP', 'STARTED'].includes(t.status?.toUpperCase())
  ).length;
  const completedTrips = trips.filter(t => t.status?.toUpperCase() === 'COMPLETED').length;
  const cancelledTrips = trips.filter(t => t.status?.toUpperCase() === 'CANCELLED').length;

  const availableVehicles = board?.summary?.availableVehicles
    ?? vehicles.filter(v => ['AVAILABLE', 'IDLE'].includes(v.status?.toUpperCase())).length;

  const availableDrivers = board?.summary?.availableDrivers
    ?? drivers.filter(d => d.status?.toUpperCase() === 'AVAILABLE').length;

  // Delayed = trips that are active and past their scheduled end time
  const delayedTrips = board?.summary?.delayedTrips
    ?? trips.filter(t => {
      const isActive = ['IN_PROGRESS', 'ACTIVE', 'ON_TRIP'].includes(t.status?.toUpperCase());
      const scheduledEnd = t.scheduledEndTime || t.estimatedArrival;
      return isActive && scheduledEnd && new Date(scheduledEnd) < new Date();
    }).length;

  const activeList = trips.filter(t =>
    ['IN_PROGRESS', 'ACTIVE', 'ON_TRIP', 'STARTED'].includes(t.status?.toUpperCase())
  );

  const MetricCard = ({ title, val, icon, color, bg, badge, badgeColor }) => (
    <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: bg, color }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
          {loading ? <Skeleton width={50} height={28} /> :
            <Typography variant="h6" fontWeight="bold">{val}</Typography>}
          {badge && <Typography variant="caption" sx={{ color: badgeColor, fontWeight: 'bold' }}>{badge}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Welcome back, {user?.firstName || 'Dispatcher'}!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Active Trips" val={activeTrips} icon={<Assignment />} color="#1976d2" bg="#e3f2fd" badge="Live" badgeColor="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Available Vehicles" val={availableVehicles} icon={<LocalShipping />} color="#4caf50" bg="#e8f5e9" badge="Ready" badgeColor="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Available Drivers" val={availableDrivers} icon={<Person />} color="#4caf50" bg="#e8f5e9" badge="Ready" badgeColor="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Delayed Trips" val={delayedTrips} icon={<WarningAmber />} color="#d32f2f" bg="#ffebee" badge={delayedTrips > 0 ? 'Attention' : 'On Time'} badgeColor={delayedTrips > 0 ? '#d32f2f' : '#4caf50'} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Active Trips</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Trip ID</TableCell>
                    <TableCell>Origin → Destination</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>) :
                    activeList.slice(0, 6).map(t => (
                      <TableRow key={t.id}>
                        <TableCell>{t.tripNumber || t.id?.substring(0, 8)}</TableCell>
                        <TableCell>
                          {t.origin?.city || t.startLocation || '—'}
                          {' → '}
                          {t.destination?.city || t.endLocation || '—'}
                        </TableCell>
                        <TableCell>{t.driver?.name || t.driver?.firstName || '—'}</TableCell>
                        <TableCell align="right">
                          <Chip label={t.status} size="small" color="primary" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && activeList.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">No active trips currently</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Live Tracking Map</Typography>
            </Box>
            <Box sx={{ flex: 1, bgcolor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <Map sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.4, mr: 1 }} />
              <Typography color="text.secondary">Live Map Placeholder</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" mb={3}>Trip Overview (All Time)</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Total Trips', val: trips.length },
            { label: 'Completed', val: completedTrips },
            { label: 'In Progress', val: activeTrips },
            { label: 'Cancelled', val: cancelledTrips },
          ].map((s, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                {loading ? <Skeleton width={60} height={40} /> :
                  <Typography variant="h5" fontWeight="bold" mt={0.5}>{s.val}</Typography>}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
}
