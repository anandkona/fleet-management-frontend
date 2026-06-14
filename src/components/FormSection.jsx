import React from 'react';
import { Box, Typography } from '@mui/material';

export function FormSection({ title, description, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      {title && <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1A2332', mb: 0.5 }}>{title}</Typography>}
      {description && <Typography variant="body2" color="text.secondary" mb={2}>{description}</Typography>}
      {children}
    </Box>
  );
}
