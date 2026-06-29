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

export default function DashboardPage() {
  const { permissions } = useAuth();
  const perms = permissions || [];
  
  const canViewVehicles = perms.includes('vehicle_view');
  const canViewTrips = perms.includes('trip_view');

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

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
      
      {/* TOP STATS ROW */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Total Vehicles</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{totalVehicles}</Typography>
              <Typography sx={{ color: '#4CAF50', fontWeight: 600, display: 'block', mt: 0.5, fontSize: '0.65rem' }}>Live tracking</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Active Now</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#1976D2' }}>{activeVehicles}</Typography>
              <Typography sx={{ color: mutedText, fontWeight: 600, display: 'block', mt: 0.5, fontSize: '0.65rem' }}>{activeUtilization}% utilization</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Maintenance</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#FF9800' }}>{maintenanceVehicles}</Typography>
              <Typography sx={{ color: '#FF9800', fontWeight: 600, display: 'block', mt: 0.5, fontSize: '0.65rem' }}>{maintenanceVehicles > 0 ? 'Requires attention' : 'All clear'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Monthly Expense</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>₹4.2L</Typography>
              <Typography sx={{ color: '#F44336', fontWeight: 600, display: 'block', mt: 0.5, fontSize: '0.65rem' }}>+8% vs last month</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, color: textColor, boxShadow: 'none', border: `1px solid ${borderColor}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Fuel Efficiency</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>11.4</Typography>
              <Typography sx={{ color: '#4CAF50', fontWeight: 600, display: 'block', mt: 0.5, fontSize: '0.65rem' }}>km/L · improved 5%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MAIN GRID */}
      <Grid container spacing={1.5}>
        {/* LEFT COLUMN */}
        <Grid item xs={12} md={7} lg={8}>
          
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, mb: 1.5, border: `1px solid ${borderColor}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ color: textColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>
                  <LocationOn sx={{ fontSize: '1rem' }} /> Live vehicle tracking
                </Typography>
                <Typography sx={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 700 }}>● 31 live</Typography>
              </Box>
              
              {/* Map Placeholder */}
              <Box sx={{ 
                height: 180, bgcolor: isDark ? '#192534' : '#E3F2FD', borderRadius: 1.5, position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5
              }}>
                <Box sx={{ position: 'absolute', width: '100%', height: '100%', backgroundImage: 'linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.15 }} />
                {/* Mock Pins */}
                <Avatar sx={{ position: 'absolute', top: '30%', left: '20%', bgcolor: '#1976D2', width: 20, height: 20, fontSize: '0.6rem' }}>T1</Avatar>
                <Avatar sx={{ position: 'absolute', top: '50%', left: '40%', bgcolor: '#1976D2', width: 20, height: 20, fontSize: '0.6rem' }}>T5</Avatar>
                <Avatar sx={{ position: 'absolute', top: '20%', right: '30%', bgcolor: '#FF9800', width: 20, height: 20, fontSize: '0.6rem' }}>T8</Avatar>
                <Avatar sx={{ position: 'absolute', bottom: '40%', left: '30%', bgcolor: '#D32F2F', width: 20, height: 20, fontSize: '0.6rem' }}>!</Avatar>
                <Avatar sx={{ position: 'absolute', bottom: '20%', right: '40%', bgcolor: '#9E9E9E', width: 20, height: 20, fontSize: '0.6rem' }}>T6</Avatar>
                <Avatar sx={{ position: 'absolute', top: '40%', right: '15%', bgcolor: '#1976D2', width: 20, height: 20, fontSize: '0.6rem' }}>T2</Avatar>
                
                {/* Legend */}
                <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: isDark ? 'rgba(0,0,0,0.6)' : 'white', backdropFilter: 'blur(4px)', p: 1, borderRadius: 1, boxShadow: 1, border: `1px solid ${borderColor}` }}>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1976D2' }} /><Typography sx={{ fontSize: '0.65rem', color: textColor, fontWeight: 600 }}>Moving</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#FF9800' }} /><Typography sx={{ fontSize: '0.65rem', color: textColor, fontWeight: 600 }}>Idle</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D32F2F' }} /><Typography sx={{ fontSize: '0.65rem', color: textColor, fontWeight: 600 }}>Alert</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#9E9E9E' }} /><Typography sx={{ fontSize: '0.65rem', color: textColor, fontWeight: 600 }}>Stopped</Typography></Box>
                  </Stack>
                </Box>
              </Box>

              <Typography sx={{ color: textColor, fontWeight: 600, mt: 2, mb: 0.5, fontSize: '0.85rem' }}>Recent trips</Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {trips.map((t, idx) => (
                      <TableRow key={idx} sx={{ '& td': { borderBottom: idx === trips.length - 1 ? 'none' : `1px solid ${borderColor}` } }}>
                        <TableCell sx={{ color: textColor, fontWeight: 700, py: 1, px: 0, fontSize: '0.75rem' }}>{t.tripNumber}</TableCell>
                        <TableCell sx={{ color: textColor, py: 1, px: 0 }}>
                          <Typography sx={{ fontSize: '0.75rem' }}>{t.origin}</Typography>
                          <Typography sx={{ color: mutedText, fontSize: '0.7rem' }}>→ {t.destination}</Typography>
                        </TableCell>
                        <TableCell sx={{ color: textColor, fontWeight: 600, py: 1, px: 0, fontSize: '0.75rem' }}>{t.distance}</TableCell>
                        <TableCell align="right" sx={{ color: t.statusColor, fontWeight: 600, py: 1, px: 0, fontSize: '0.75rem' }}>{t.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Maintenance Schedule Widget */}
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, border: `1px solid ${borderColor}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ color: textColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>
                  <Build sx={{ fontSize: '1rem' }} /> Maintenance schedule
                </Typography>
                <Box sx={{ bgcolor: isDark ? 'rgba(25, 118, 210, 0.1)' : '#E3F2FD', color: '#1976D2', px: 1, py: 0.25, borderRadius: 1 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>Predictive AI</Typography>
                </Box>
              </Box>

              <Stack spacing={0}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: `1px solid ${borderColor}` }}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#FFF3E0', width: 28, height: 28, borderRadius: 1.5 }}><Opacity sx={{ color: '#FF9800', fontSize: '0.9rem' }} /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '0.75rem' }}>Oil Change — AP05-T043</Typography>
                    <Typography sx={{ color: mutedText, fontSize: '0.65rem', mt: 0.2 }}>Last done: 3,200 km ago · 5W-30 grade</Typography>
                  </Box>
                  <Typography sx={{ color: '#D32F2F', fontWeight: 600, fontSize: '0.7rem' }}>Overdue</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: `1px solid ${borderColor}` }}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#FFEBEE', width: 28, height: 28, borderRadius: 1.5 }}><Adjust sx={{ color: '#D32F2F', fontSize: '0.9rem' }} /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '0.75rem' }}>Tyre Replacement — AP05-T089</Typography>
                    <Typography sx={{ color: mutedText, fontSize: '0.65rem', mt: 0.2 }}>Wear index: 92% · Front pair critical</Typography>
                  </Box>
                  <Typography sx={{ color: '#D32F2F', fontWeight: 600, fontSize: '0.7rem' }}>Overdue</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: `1px solid ${borderColor}` }}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#E8F5E9', width: 28, height: 28, borderRadius: 1.5 }}><BatteryChargingFull sx={{ color: '#4CAF50', fontSize: '0.9rem' }} /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '0.75rem' }}>Battery Check — AP05-T112</Typography>
                    <Typography sx={{ color: mutedText, fontSize: '0.65rem', mt: 0.2 }}>AI predicts replacement needed in 3 wks</Typography>
                  </Box>
                  <Typography sx={{ color: '#FF9800', fontWeight: 600, fontSize: '0.7rem' }}>In 18 days</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1.5 }}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#F5F5F5', width: 28, height: 28, borderRadius: 1.5 }}><Build sx={{ color: '#757575', fontSize: '0.9rem' }} /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '0.75rem' }}>Brake Service — AP05-T047</Typography>
                    <Typography sx={{ color: mutedText, fontSize: '0.65rem', mt: 0.2 }}>Standard maintenance · 85% pad life</Typography>
                  </Box>
                  <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.7rem' }}>In 32 days</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={5} lg={4}>
          
          <Card sx={{ bgcolor: isDark ? alpha('#E0F7FA', 0.05) : '#F0F9FA', borderRadius: 1.5, mb: 1.5, border: 'none', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#1976D2', width: 24, height: 24 }}><DashboardIcon sx={{ fontSize: '0.9rem' }} /></Avatar>
                  <Typography sx={{ color: isDark ? '#4DD0E1' : '#1976D2', fontWeight: 800, fontSize: '0.85rem' }}>AI Intelligence</Typography>
                </Box>
                <Box sx={{ border: `1px solid ${isDark ? '#4DD0E1' : '#1976D2'}`, color: isDark ? '#4DD0E1' : '#1976D2', borderRadius: 1, px: 0.5, py: 0.1 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>Live</Typography>
                </Box>
              </Box>

              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <ErrorOutline sx={{ color: '#FF5252', fontSize: '1rem', mt: 0.2 }} />
                  <Box>
                    <Typography sx={{ color: isDark ? '#E0E0E0' : '#333', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>AP05-T043 engine temp abnormal — predict failure in 48 hrs</Typography>
                    <Typography sx={{ color: '#888', fontSize: '0.65rem', mt: 0.2 }}>Predictive maintenance · Schedule now</Typography>
                  </Box>
                </Box>
                <Divider sx={{ borderColor: 'rgba(0,0,0,0.05)' }} />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TrendingUp sx={{ color: '#FF9800', fontSize: '1rem', mt: 0.2 }} />
                  <Box>
                    <Typography sx={{ color: isDark ? '#E0E0E0' : '#333', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>Fuel cost 10% above forecast for Zone B vehicles this week</Typography>
                    <Typography sx={{ color: '#888', fontSize: '0.65rem', mt: 0.2 }}>Cost anomaly · Review idle patterns</Typography>
                  </Box>
                </Box>
                <Divider sx={{ borderColor: 'rgba(0,0,0,0.05)' }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckCircleOutline sx={{ color: '#4CAF50', fontSize: '1rem', mt: 0.2 }} />
                  <Box>
                    <Typography sx={{ color: isDark ? '#E0E0E0' : '#333', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>Route optimization saved 340 km vs last week</Typography>
                    <Typography sx={{ color: '#888', fontSize: '0.65rem', mt: 0.2 }}>AI routing · Saving ₹8,200/week</Typography>
                  </Box>
                </Box>
                <Divider sx={{ borderColor: 'rgba(0,0,0,0.05)' }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Sync sx={{ color: '#FF9800', fontSize: '1rem', mt: 0.2 }} />
                  <Box>
                    <Typography sx={{ color: isDark ? '#E0E0E0' : '#333', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>5 vehicles due for tyre rotation within 500 km</Typography>
                    <Typography sx={{ color: '#888', fontSize: '0.65rem', mt: 0.2 }}>Inventory: 12 tyres in stock · Sufficient</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, mb: 1.5, border: `1px solid ${borderColor}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '0.85rem' }}>Asset inventory</Typography>
                <Box sx={{ bgcolor: isDark ? 'rgba(25, 118, 210, 0.1)' : '#E3F2FD', color: '#1976D2', px: 0.5, borderRadius: 1 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800 }}>AI</Typography>
                </Box>
              </Box>
              
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Box sx={{ bgcolor: isDark ? '#2A2A2A' : '#F5F5F5', p: 1.5, borderRadius: 2, textAlign: 'center', border: `1px solid ${borderColor}` }}>
                    <Typography sx={{ color: mutedText, fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.65rem', letterSpacing: 0.5 }}>TRUCKS</Typography>
                    <Typography variant="h5" sx={{ color: textColor, fontWeight: 800 }}>{trucks.length}</Typography>
                    <Typography sx={{ color: '#4CAF50', fontSize: '0.65rem', mt: 0.5 }}>{truckAvailable} available</Typography>
                    <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.1)', mt: 1, borderRadius: 2 }}>
                      <Box sx={{ width: `${trucks.length ? (truckAvailable/trucks.length)*100 : 0}%`, height: '100%', bgcolor: '#4CAF50', borderRadius: 2 }} />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ bgcolor: isDark ? '#2A2A2A' : '#F5F5F5', p: 1.5, borderRadius: 2, textAlign: 'center', border: `1px solid ${borderColor}` }}>
                    <Typography sx={{ color: mutedText, fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.65rem', letterSpacing: 0.5 }}>VANS</Typography>
                    <Typography variant="h5" sx={{ color: textColor, fontWeight: 800 }}>{vans.length}</Typography>
                    <Typography sx={{ color: '#FF9800', fontSize: '0.65rem', mt: 0.5 }}>{vanAvailable} available</Typography>
                    <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.1)', mt: 1, borderRadius: 2 }}>
                      <Box sx={{ width: `${vans.length ? (vanAvailable/vans.length)*100 : 0}%`, height: '100%', bgcolor: '#FF9800', borderRadius: 2 }} />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ bgcolor: isDark ? '#2A2A2A' : '#F5F5F5', p: 1.5, borderRadius: 2, textAlign: 'center', border: `1px solid ${borderColor}` }}>
                    <Typography sx={{ color: mutedText, fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.65rem', letterSpacing: 0.5 }}>CARS</Typography>
                    <Typography variant="h5" sx={{ color: textColor, fontWeight: 800 }}>{cars.length}</Typography>
                    <Typography sx={{ color: '#4CAF50', fontSize: '0.65rem', mt: 0.5 }}>{carAvailable} available</Typography>
                    <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.1)', mt: 1, borderRadius: 2 }}>
                      <Box sx={{ width: `${cars.length ? (carAvailable/cars.length)*100 : 0}%`, height: '100%', bgcolor: '#4CAF50', borderRadius: 2 }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: 1, px: 1, py: 0.5 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: textColor }}>Spare parts: <Box component="span" sx={{ fontWeight: 800 }}>342 SKUs</Box></Typography>
                </Box>
                <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: 1, px: 1, py: 0.5 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: textColor }}>Tools: <Box component="span" sx={{ fontWeight: 800 }}>89 items</Box></Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Expense Breakdown Widget */}
          <Card sx={{ bgcolor: cardBg, borderRadius: 1.5, border: `1px solid ${borderColor}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: textColor, fontWeight: 600, fontSize: '0.85rem', mb: 1.5 }}>
                <Box component="span" sx={{ color: mutedText, mr: 0.5 }}>$</Box> Expense breakdown — June 2026
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Box sx={{ bgcolor: isDark ? '#2A2A2A' : '#F5F5F5', p: 1, borderRadius: 1.5, flex: 1, textAlign: 'center' }}>
                  <Typography sx={{ color: mutedText, fontSize: '0.6rem', fontWeight: 600, mb: 0.5 }}>Total MTD</Typography>
                  <Typography sx={{ color: textColor, fontWeight: 800, fontSize: '1.1rem' }}>₹4.2L</Typography>
                </Box>
                <Box sx={{ bgcolor: isDark ? '#2A2A2A' : '#F5F5F5', p: 1, borderRadius: 1.5, flex: 1, textAlign: 'center' }}>
                  <Typography sx={{ color: mutedText, fontSize: '0.6rem', fontWeight: 600, mb: 0.5 }}>Budget</Typography>
                  <Typography sx={{ color: '#FF9800', fontWeight: 800, fontSize: '1.1rem' }}>₹4.0L</Typography>
                </Box>
                <Box sx={{ bgcolor: '#FFEBEE', p: 1, borderRadius: 3, flex: 1, textAlign: 'center' }}>
                  <Typography sx={{ color: '#D32F2F', fontSize: '0.6rem', fontWeight: 600, mb: 0.5 }}>Over by</Typography>
                  <Typography sx={{ color: '#D32F2F', fontWeight: 800, fontSize: '1.1rem' }}>₹20K</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <ProgressBar label="Fuel" value={182000} max={250000} color="#1976D2" amount="1,82,000" />
                <ProgressBar label="Maintenance" value={94000} max={250000} color="#FF9800" amount="94,000" />
                <ProgressBar label="Driver pay" value={112000} max={250000} color="#4CAF50" amount="1,12,000" />
                <ProgressBar label="Tolls/Tax" value={24000} max={250000} color="#9E9E9E" amount="24,000" />
                <ProgressBar label="Insurance" value={8000} max={250000} color="#9C27B0" amount="8,000" />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', pt: 1.5, borderTop: `1px solid ${borderColor}` }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1976D2', mt: 0.5 }} />
                <Typography sx={{ color: mutedText, fontSize: '0.65rem', lineHeight: 1.3 }}>
                  AI forecast: ₹4.5L by month-end · 12.5% over budget
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
        </Grid>
      </Grid>
    </Box>
  );
}
