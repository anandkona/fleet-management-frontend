import React from 'react';
import { Box, Typography } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

export default function SettingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Settings</Typography>
      </Box>
      <Typography color="text.secondary">Manage your system settings and preferences.</Typography>
    </Box>
  );
}