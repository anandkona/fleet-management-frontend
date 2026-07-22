import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Divider, Switch,
  TextField, MenuItem, Button, Stack, useTheme
} from '@mui/material';
import { Settings as SettingsIcon, DarkMode, LightMode, Save } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../components/Common';
import { useSettings } from '../../contexts/SettingsContext';

export default function SettingsPage() {
  const { settings, updateSettings, setThemeMode, themeMode } = useSettings();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field) => (e) => {
    setLocalSettings(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    enqueueSnackbar('Settings updated successfully', { variant: 'success' });
  };

  const isDark = themeMode === 'dark';

  return (
    <Box>
      <PageHeader 
        subicon={<SettingsIcon/>}
      />

      <Grid container spacing={3}>
        {/* Appearance Settings */}
        <Grid item xs={12} md={5} lg={4}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                Appearance
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', mb: 3 }}>
                Customize the visual style of the application.
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                <Box
                  onClick={() => setThemeMode('light')}
                  sx={{
                    flex: 1,
                    p: 2,
                    border: '2px solid',
                    borderColor: !isDark ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    bgcolor: !isDark ? 'primary.main' + '11' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <LightMode sx={{ color: !isDark ? 'primary.main' : 'text.secondary', fontSize: 40, mb: 1 }} />
                  <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Light</Typography>
                </Box>
                <Box
                  onClick={() => setThemeMode('dark')}
                  sx={{
                    flex: 1,
                    p: 2,
                    border: '2px solid',
                    borderColor: isDark ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    bgcolor: isDark ? 'primary.main' + '11' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <DarkMode sx={{ color: isDark ? 'primary.main' : 'text.secondary', fontSize: 40, mb: 1 }} />
                  <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>Dark</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* General Settings */}
        <Grid item xs={12} md={7} lg={8}>
          <Card elevation={0} sx={{ height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                General Configuration
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={localSettings.companyName}
                    onChange={handleChange('companyName')}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Currency"
                    value={localSettings.currency}
                    onChange={handleChange('currency')}
                    variant="outlined"
                    size="small"
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="INR">INR (₹)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Distance Unit"
                    value={localSettings.distanceUnit}
                    onChange={handleChange('distanceUnit')}
                    variant="outlined"
                    size="small"
                  >
                    <MenuItem value="km">Kilometers (km)</MenuItem>
                    <MenuItem value="miles">Miles (mi)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Timezone"
                    value={localSettings.timezone}
                    onChange={handleChange('timezone')}
                    variant="outlined"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={localSettings.email || ''}
                    onChange={handleChange('email')}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={localSettings.phone || ''}
                    onChange={handleChange('phone')}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={localSettings.address || ''}
                    onChange={handleChange('address')}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'divider', overflow: 'hidden' }}>
                      <img src={localSettings.logo || "/fleet-logo.jpg"} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Button variant="outlined" size="small" component="label" sx={{ textTransform: 'none' }}>
                      Change Logo
                      <input 
                        type="file" 
                        hidden 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const newLogo = event.target.result;
                              handleChange('logo')({ target: { value: newLogo } });
                              updateSettings({ logo: newLogo }); // Apply instantly
                              enqueueSnackbar('Logo updated successfully!', { variant: 'success' });
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }} 
                      />
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Low Fuel Alert Threshold (%)"
                    value={localSettings.lowFuelAlert}
                    onChange={handleChange('lowFuelAlert')}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maintenance Due Warning (Days)"
                    value={localSettings.maintenanceDueDays}
                    onChange={handleChange('maintenanceDueDays')}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<Save />}
                  onClick={handleSave}
                  sx={{ px: 4 }}
                >
                  Save Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
