import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Avatar, Divider, Skeleton, Button, Stack, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme, Fade, IconButton, Tooltip, Badge
} from '@mui/material';
import { Refresh, Person, LocalPhone, Email, Security, Edit, Lock, VerifiedUser, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { PageHeader } from '../components/Common';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '' });
  
  // Password change state
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ password: '', confirmPassword: '' });
  const [pwdError, setPwdError] = useState('');

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/${user.id}`);
      const raw = res.data;
      setProfile(raw?.data ?? raw);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch profile details.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleOpenEdit = () => {
    setEditForm({ name: profile?.name || '', mobile: profile?.mobile || '' });
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/users/${user.id}`, {
        name: editForm.name,
        mobile: editForm.mobile
      });
      setEditOpen(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
      setEditOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPwd = () => {
    setPwdForm({ password: '', confirmPassword: '' });
    setPwdError('');
    setPwdOpen(true);
  };

  const handleSavePwd = async () => {
    if (pwdForm.password !== pwdForm.confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }
    if (pwdForm.password.length < 8) {
      setPwdError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/users/${user.id}/password`, { password: pwdForm.password });
      setPwdOpen(false);
      alert('Password updated successfully');
    } catch (err) {
      console.error(err);
      setPwdError('Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  const InfoCard = ({ icon, label, value }) => (
    <Box sx={{ 
      p: 2.5, 
      borderRadius: 3, 
      bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      transition: 'all 0.3s ease',
      '&:hover': {
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        transform: 'translateY(-2px)',
        boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.05)',
      }
    }}>
      <Avatar sx={{ 
        bgcolor: isDark ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.1)', 
        color: 'primary.main',
        width: 48,
        height: 48 
      }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Fade in timeout={500}>
      <Box sx={{ pt: 1, px: { xs: 2, md: 4 }, pb: 4, minHeight: '85vh', maxWidth: '1200px', mx: 'auto' }}>
        <PageHeader 
          subicon={<AccountCircle sx={{ color: 'primary.main', fontSize: 32 }} />}
          subactions={
            <Stack direction="row" spacing={1.5}>
              <Tooltip title="Refresh Profile">
                <IconButton onClick={fetchProfile} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button startIcon={<Lock/>} variant="outlined" onClick={handleOpenPwd} sx={{ borderRadius: 2, px: 2 }}>
                Password
              </Button>
              <Button startIcon={<Edit/>} variant="contained" onClick={handleOpenEdit} sx={{ borderRadius: 2, px: 2, boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)' }}>
                Edit Profile
              </Button>
            </Stack>
          }
        />

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Grid container spacing={4} sx={{ mt: 1 }}>
          {/* Left Column: Avatar & Quick Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 4, 
              border: 'none', 
              boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.08)',
              background: isDark ? 'linear-gradient(145deg, #1e1e24 0%, #15151a 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              overflow: 'hidden'
            }}>
              {/* Header Banner */}
              <Box sx={{ 
                height: 120, 
                background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                position: 'relative'
              }} />
              
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0, pb: 4, position: 'relative' }}>
                {loading ? (
                  <Skeleton variant="circular" width={120} height={120} sx={{ mt: -8, mb: 2, border: '4px solid', borderColor: 'background.paper' }} />
                ) : (
                  <Avatar sx={{ 
                    width: 120, 
                    height: 120, 
                    bgcolor: '#1976d2', 
                    mb: 2, 
                    mt: -8,
                    fontSize: '3rem',
                    fontWeight: 800,
                    border: '4px solid',
                    borderColor: 'background.paper',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}>
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                )}

                {loading ? (
                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Skeleton width="60%" height={36} sx={{ mb: 1 }} />
                    <Skeleton width="40%" height={24} sx={{ mb: 3 }} />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                      {profile?.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 0.5 }}>
                      <Badge color="success" variant="dot" sx={{ '& .MuiBadge-badge': { transform: 'scale(1.2)' } }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {profile?.role?.name || 'Staff Member'}
                        </Typography>
                      </Badge>
                    </Stack>
                  </Box>
                )}

                <Divider sx={{ width: '100%', mb: 3, opacity: 0.5 }} />

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    {loading ? <Skeleton width={60} /> : (
                      <Chip
                        icon={profile?.status === 'ACTIVE' ? <VerifiedUser fontSize="small" /> : null}
                        label={profile?.status || 'UNKNOWN'}
                        color={profile?.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 700, px: 1 }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Joined</Typography>
                    {loading ? <Skeleton width={80} /> : (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Detailed Info */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              borderRadius: 4, 
              border: '1px solid', 
              borderColor: 'divider', 
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)',
              bgcolor: 'background.paper',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Contact Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Manage your personal and contact details. Keep this information up to date.
                </Typography>

                {loading ? (
                  <Grid container spacing={3}>
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <Grid item xs={12} sm={6} key={idx}>
                        <Skeleton variant="rounded" height={88} sx={{ borderRadius: 3 }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <InfoCard icon={<Person />} label="Full Name" value={profile?.name} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoCard icon={<Email />} label="Email Address" value={profile?.email} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoCard icon={<LocalPhone />} label="Mobile Number" value={profile?.mobile} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoCard icon={<Security />} label="System Role" value={profile?.role?.name || 'User'} />
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Edit Profile Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3, backgroundImage: 'none' } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Edit Profile</Typography>
            <Typography variant="body2" color="text.secondary">Update your personal details</Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Full Name"
                fullWidth
                variant="outlined"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
              <TextField
                label="Mobile Number"
                fullWidth
                variant="outlined"
                value={editForm.mobile}
                onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditOpen(false)} disabled={submitting} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleSaveProfile} variant="contained" disabled={submitting} sx={{ borderRadius: 2, px: 3 }}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={pwdOpen} onClose={() => setPwdOpen(false)} fullWidth maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 3, backgroundImage: 'none' } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Change Password</Typography>
            <Typography variant="body2" color="text.secondary">Ensure your account stays secure</Typography>
          </DialogTitle>
          <DialogContent>
            {pwdError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{pwdError}</Alert>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <TextField
                label="New Password"
                type="password"
                fullWidth
                variant="outlined"
                value={pwdForm.password}
                onChange={(e) => setPwdForm({...pwdForm, password: e.target.value})}
              />
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                variant="outlined"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({...pwdForm, confirmPassword: e.target.value})}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setPwdOpen(false)} disabled={submitting} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleSavePwd} variant="contained" disabled={submitting} sx={{ borderRadius: 2, px: 3 }}>
              {submitting ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
}
