import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingState({ message }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
      <CircularProgress size={32} sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">{message || 'Loading...'}</Typography>
    </Box>
  );
}
