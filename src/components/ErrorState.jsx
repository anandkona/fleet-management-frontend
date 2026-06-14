import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export function ErrorState({ message, onRetry }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#FF5D5D', mb: 1 }}>Something went wrong</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>{message}</Typography>
      {onRetry && (
        <Button variant="contained" onClick={onRetry}>Retry</Button>
      )}
    </Box>
  );
}
