import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Stack,
  Avatar, useTheme, Chip, Button
} from '@mui/material';
import {
  Route, AccountBalanceWallet, DirectionsCar, NotificationsActive,
  TrendingUp, LocalShipping, ArrowForward, AccessTime, CheckCircle
} from '@mui/icons-material';
import { driverPortalService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function extractItems(res) {
  const raw = res?.data;
  const d = raw?.data ?? raw;
  return d?.items ?? (Array.isArray(d) ? d : []);
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [advances, setAdvances] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, vRes, aRes] = await Promise.allSettled([
        driverPortalService.getTrips({ limit: 10 }).catch(() => ({ data: [] })),
        driverPortalService.getVehicles().catch(() => ({ data: [] })),
        driverPortalService.getAdvances().catch(() => ({ data: [] }))
      ]);

      const gotTrips = tRes.status === 'fulfilled' ? extractItems(tRes.value) : [];
      const gotVehicles = vRes.status === 'fulfilled' ? extractItems(vRes.value) : [];
      const gotAdvances = aRes.status === 'fulfilled' ? extractItems(aRes.value) : [];

      setTrips(gotTrips);
      setVehicles(gotVehicles);
      setAdvances(gotAdvances);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived metrics
  const activeTrips = trips.filter(t => t.status === 'ON_TRIP' || t.status === 'ACTIVE').length;
  const totalAdvances = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const pendingAdvances = advances.filter(a => a.status === 'SUBMITTED' || a.status === 'PENDING').length;
  
  const currentTrip = trips.find(t => t.status === 'ON_TRIP' || t.status === 'ACTIVE') || trips[0];

  // Colors
  const mainBg = isDark ? '#0F172A' : '#F1F5F9';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)';
  const glassEffect = {
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const name = user?.name || user?.fullName || 'Driver';

  const StatCard = ({ title, value, icon, gradient, delay }) => (
    <Card sx={{
      bgcolor: cardBg, ...glassEffect, borderRadius: 3,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
      boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.7)' : '0 10px 30px rgba(0,0,0,0.25)',
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `fadeInUp 0.6s ease-out ${delay}s both`,
      '&:hover': { transform: 'translateY(-4px)', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.9)' : '0 20px 50px rgba(0,0,0,0.35)' },
      '@keyframes fadeInUp': {
        '0%': { opacity: 0, transform: 'translateY(15px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' }
      }
    }}>
      <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: gradient, opacity: 0.1, filter: 'blur(15px)' }} />
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, background: gradient, color: '#fff', display: 'flex', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
            {React.cloneElement(icon, { sx: { fontSize: 20 } })}
          </Box>
        </Box>
        <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.2 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: mainBg, minHeight: '100vh', p: { xs: 2, md: 4 }, m: -3 }}>
      {/* Header Profile Section */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, letterSpacing: -0.5 }}>
              {getGreeting()}, <Box component="span" sx={{ color: '#1976D2' }}>{name}</Box>!
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Here is your daily operational summary.
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<Route />} sx={{ borderRadius: 3, textTransform: 'none', px: 3, py: 1, fontWeight: 700, boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)' }} onClick={() => navigate('/fleet/driver-trips')}>
            My Trips
          </Button>
        </Stack>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Trips" value={activeTrips} icon={<Route />} gradient="linear-gradient(135deg, #1976D2, #42A5F5)" delay={0.1} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Assigned Vehicles" value={vehicles.length} icon={<DirectionsCar />} gradient="linear-gradient(135deg, #9C27B0, #BA68C8)" delay={0.2} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Advances" value={`₹${totalAdvances.toLocaleString()}`} icon={<AccountBalanceWallet />} gradient="linear-gradient(135deg, #2E7D32, #4CAF50)" delay={0.3} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Action Required" value={pendingAdvances} icon={<NotificationsActive />} gradient="linear-gradient(135deg, #EF6C00, #FF9800)" delay={0.4} />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Current Trip Focus */}
        <Grid item xs={12} md={7} lg={8}>
          <Card sx={{ bgcolor: cardBg, ...glassEffect, borderRadius: 4, height: '100%', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="primary" /> Current Assignment
                </Typography>
                {currentTrip && <Chip label={currentTrip.status} color={currentTrip.status === 'ON_TRIP' ? 'success' : 'primary'} sx={{ fontWeight: 700 }} />}
              </Box>

              {currentTrip ? (
                <Box>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={5}>
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem', mb: 0.5, textTransform: 'uppercase' }}>Origin</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{currentTrip.origin || currentTrip.startLocation || 'Unknown'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <ArrowForward color="disabled" sx={{ fontSize: 32 }} />
                    </Grid>
                    <Grid item xs={12} sm={5} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem', mb: 0.5, textTransform: 'uppercase' }}>Destination</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{currentTrip.destination || currentTrip.endLocation || 'Unknown'}</Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ p: 3, borderRadius: 3, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(25,118,210,0.04)', border: '1px dashed', borderColor: 'divider' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>TRIP NUMBER</Typography>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{currentTrip.tripNumber || currentTrip.id?.substring(0, 8)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>VEHICLE ID</Typography>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{currentTrip.vehicleId || 'Assigned'}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>DISTANCE</Typography>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{currentTrip.distance || '0 km'}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>EST. ARRIVAL</Typography>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>-</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                  <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>You are all caught up!</Typography>
                  <Typography sx={{ color: 'text.secondary' }}>No active trips assigned at the moment.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Links / Status */}
        <Grid item xs={12} md={5} lg={4}>
          <Card sx={{ bgcolor: cardBg, ...glassEffect, borderRadius: 4, height: '100%', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="primary" /> Recent Activity
              </Typography>
              
              <Stack spacing={3}>
                {trips.slice(0, 4).map((t, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, borderRadius: 3, transition: 'all 0.2s', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' } }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: t.status === 'ON_TRIP' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(25, 118, 210, 0.1)', color: t.status === 'ON_TRIP' ? '#4CAF50' : '#1976D2' }}>
                      <LocalShipping />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>{t.origin || 'Start'} to {t.destination || 'End'}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>{t.tripNumber || t.id?.substring(0,8)} • {t.status}</Typography>
                    </Box>
                  </Box>
                ))}
                {trips.length === 0 && (
                  <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No recent activity to show.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
