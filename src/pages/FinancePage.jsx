import React from 'react';
import { Box, Typography } from '@mui/material';
import { AccountBalance as FinanceIcon } from '@mui/icons-material';

export default function FinancePage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <FinanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Finance</Typography>
      </Box>
      <Typography color="text.secondary">Manage financial data and reports.</Typography>
    </Box>
  );
}