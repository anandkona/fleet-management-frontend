import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function StatCard({ label, value, sub, subColor = 'text.secondary', icon, iconBg = '#E6F1FB', iconColor = '#185FA5' }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" sx={{ color: subColor, mt: 0.5, display: 'block', fontSize: '0.72rem' }}>
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
