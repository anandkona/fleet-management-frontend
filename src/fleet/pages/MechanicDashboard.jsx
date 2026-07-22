import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Stack,
  Avatar, useTheme, Button
} from '@mui/material';
import {
  BuildCircle, Build, CheckCircle, Assignment, 
  ArrowForward, PendingActions
} from '@mui/icons-material';
import { repairService, maintenanceService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function extractItems(res) {
  const raw = res?.data;
  const d = raw?.data ?? raw;
  return d?.items ?? (Array.isArray(d) ? d : []);
}

export default function MechanicDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [repairs, setRepairs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Typically backend filters by logged in user if it's a mechanic portal endpoint, 
      // but for now we fetch and filter locally just in case.
      const [rRes, mRes] = await Promise.allSettled([
        repairService.getAll({ limit: 100 }).catch(() => ({ data: [] })),
        maintenanceService.getAll({ limit: 100 }).catch(() => ({ data: [] }))
      ]);

      let gotRepairs = rRes.status === 'fulfilled' ? extractItems(rRes.value) : [];
      let gotMaintenance = mRes.status === 'fulfilled' ? extractItems(mRes.value) : [];

      setRepairs(gotRepairs);
      setMaintenance(gotMaintenance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived metrics
  const activeRepairs = repairs.filter(r => r.status === 'IN_PROGRESS' || r.status === 'PENDING').length;
  const completedRepairs = repairs.filter(r => r.status === 'COMPLETED').length;
  const pendingMaintenance = maintenance.filter(m => m.status === 'SCHEDULED' || m.status === 'PENDING').length;

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

  const name = user?.name || user?.fullName || 'Mechanic';

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
        <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#fff' : '#0F172A', mb: 0.5, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flex: 1, bgcolor: mainBg, minHeight: '100vh', p: { xs: 2, sm: 3, md: 4 }, pb: { xs: 10, md: 4 } }}>
      
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, mb: 0.5 }}>
              {getGreeting()},
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#fff' : '#0F172A', letterSpacing: '-0.02em' }}>
              {name}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Active Repairs" value={activeRepairs} icon={<BuildCircle />} gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" delay={0.1} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Pending Maintenance" value={pendingMaintenance} icon={<PendingActions />} gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" delay={0.2} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Completed Jobs" value={completedRepairs} icon={<CheckCircle />} gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)" delay={0.3} />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: isDark ? '#fff' : '#0F172A' }}>Quick Actions</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/mechanic-repairs')}
            sx={{
              p: 2, borderRadius: 3, justifyContent: 'flex-start',
              bgcolor: isDark ? 'rgba(30,41,59,0.5)' : '#fff',
              color: isDark ? '#fff' : '#0F172A',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: 'none',
              '&:hover': { bgcolor: isDark ? 'rgba(30,41,59,0.8)' : '#f8fafc', borderColor: 'primary.main' }
            }}
            startIcon={<BuildCircle sx={{ color: 'primary.main' }} />}
            endIcon={<ArrowForward sx={{ ml: 'auto', opacity: 0.5 }} />}
          >
            My Repairs
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/mechanic-maintenance')}
            sx={{
              p: 2, borderRadius: 3, justifyContent: 'flex-start',
              bgcolor: isDark ? 'rgba(30,41,59,0.5)' : '#fff',
              color: isDark ? '#fff' : '#0F172A',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: 'none',
              '&:hover': { bgcolor: isDark ? 'rgba(30,41,59,0.8)' : '#f8fafc', borderColor: 'warning.main' }
            }}
            startIcon={<Build sx={{ color: 'warning.main' }} />}
            endIcon={<ArrowForward sx={{ ml: 'auto', opacity: 0.5 }} />}
          >
            My Maintenance
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
