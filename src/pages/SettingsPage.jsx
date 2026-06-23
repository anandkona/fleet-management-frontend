import React from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Switch, FormControlLabel,
  Grid, Button, Chip, Divider, TextField, MenuItem, Tooltip,
  Snackbar, Alert,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import SecurityIcon from '@mui/icons-material/Security';
import BackupIcon from '@mui/icons-material/Backup';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useThemeSettings, THEME_COLORS } from '../context/ThemeContext';

const FONT_SIZES = [
  { label: 'Small', value: 13 },
  { label: 'Default', value: 14 },
  { label: 'Large', value: 15 },
  { label: 'Extra Large', value: 16 },
];

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Telugu', value: 'te' },
];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useThemeSettings();
  const [snack, setSnack] = React.useState({ open: false, msg: '', severity: 'success' });

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleSave = () => {
    toast('Settings saved successfully');
  };

  const handleReset = () => {
    resetSettings();
    toast('Settings reset to defaults');
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>

      {/* Page Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.2} mb={0.5}>
            <SettingsIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography variant="h5">Settings</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Customize your fleet management experience.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RestartAltIcon />} variant="outlined" size="small" onClick={handleReset}>Reset defaults</Button>
          <Button startIcon={<SaveIcon />} variant="contained" size="small" onClick={handleSave}>Save changes</Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>

        {/* Appearance */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <PaletteIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h6" fontSize="0.95rem">Appearance</Typography>
              </Stack>

              {/* Theme Mode */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>Theme Mode</Typography>
                <Stack direction="row" spacing={1.5}>
                  <Card
                    elevation={0}
                    onClick={() => updateSettings({ mode: 'light' })}
                    sx={{
                      flex: 1, cursor: 'pointer', textAlign: 'center', p: 2,
                      border: settings.mode === 'light' ? `2px solid ${settings.primaryColor}` : '2px solid #e0e0e0',
                      borderRadius: 2, transition: 'all 0.2s',
                    }}
                  >
                    <LightModeIcon sx={{ fontSize: 28, color: settings.mode === 'light' ? settings.primaryColor : '#999', mb: 0.5 }} />
                    <Typography variant="body2" fontWeight={600} fontSize="0.8rem">Light</Typography>
                  </Card>
                  <Card
                    elevation={0}
                    onClick={() => updateSettings({ mode: 'dark' })}
                    sx={{
                      flex: 1, cursor: 'pointer', textAlign: 'center', p: 2,
                      border: settings.mode === 'dark' ? `2px solid ${settings.primaryColor}` : '2px solid #e0e0e0',
                      borderRadius: 2, transition: 'all 0.2s',
                    }}
                  >
                    <DarkModeIcon sx={{ fontSize: 28, color: settings.mode === 'dark' ? settings.primaryColor : '#999', mb: 0.5 }} />
                    <Typography variant="body2" fontWeight={600} fontSize="0.8rem">Dark</Typography>
                  </Card>
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Primary Color */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>Primary Color</Typography>
                <Grid container spacing={1}>
                  {THEME_COLORS.map((c) => (
                    <Grid item key={c.value}>
                      <Tooltip title={c.name}>
                        <Box
                          onClick={() => updateSettings({ primaryColor: c.value })}
                          sx={{
                            width: 40, height: 40, borderRadius: '50%', bgcolor: c.value,
                            cursor: 'pointer',
                            border: settings.primaryColor === c.value ? '3px solid currentColor' : '3px solid transparent',
                            borderColor: settings.primaryColor === c.value ? (settings.mode === 'dark' ? c.dark : c.value) : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'scale(1.15)', boxShadow: `0 4px 12px ${c.value}60` },
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {settings.primaryColor === c.value && <CheckCircleIcon sx={{ color: '#fff', fontSize: 20 }} />}
                        </Box>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Font Size */}
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Font Size</Typography>
                <Stack direction="row" spacing={1}>
                  {FONT_SIZES.map((f) => (
                    <Chip
                      key={f.value}
                      label={f.label}
                      onClick={() => updateSettings({ fontSize: f.value })}
                      variant={settings.fontSize === f.value ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: 600,
                        bgcolor: settings.fontSize === f.value ? settings.primaryColor : 'transparent',
                        color: settings.fontSize === f.value ? '#fff' : '#666',
                        borderColor: settings.fontSize === f.value ? settings.primaryColor : '#e0e0e0',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <FormatSizeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h6" fontSize="0.95rem">Sidebar</Typography>
              </Stack>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkSidebar}
                      onChange={(e) => updateSettings({ darkSidebar: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: settings.primaryColor } }}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={500}>Dark sidebar</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showLabels}
                      onChange={(e) => updateSettings({ showLabels: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: settings.primaryColor } }}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={500}>Show navigation labels</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.collapsed}
                      onChange={(e) => updateSettings({ collapsed: e.target.checked })}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: settings.primaryColor } }}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={500}>Collapsed sidebar by default</Typography>}
                />
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              {/* Language */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <LanguageIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>Language</Typography>
                </Stack>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                >
                  {LANGUAGES.map((l) => (
                    <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <NotificationsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h6" fontSize="0.95rem">Notifications</Typography>
              </Stack>

              <Typography variant="body2" fontWeight={600} mb={1}>Channels</Typography>
              <Stack spacing={1} mb={2.5}>
                {[
                  { key: 'email', label: 'Email notifications' },
                  { key: 'push', label: 'Push notifications' },
                  { key: 'sms', label: 'SMS notifications' },
                ].map((item) => (
                  <FormControlLabel
                    key={item.key}
                    control={
                      <Switch
                        checked={settings.notifications[item.key]}
                        onChange={(e) => updateSettings({ notifications: { ...settings.notifications, [item.key]: e.target.checked } })}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: settings.primaryColor } }}
                      />
                    }
                    label={<Typography variant="body2" fontWeight={500}>{item.label}</Typography>}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" fontWeight={600} mb={1}>Categories</Typography>
              <Stack spacing={1}>
                {[
                  { key: 'maintenance', label: 'Maintenance alerts' },
                  { key: 'fuel', label: 'Fuel log reminders' },
                  { key: 'repairs', label: 'Repair updates' },
                ].map((item) => (
                  <FormControlLabel
                    key={item.key}
                    control={
                      <Switch
                        checked={settings.notifications[item.key]}
                        onChange={(e) => updateSettings({ notifications: { ...settings.notifications, [item.key]: e.target.checked } })}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: settings.primaryColor } }}
                      />
                    }
                    label={<Typography variant="body2" fontWeight={500}>{item.label}</Typography>}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Security & Data */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardContent>
              <Stack direction="row" alignItems={1} spacing={1} mb={2}>
                <SecurityIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h6" fontSize="0.95rem">Security & Data</Typography>
              </Stack>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>Session Timeout</Typography>
                  <Typography variant="caption" color="text.secondary" mb={1} display="block">Automatically logout after inactivity</Typography>
                  <TextField select fullWidth size="small" defaultValue="30">
                    <MenuItem value="15">15 minutes</MenuItem>
                    <MenuItem value="30">30 minutes</MenuItem>
                    <MenuItem value="60">1 hour</MenuItem>
                    <MenuItem value="120">2 hours</MenuItem>
                  </TextField>
                </Box>

                <Divider />

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <BackupIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600}>Data Backup</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Last backup: June 20, 2026</Typography>
                  <Button variant="outlined" size="small" startIcon={<BackupIcon />}>Create backup</Button>
                </Box>

                <Divider />

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <DeleteOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600} color="error">Danger Zone</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Permanently delete all data and reset the system.</Typography>
                  <Button variant="outlined" color="error" size="small" startIcon={<DeleteOutlineIcon />}>Factory reset</Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

    </Box>
  );
}
