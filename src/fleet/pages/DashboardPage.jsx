import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Stack,
  Table, TableBody, TableCell, TableRow, Avatar,
  TableContainer, Divider, useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon, TrendingUp, TrendingDown, MonetizationOn, Payments, Business, People, CheckCircleOutline, Sync, ErrorOutline,
  LocationOn, Opacity, Adjust, BatteryChargingFull, Build
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { alpha } from '@mui/material/styles';



function extractItems(res) {
  const raw = res.data;
  const d = raw?.data ?? raw;
  return d?.items ?? (Array.isArray(d) ? d : []);
}

import DriverDashboard from './DriverDashboard';

export default function DashboardPage() {
  const { permissions, user } = useAuth();
  const navigate = useNavigate();
  
  const roleName = user?.role?.name || user?.role?.key || user?.role || 'User';
  const isDriver = typeof roleName === 'string' && roleName.toLowerCase() === 'driver';
  const isAdmin = typeof roleName === 'string' && roleName.toLowerCase().includes('admin');

  if (isDriver) {
    return <DriverDashboard />;
  }

  const perms = permissions || [];
  
  const canViewVehicles = perms.includes('vehicle_view');
  const canViewTrips = perms.includes('trip_view');

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [financePnl, setFinancePnl] = useState({});
  const [financeDashSummary, setFinanceDashSummary] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchPromises = [
        canViewVehicles ? api.get('/vehicles', { params: { limit: 100 } }) : Promise.resolve({ data: [] }),
        canViewTrips ? api.get('/trips', { params: { limit: 100 } }) : Promise.resolve({ data: [] }),
        api.get('/expenses', { params: { limit: 100 } }).catch(() => ({ data: [] })),
        api.get('/fuel', { params: { limit: 100 } }).catch(() => ({ data: [] })),
        api.get('/maintenance', { params: { limit: 100 } }).catch(() => ({ data: [] })),
        isAdmin ? api.get('/finance/pnl').catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
        isAdmin ? api.get('/finance/dashboard-summary').catch(() => ({ data: {} })) : Promise.resolve({ data: {} })
      ];

      const [vRes, tRes, eRes, fRes, mRes, pnlRes, dSumRes] = await Promise.allSettled(fetchPromises);

      const gotVehicles = vRes.status === 'fulfilled' && canViewVehicles ? extractItems(vRes.value) : [];
      const gotTrips = tRes.status === 'fulfilled' && canViewTrips ? extractItems(tRes.value) : [];
      const gotExpenses = eRes.status === 'fulfilled' ? extractItems(eRes.value) : [];
      const gotFuel = fRes.status === 'fulfilled' ? extractItems(fRes.value) : [];
      const gotMaintenance = mRes.status === 'fulfilled' ? extractItems(mRes.value) : [];
      setVehicles(gotVehicles);
      setTrips(gotTrips.map(t => ({
        tripNumber: t.tripNumber || t.id,
        origin: t.origin || t.startLocation || 'Unknown',
        destination: t.destination || t.endLocation || 'Unknown',
        distance: t.distance || '0 km',
        status: t.status || 'Done',
        statusColor: t.status === 'ACTIVE' || t.status === 'ON_TRIP' ? '#4CAF50' : '#9E9E9E'
      })));
      setExpenses(gotExpenses);
      setFuel(gotFuel);
      setMaintenance(gotMaintenance);

      if (isAdmin && pnlRes.status === 'fulfilled') setFinancePnl(pnlRes.value.data?.data || {});
      if (isAdmin && dSumRes.status === 'fulfilled') setFinanceDashSummary(dSumRes.value.data?.data || {});
    } catch (err) {
      console.error(err);
      if (canViewVehicles) setVehicles([]);
      setTrips([]);
      setExpenses([]);
      setFuel([]);
      setMaintenance([]);
      setFinancePnl({});
      setFinanceDashSummary({});
    } finally {
      setLoading(false);
    }
  }, [canViewVehicles, canViewTrips, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mainBg = isDark ? '#0B0F19' : '#F4F7FC';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const textColor = theme.palette.text.primary;
  const mutedText = theme.palette.text.secondary;
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  
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

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalFuelLiters = fuel.reduce((sum, f) => sum + (Number(f.quantityLiters) || 0), 0);
  const totalDistance = trips.reduce((sum, t) => sum + (parseFloat(t.distance) || 0), 0);
  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(1) : 'N/A';

  const formatAmount = (amt) => amt >= 100000 ? `₹${(amt / 100000).toFixed(2)}L` : `₹${amt.toLocaleString()}`;

  const summaryCards = [
    { label: 'Total Revenue', value: formatAmount(financePnl.totalRevenue ?? financePnl.revenue ?? financeDashSummary.totalRevenue ?? 0), icon: <TrendingUp />, color: '#10b981', path: '/transactions' },
    { label: 'Total Expenses', value: formatAmount(financePnl.totalExpenses ?? financePnl.expenses ?? financeDashSummary.totalExpenses ?? 0), icon: <TrendingDown />, color: '#ef4444', path: '/transactions' },
    { label: 'Net Profit', value: formatAmount(financePnl.netProfit ?? financeDashSummary.netProfit ?? 0), icon: <MonetizationOn />, color: (financePnl.netProfit ?? 0) >= 0 ? '#3b82f6' : '#ef4444', path: '/transactions' },
    { label: 'Pending Payments', value: formatAmount(financeDashSummary.pendingPayments ?? 0), icon: <Payments />, color: '#f59e0b', path: '/payments' },
    { label: 'Total Vendors', value: financeDashSummary.totalVendors ?? 0, icon: <Business />, color: '#8b5cf6', isCnt: true, path: '/vendors' },
    { label: 'Total Customers', value: financeDashSummary.totalCustomers ?? 0, icon: <People />, color: '#06b6d4', isCnt: true, path: '/customers' },
  ];

  return (
    <Box sx={{ bgcolor: mainBg, minHeight: '100vh', p: 1.5, m: -3, color: textColor }}>
      


      {/* TOP STATS ROW */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, color: textColor, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${borderColor}`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Vehicles</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 0.5 }}>{totalVehicles}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutline sx={{ color: '#4CAF50', fontSize: '0.8rem' }} />
                <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.7rem' }}>Live tracking</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, color: textColor, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${borderColor}`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Now</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 0.5, background: 'linear-gradient(90deg, #1976D2, #42A5F5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{activeVehicles}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ color: mutedText, fontSize: '0.8rem' }} />
                <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.7rem' }}>{activeUtilization}% utilization</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, color: textColor, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${borderColor}`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Maintenance</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 0.5, color: '#FF9800' }}>{maintenanceVehicles}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Build sx={{ color: '#FF9800', fontSize: '0.8rem' }} />
                <Typography sx={{ color: '#FF9800', fontWeight: 600, fontSize: '0.7rem' }}>{maintenanceVehicles > 0 ? 'Requires attention' : 'All clear'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, color: textColor, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${borderColor}`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Expenses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 0.5 }}>{formatAmount(totalExpenses)}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Sync sx={{ color: mutedText, fontSize: '0.8rem' }} />
                <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.7rem' }}>Across all categories</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, color: textColor, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: `1px solid ${borderColor}`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography sx={{ color: mutedText, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fuel Efficiency</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 0.5 }}>{fuelEfficiency}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Opacity sx={{ color: mutedText, fontSize: '0.8rem' }} />
                <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: '0.7rem' }}>{fuelEfficiency !== 'N/A' ? 'km/L' : 'No data'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MAIN GRID */}
      <Grid container spacing={1.5}>
        {/* LEFT COLUMN */}
        <Grid item xs={12} md={7} lg={8}>
          
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, mb: 2, border: `1px solid ${borderColor}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)' }}>
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
                {/* Dynamic Pins */}
                {vehicles.slice(0, 6).map((v, i) => (
                  <Avatar key={v.id || i} sx={{ position: 'absolute', top: `${20 + (i * 15) % 60}%`, left: `${20 + (i * 25) % 60}%`, bgcolor: v.status === 'ACTIVE' ? '#4CAF50' : '#1976D2', width: 24, height: 24, fontSize: '0.6rem' }}>
                    {v.licensePlate ? v.licensePlate.substring(0, 2) : 'V'}
                  </Avatar>
                ))}
                
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
                <Table stickyHeader size="small">
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
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, border: `1px solid ${borderColor}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)' }}>
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
                {maintenance.slice(0, 4).map((m, idx) => (
                  <Box key={m.id || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: idx < 3 ? `1px solid ${borderColor}` : 'none' }}>
                    <Avatar variant="rounded" sx={{ bgcolor: '#F5F5F5', width: 28, height: 28, borderRadius: 1.5 }}><Build sx={{ color: '#757575', fontSize: '0.9rem' }} /></Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '0.75rem' }}>{m.category || 'Maintenance'} — {m.vehiclePlate || 'Unknown'}</Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.65rem', mt: 0.2 }}>{m.description || 'Routine check'}</Typography>
                    </Box>
                    <Typography sx={{ color: m.status === 'PENDING' ? '#D32F2F' : mutedText, fontWeight: 600, fontSize: '0.7rem' }}>{m.status || 'Pending'}</Typography>
                  </Box>
                ))}
                {maintenance.length === 0 && (
                  <Typography sx={{ py: 2, textAlign: 'center', color: mutedText, fontSize: '0.8rem' }}>No maintenance records found</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={5} lg={4}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 4, mb: 2, border: `1px solid ${borderColor}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)' }}>
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
                <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: 2, px: 1.5, py: 0.75, bgcolor: isDark ? '#1C2536' : '#F8FAFC' }}>
                  <Typography sx={{ fontSize: '0.65rem', color: textColor }}>Spare parts: <Box component="span" sx={{ fontWeight: 800, color: '#1976D2' }}>342 SKUs</Box></Typography>
                </Box>
                <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: 2, px: 1.5, py: 0.75, bgcolor: isDark ? '#1C2536' : '#F8FAFC' }}>
                  <Typography sx={{ fontSize: '0.65rem', color: textColor }}>Tools: <Box component="span" sx={{ fontWeight: 800, color: '#1976D2' }}>89 items</Box></Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>


          
        </Grid>
      </Grid>
    </Box>
  );
}
