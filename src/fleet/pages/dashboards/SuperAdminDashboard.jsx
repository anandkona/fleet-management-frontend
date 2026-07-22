import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Stack,
  Avatar, useTheme, Button, Divider, Menu, MenuItem, Skeleton
} from '@mui/material';
import {
  LocalShipping, Person, LocalGasStation, Build,
  CalendarToday, TrendingUp, Build as BuildIcon,
  InfoOutlined, WarningAmberOutlined
} from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import {
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

function extractItems(res) {
  const raw = res?.data;
  if (!raw) return [];
  // Handle: { data: { items: [] } }
  if (raw?.data?.items && Array.isArray(raw.data.items)) return raw.data.items;
  // Handle: { data: { data: [] } }
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  // Handle: { data: [] }
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  // Handle: { items: [] }
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  // Handle: []
  if (Array.isArray(raw)) return raw;
  return [];
}


export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dateRangeDays, setDateRangeDays] = useState(7);
  const [debugError, setDebugError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, dRes, fRes, mRes, aRes] = await Promise.allSettled([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/fuel'),
        api.get('/maintenance'),
        api.get('/me/notifications').catch(() => ({ data: [] })),
      ]);
      
      let errStr = '';
      if (vRes.status === 'rejected') errStr += `Vehicles: ${vRes.reason?.message || vRes.reason}\n`;
      if (dRes.status === 'rejected') errStr += `Drivers: ${dRes.reason?.message || dRes.reason}\n`;
      if (errStr) setDebugError(errStr);

      setVehicles(vRes.status === 'fulfilled' ? extractItems(vRes.value) : []);
      setDrivers(dRes.status === 'fulfilled' ? extractItems(dRes.value) : []);
      setFuel(fRes.status === 'fulfilled' ? extractItems(fRes.value) : []);
      setMaintenance(mRes.status === 'fulfilled' ? extractItems(mRes.value) : []);
      setAlerts(aRes.status === 'fulfilled' ? extractItems(aRes.value) : []);
    } catch (err) {
      console.error('Fetch Data Try/Catch Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isDark = theme.palette.mode === 'dark';
  const mainBg = isDark ? '#0B0F19' : '#F8FAFC';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const textColor = theme.palette.text.primary;
  const mutedText = theme.palette.text.secondary;
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // ── Metrics ────────────────────────────────────────────────────────────────
  const totalVehicles = vehicles.length;
  const activeDrivers = drivers.filter(d =>
    ['ACTIVE', 'ON_TRIP', 'ASSIGNED'].includes(d.status?.toUpperCase())
  ).length || drivers.length;
  const totalFuelLitres = fuel.reduce((acc, f) => acc + (Number(f.quantityLiters) || 0), 0);
  const pendingMaintenance = maintenance.filter(m => m.status?.toUpperCase() === 'PENDING').length;

  // ── Vehicle status pie ──────────────────────────────────────────────────────
  const inUse = vehicles.filter(v => ['ACTIVE', 'ON_TRIP', 'IN_USE', 'STARTED'].includes(v.status?.toUpperCase())).length;
  const idle = vehicles.filter(v => ['AVAILABLE', 'IDLE'].includes(v.status?.toUpperCase())).length;
  const inMaintenance = vehicles.filter(v => v.status?.toUpperCase() === 'MAINTENANCE').length;
  const outOfService = vehicles.filter(v => v.status?.toUpperCase() === 'OUT_OF_SERVICE').length;
  const pieData = [
    { name: 'In Use', value: inUse, color: '#4CAF50' },
    { name: 'Idle', value: idle, color: '#2196F3' },
    { name: 'Maintenance', value: inMaintenance, color: '#FF9800' },
    { name: 'Out of Service', value: outOfService, color: '#F44336' },
  ].filter(p => p.value > 0);

  // ── Fuel area chart by date ─────────────────────────────────────────────────
  const today = new Date();
  const daysArray = Array.from({ length: dateRangeDays }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - ((dateRangeDays - 1) - i));
    return d;
  });
  const dateRangeStr = `${daysArray[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const areaData = daysArray.map(date => {
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fuelForDay = fuel
      .filter(f => new Date(f.date || f.createdAt).toDateString() === date.toDateString())
      .reduce((sum, f) => sum + (Number(f.quantityLiters) || 0), 0);
    return { name: label, fuel: Math.round(fuelForDay) };
  });

  // ── Dynamic alerts: low fuel + maintenance due + API notifications ──────────
  const generatedAlerts = [];
  const lowFuelThreshold = Number(settings?.lowFuelAlert) || 20;
  vehicles.forEach(v => {
    if (v.fuelLevel !== undefined && v.fuelLevel !== null && Number(v.fuelLevel) <= lowFuelThreshold) {
      generatedAlerts.push({
        title: `Low Fuel Alert: ${v.vehicleNumber || v.licensePlate}`,
        message: `Fuel level is at ${v.fuelLevel}%. Refueling recommended.`,
        type: 'fuel',
        createdAt: new Date().toISOString(),
      });
    }
  });
  const maintDueDays = Number(settings?.maintenanceDueDays) || 7;
  maintenance.forEach(m => {
    if (m.status?.toUpperCase() === 'PENDING') {
      const mDate = new Date(m.scheduledDate || m.requestDate || m.date || m.createdAt);
      const diffDays = Math.ceil((mDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= maintDueDays) {
        generatedAlerts.push({
          title: `Maintenance Due: ${m.vehicle?.vehicleNumber || m.vehicleNumber || 'Unknown'}`,
          message: `${m.serviceType || 'Service'} scheduled in ${diffDays} day(s).`,
          type: 'maintenance',
          createdAt: m.createdAt || new Date().toISOString(),
        });
      }
    }
  });
  const combinedAlerts = [...generatedAlerts, ...alerts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // ── Metric Card Component ──────────────────────────────────────────────────
  const MetricCard = ({ title, value, icon, iconBg, iconColor, trend, trendColor, sub }) => (
    <Card sx={{
      bgcolor: cardBg, borderRadius: 3,
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
      border: `1px solid ${borderColor}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 6px 24px rgba(0,0,0,0.1)' }
    }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ bgcolor: iconBg, color: iconColor, width: 52, height: 52, borderRadius: 2.5 }}>
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: mutedText, fontSize: '0.82rem', fontWeight: 600, mb: 0.5 }}>{title}</Typography>
            {loading
              ? <Skeleton width={80} height={36} />
              : <Typography variant="h4" sx={{ fontWeight: 800, color: textColor, lineHeight: 1.1, mb: 0.5 }}>{value}</Typography>
            }
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUp sx={{ fontSize: '0.9rem', color: trendColor }} />
              <Typography sx={{ fontSize: '0.75rem', color: trendColor, fontWeight: 600 }}>
                {loading ? '—' : trend}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: mainBg, minHeight: '100vh', p: 3, m: -3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: textColor, mb: 0.5 }}>
            Welcome back, {user?.firstName || 'Admin'}! 👋
          </Typography>
          <Typography sx={{ color: mutedText, fontSize: '0.9rem' }}>
            Here's what's happening with your fleet today.
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            startIcon={<CalendarToday fontSize="small" />}
            endIcon={<Typography sx={{ fontSize: '0.65rem', ml: 0.5 }}>▼</Typography>}
            sx={{
              color: textColor, borderColor, bgcolor: cardBg,
              textTransform: 'none', borderRadius: 2, px: 2, fontWeight: 600,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {dateRangeStr}
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} sx={{ mt: 1 }}>
            {[7, 14, 30].map(d => (
              <MenuItem key={d} onClick={() => { setDateRangeDays(d); setAnchorEl(null); }}>Last {d} Days</MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {/* ERROR DEBUG VIEW */}
      {(debugError) && (
        <Card sx={{ bgcolor: '#f8d7da', color: '#721c24', p: 2, mb: 3, borderRadius: 2, border: '1px solid #f5c6cb' }}>
          <Typography variant="subtitle1" fontWeight="bold">API Fetch Error Detected</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', mt: 1 }}>
            {debugError}
          </Typography>
        </Card>
      )}

      {/* ── Metric Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Vehicles"
            value={totalVehicles}
            icon={<LocalShipping />}
            iconBg="#EEF4FF"
            iconColor="#3B5BDB"
            trend="Total in fleet"
            trendColor="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Drivers"
            value={activeDrivers}
            icon={<Person />}
            iconBg="#EBFBEE"
            iconColor="#2F9E44"
            trend="Available / Active"
            trendColor="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Fuel Consumed"
            value={`${totalFuelLitres.toLocaleString()} L`}
            icon={<LocalGasStation />}
            iconBg="#FFF9DB"
            iconColor="#E67700"
            trend="All-time consumption"
            trendColor="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Maintenance Due"
            value={pendingMaintenance}
            icon={<Build />}
            iconBg="#FFF0F6"
            iconColor="#C2255C"
            trend={pendingMaintenance > 0 ? `${pendingMaintenance} pending services` : 'All clear'}
            trendColor={pendingMaintenance > 0 ? '#F44336' : '#4CAF50'}
          />
        </Grid>
      </Grid>

      {/* ── Charts Row ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* Vehicle Status Donut */}
        <Grid item xs={12} md={5}>
          <Card sx={{
            bgcolor: cardBg, borderRadius: 3, height: '100%',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${borderColor}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: textColor, mb: 2.5, fontSize: '1rem' }}>Vehicle Status</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}><Skeleton variant="circular" width={180} height={180} /></Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 220 }}>
                  {/* Donut */}
                  <Box sx={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1, color: '#E0E0E0' }]}
                          innerRadius={65}
                          outerRadius={92}
                          paddingAngle={pieData.length > 0 ? 2 : 0}
                          dataKey="value"
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {(pieData.length > 0 ? pieData : [{ color: '#E0E0E0' }]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: textColor, lineHeight: 1 }}>{totalVehicles}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: mutedText, fontWeight: 600 }}>Total</Typography>
                    </Box>
                  </Box>

                  {/* Legend */}
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                      {pieData.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.85rem', color: textColor, fontWeight: 500 }}>{item.name}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography component="span" sx={{ fontSize: '0.85rem', color: mutedText, mr: 1.5 }}>{item.value}</Typography>
                            <Typography component="span" sx={{ fontSize: '0.82rem', color: mutedText, minWidth: 45, display: 'inline-block' }}>
                              {totalVehicles > 0 ? `(${((item.value / totalVehicles) * 100).toFixed(1)}%)` : '(0%)'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      {pieData.length === 0 && <Typography sx={{ color: mutedText, textAlign: 'center' }}>No vehicle data</Typography>}
                    </Stack>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Fuel Consumption Area Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{
            bgcolor: cardBg, borderRadius: 3, height: '100%',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
            border: `1px solid ${borderColor}`
          }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 700, color: textColor, mb: 2.5, fontSize: '1rem' }}>Fuel Consumption (L)</Typography>
              <Box sx={{ flex: 1, minHeight: 220 }}>
                {loading ? <Skeleton variant="rectangular" height="100%" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2196F3" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: mutedText, fontSize: 12, fontWeight: 500 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: mutedText, fontSize: 12 }}
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        formatter={(v) => [`${v} L`, 'Fuel']}
                      />
                      <Area
                        type="monotone"
                        dataKey="fuel"
                        stroke="#2196F3"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#fuelGrad)"
                        dot={{ r: 4, fill: '#2196F3', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Recent Alerts ── */}
      <Card sx={{
        bgcolor: cardBg, borderRadius: 3,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
        border: `1px solid ${borderColor}`
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderBottom: `1px solid ${borderColor}` }}>
            <Typography sx={{ fontWeight: 700, color: textColor, fontSize: '1rem' }}>Recent Alerts</Typography>
            <Button sx={{ textTransform: 'none', fontWeight: 700, color: '#2196F3', fontSize: '0.85rem' }}>View All</Button>
          </Box>

          <Stack divider={<Divider sx={{ borderColor }} />}>
            {loading ? (
              [0, 1, 2].map(i => (
                <Box key={i} sx={{ p: 2.5, display: 'flex', gap: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="60%" height={20} sx={{ mb: 0.5 }} />
                    <Skeleton width="40%" height={16} />
                  </Box>
                </Box>
              ))
            ) : combinedAlerts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ color: mutedText }}>No recent alerts found.</Typography>
              </Box>
            ) : (
              combinedAlerts.map((alert, idx) => {
                const isMaint = alert.type === 'maintenance' || alert.title?.toLowerCase().includes('maintenance');
                const isFuel = alert.type === 'fuel' || alert.title?.toLowerCase().includes('fuel');
                const iconColor = isMaint ? '#F44336' : isFuel ? '#FF9800' : '#2196F3';
                const iconBg = isMaint ? '#FFEBEE' : isFuel ? '#FFF3E0' : '#E3F2FD';
                const Icon = isMaint ? BuildIcon : isFuel ? LocalGasStation : InfoOutlined;
                const d = new Date(alert.createdAt || Date.now());
                return (
                  <Box key={idx} sx={{
                    p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }
                  }}>
                    <Avatar sx={{ bgcolor: iconBg, color: iconColor, width: 42, height: 42, flexShrink: 0 }}>
                      <Icon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: textColor, fontWeight: 600, fontSize: '0.9rem', mb: 0.2 }}>
                        {alert.title}
                      </Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.82rem' }}>
                        {alert.message}
                      </Typography>
                    </Box>
                    <Typography sx={{ color: '#F44336', fontSize: '0.8rem', fontWeight: 500, flexShrink: 0, textAlign: 'right' }}>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' • '}
                      {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
