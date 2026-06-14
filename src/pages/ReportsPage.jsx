import React from 'react';
import { Box, Typography } from '@mui/material';
import { Assessment as ReportsIcon } from '@mui/icons-material';

export default function ReportsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ReportsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Reports</Typography>
      </Box>
      <Typography color="text.secondary">View and generate fleet reports.</Typography>
    </Box>
  );
}