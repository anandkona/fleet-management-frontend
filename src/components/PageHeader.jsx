import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

export function PageHeader({ eyebrow, title, description }) {
  return (
    <Stack direction="column" mb={3}>
      {eyebrow && (
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7C6FF7', mb: 0.5 }}>
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A2332' }}>{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary" mt={0.5}>{description}</Typography>}
    </Stack>
  );
}
