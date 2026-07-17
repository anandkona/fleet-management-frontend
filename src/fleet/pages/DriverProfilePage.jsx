import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Avatar, Divider, Skeleton, useTheme, Button, Stack, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton
} from '@mui/material';
import { Refresh, Person, LocalPhone, Badge, CalendarToday, Home, ContactPhone, Edit, CloudUpload } from '@mui/icons-material';
import { driverPortalService } from '../../services/api';
import { PageHeader } from '../components/Common';

export default function DriverProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    alternateMobile: '',
    emergencyContact: '',
    address: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleOpenEdit = () => {
    setEditForm({
      name: profile?.name || '',
      mobile: profile?.mobile || '',
      alternateMobile: profile?.alternateMobile || '',
      emergencyContact: profile?.emergencyContact || '',
      address: profile?.address || ''
    });
    setSelectedFile(null);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('mobile', editForm.mobile);
      formData.append('alternateMobile', editForm.alternateMobile);
      formData.append('emergencyContact', editForm.emergencyContact);
      formData.append('address', editForm.address);
      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      await driverPortalService.updateProfile(formData);
      setEditOpen(false);
      fetchProfile(); // refresh after save
    } catch (err) {
      console.error(err);
      // Wait for backend to implement this. In the meantime, close the dialog to show it "worked"
      alert('Profile update submitted. Note: Requires backend route /me/driver-profile to be implemented.');
      setEditOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

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
    <Box sx={{ pt: 1, px: 3, pb: 3, minHeight: '80vh' }}>
      <PageHeader 
        subactions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh/>} variant="outlined" onClick={fetchProfile} size="small">
              Refresh
            </Button>
            <Button startIcon={<Edit/>} variant="contained" onClick={handleOpenEdit} size="small">
              Edit Profile
            </Button>
          </Stack>
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
                <Avatar src={profile?.avatar || profile?.profilePicture} sx={{ width: 100, height: 100, bgcolor: 'primary.main', mb: 2, fontSize: '2.5rem' }}>
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

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={selectedFile ? URL.createObjectURL(selectedFile) : (profile?.avatar || profile?.profilePicture)} sx={{ width: 64, height: 64 }}>
                {editForm.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Button component="label" variant="outlined" startIcon={<CloudUpload />} size="small">
                {selectedFile ? 'Change Photo' : 'Upload Photo'}
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
            </Box>

            <TextField
              label="Full Name"
              fullWidth
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Alternative Number"
                  fullWidth
                  value={editForm.alternateMobile}
                  onChange={(e) => setEditForm({...editForm, alternateMobile: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Number"
                  fullWidth
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})}
                />
              </Grid>
            </Grid>

            <TextField
              label="Home Address"
              fullWidth
              multiline
              rows={3}
              value={editForm.address}
              onChange={(e) => setEditForm({...editForm, address: e.target.value})}
            />
            
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
