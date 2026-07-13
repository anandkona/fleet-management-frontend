import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Avatar, Divider, Skeleton, useTheme, Button, Stack, Alert, Chip
} from '@mui/material';
import { Refresh, Person, LocalPhone, Badge, CalendarToday, Home, ContactPhone } from '@mui/icons-material';
import { driverPortalService } from '../../services/api';
import { PageHeader } from '../components/Common';

export default function DriverProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await driverPortalService.getProfile();
      const raw = res.data;
      setProfile(raw?.data ?? raw);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch profile details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const InfoRow = ({ icon, label, value }) => (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
      <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {value || '—'}
        </Typography>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ p: 3, minHeight: '80vh' }}>
      <PageHeader
        title="My Profile"
        subtitle="View your personal information, mobile contact, and driving credentials."
        actions={
          <Button startIcon={<Refresh />} variant="outlined" onClick={fetchProfile} size="small">
            Refresh
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: isDark ? '#1E1E1E' : '#FFF', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              {loading ? (
                <Skeleton variant="circular" width={100} height={100} sx={{ mb: 2 }} />
              ) : (
                <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', mb: 2, fontSize: '2.5rem' }}>
                  {profile?.name?.charAt(0).toUpperCase() || 'D'}
                </Avatar>
              )}
              {loading ? (
                <>
                  <Skeleton width={150} height={30} sx={{ mb: 1 }} />
                  <Skeleton width={100} height={20} />
                </>
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {profile?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Professional Driver
                  </Typography>
                  <Chip
                    label={profile?.status || 'ACTIVE'}
                    color="success"
                    size="small"
                    sx={{ mt: 2, fontWeight: 700 }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: isDark ? '#1E1E1E' : '#FFF', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                Driving & Contact Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <Box key={idx} sx={{ py: 1.5 }}>
                    <Skeleton width={100} height={15} />
                    <Skeleton width={200} height={25} />
                  </Box>
                ))
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<Person />} label="Full Name" value={profile?.name} />
                    <InfoRow icon={<LocalPhone />} label="Mobile Number" value={profile?.mobile} />
                    <InfoRow icon={<ContactPhone />} label="Alternate Mobile" value={profile?.alternateMobile} />
                    <InfoRow icon={<Home />} label="Address" value={profile?.address} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<Badge />} label="Driving License Number" value={profile?.licenseNumber} />
                    <InfoRow
                      icon={<CalendarToday />}
                      label="License Expiry"
                      value={profile?.licenseExpiry ? new Date(profile.licenseExpiry).toLocaleDateString() : ''}
                    />
                    <InfoRow icon={<ContactPhone />} label="Emergency Contact" value={profile?.emergencyContact} />
                    <InfoRow
                      icon={<CalendarToday />}
                      label="Experience Years"
                      value={profile?.experienceYears ? `${profile.experienceYears} Years` : ''}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
