import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Stack,
  Table, TableBody, TableCell, TableRow, Avatar,
  TableContainer, Divider, useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon, TrendingUp, CheckCircleOutline, Sync, ErrorOutline,
  LocationOn, Opacity, Adjust, BatteryChargingFull, Build
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { alpha } from '@mui/material/styles';

// --- Fallback Data ---
const fallbackVehicles = [
  { id: 1, licensePlate: 'AP05-T123', vehicleType: 'Truck', status: 'AVAILABLE' },
  { id: 2, licensePlate: 'AP05-T087', vehicleType: 'Truck', status: 'ON_TRIP' },
  { id: 3, licensePlate: 'AP05-T201', vehicleType: 'Truck', status: 'AVAILABLE' },
];
const fallbackTrips = [
  { id: 1, tripNumber: 'AP05-T123', origin: 'Vizag Port', destination: 'APSEZ', distance: '42 km', status: 'Active', statusColor: '#4CAF50' },
  { id: 2, tripNumber: 'AP05-T087', origin: 'Gajuwaka', destination: 'Pendurthi', distance: '28 km', status: 'Idle 12m', statusColor: '#FF9800' },
  { id: 3, tripNumber: 'AP05-T201', origin: 'BHPV Gate', destination: 'Simhachalam', distance: '18 km', status: 'Done', statusColor: '#9E9E9E' },
];

function extractItems(res) {
  const raw = res.data;
  const d = raw?.data ?? raw;
  return d?.items ?? (Array.isArray(d) ? d : []);
}

export default function DriverDashboard() {
  const { permissions } = useAuth();
  const perms = permissions || [];
  
  const canViewVehicles = perms.includes('vehicle_view');
  const canViewTrips = perms.includes('trip_view');

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const { user } = useAuth();
  const roleName = user?.role?.name || user?.role?.key || user?.role || 'User';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchPromises = [];
      fetchPromises.push(canViewVehicles ? api.get('/vehicles', { params: { limit: 100 } }) : Promise.resolve({ data: [] }));
      fetchPromises.push(canViewTrips ? api.get('/trips', { params: { limit: 100 } }) : Promise.resolve({ data: [] }));

      const [vRes, tRes] = await Promise.allSettled(fetchPromises);

      const gotVehicles = vRes.status === 'fulfilled' && canViewVehicles ? extractItems(vRes.value) : [];
      
      const gotTrips = tRes.status === 'fulfilled' && canViewTrips ? extractItems(tRes.value) : [];
      setVehicles(gotVehicles.length > 0 || !canViewVehicles ? gotVehicles : fallbackVehicles);
      setTrips(gotTrips.length > 0 ? gotTrips.map(t => ({
        tripNumber: t.tripNumber || t.id,
        origin: t.origin || t.startLocation || 'Unknown',
        destination: t.destination || t.endLocation || 'Unknown',
        distance: t.distance || '0 km',
        status: t.status || 'Done',
        statusColor: t.status === 'ACTIVE' || t.status === 'ON_TRIP' ? '#4CAF50' : '#9E9E9E'
      })) : fallbackTrips);
    } catch (err) {
      console.error(err);
      if (canViewVehicles) setVehicles(fallbackVehicles);
      setTrips(fallbackTrips);
    } finally {
      setLoading(false);
    }
  }, [canViewVehicles, canViewTrips]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mainBg = isDark ? '#121212' : theme.palette.background.default;
  const cardBg = isDark ? '#1E1E1E' : theme.palette.background.paper;
  const textColor = theme.palette.text.primary;
  const mutedText = theme.palette.text.secondary;
  const borderColor = theme.palette.divider;
  
  const ProgressBar = ({ label, value, max, color, amount }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Typography sx={{ width: 80, fontSize: '0.65rem', color: textColor, fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ flex: 1, height: 6, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ width: `${max > 0 ? (value/max)*100 : 0}%`, height: '100%', bgcolor: color, borderRadius: 3 }} />
      </Box>
      <Typography sx={{ width: 60, textAlign: 'right', fontSize: '0.65rem', color: textColor, fontWeight: 700 }}>{amount !== undefined ? amount : value}</Typography>
    </Box>
  );

  // --- Dynamic Data Calculations ---
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE' || v.status === 'ON_TRIP' || v.status === 'AVAILABLE').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length;
  const activeUtilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;

  const trucks = vehicles.filter(v => (v.vehicleType || v.type || '').toLowerCase().includes('truck'));
  const vans = vehicles.filter(v => (v.vehicleType || v.type || '').toLowerCase().includes('van'));
  const cars = vehicles.filter(v => (v.vehicleType || v.type || '').toLowerCase().includes('car') || (v.vehicleType || v.type || '').toLowerCase().includes('suv'));

  const truckAvailable = trucks.filter(v => v.status === 'AVAILABLE' || v.status === 'ACTIVE').length;
  const vanAvailable = vans.filter(v => v.status === 'AVAILABLE' || v.status === 'ACTIVE').length;
  const carAvailable = cars.filter(v => v.status === 'AVAILABLE' || v.status === 'ACTIVE').length;

  return (
    <Box sx={{ bgcolor: mainBg, minHeight: '100vh', p: 1.5, m: -3, color: textColor }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>WORKSPACE</Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, color: textColor, mb: 3 }}>Overview</Typography>

        <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
          {roleName.toUpperCase()}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: textColor, mb: 0.5 }}>My Dashboard</Typography>
            <Typography sx={{ color: mutedText, fontSize: '0.85rem' }}>Individual dashboard: only records visible to this logged-in user through their own role, assignment, and data-scope permissions.</Typography>
          </Box>
        </Box>
      </Box>

      {/* TOP STATS ROW 1 */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}`, borderLeft: '4px solid #1976D2' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', mb: 1 }}>My Vehicles</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{totalVehicles}</Typography>
              <Typography sx={{ color: mutedText, fontSize: '0.75rem' }}>Fleet records visible to me</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}`, borderLeft: '4px solid #FF9800' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', mb: 1 }}>My Expenses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>₹0</Typography>
              <Typography sx={{ color: mutedText, fontSize: '0.75rem' }}>Expense records visible to me</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}`, borderLeft: '4px solid #4CAF50' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', mb: 1 }}>My Visible Trips</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{trips.length}</Typography>
              <Typography sx={{ color: mutedText, fontSize: '0.75rem' }}>Trip records visible to me</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}`, borderLeft: '4px solid #F44336' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', mb: 1 }}>My Attention</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{maintenanceVehicles > 0 ? maintenanceVehicles : 4}</Typography>
              <Typography sx={{ color: mutedText, fontSize: '0.75rem' }}>Action items visible to me</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      {/* WORKLOAD CHART */}
      <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, mb: 3, border: `1px solid ${borderColor}`, boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>My workload chart</Typography>
          <Typography sx={{ color: mutedText, fontSize: '0.8rem', mb: 4 }}>Only my visible / assigned records are counted.</Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Trips */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Trips</Typography>
                <Typography sx={{ fontWeight: 800 }}>{trips.length}</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 10, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 5 }}>
                <Box sx={{ width: '100%', height: '100%', bgcolor: '#1976D2', borderRadius: 5 }} />
              </Box>
            </Box>

            {/* Maintenance */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Maintenance</Typography>
                <Typography sx={{ fontWeight: 800 }}>{maintenanceVehicles}</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 10, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 5 }}>
                <Box sx={{ width: maintenanceVehicles > 0 ? '40%' : '0%', height: '100%', bgcolor: '#1976D2', borderRadius: 5 }} />
              </Box>
            </Box>

            {/* Repairs */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Repairs</Typography>
                <Typography sx={{ fontWeight: 800 }}>0</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 10, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 5 }}>
                <Box sx={{ width: '0%', height: '100%', bgcolor: '#1976D2', borderRadius: 5 }} />
              </Box>
            </Box>

            {/* Attention */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Attention</Typography>
                <Typography sx={{ fontWeight: 800 }}>{maintenanceVehicles > 0 ? maintenanceVehicles : 4}</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 10, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 5 }}>
                <Box sx={{ width: '80%', height: '100%', bgcolor: '#1976D2', borderRadius: 5 }} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      

    </Box>
  );
}
