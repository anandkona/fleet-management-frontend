import React from 'react';
import { Box, Typography } from '@mui/material';
import { Receipt as ExpenseIcon } from '@mui/icons-material';

export default function ExpensePage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ExpenseIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Expense</Typography>
      </Box>
      <Typography color="text.secondary">Track and manage fleet expenses.</Typography>
    </Box>
  );
}