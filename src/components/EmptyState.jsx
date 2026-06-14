import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export function EmptyState({ title, message, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A2332', mb: 1 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>{message}</Typography>
      {action}
    </Box>
  );
}
