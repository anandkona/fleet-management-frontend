import React from 'react';
import { Box, Typography } from '@mui/material';
import { BuildCircle as RepairsIcon } from '@mui/icons-material';

export default function RepairsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <RepairsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Repairs</Typography>
      </Box>
      <Typography color="text.secondary">Track and manage vehicle repairs.</Typography>
    </Box>
  );
}