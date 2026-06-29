import React from 'react';
import { Box, Card, Typography, List, ListItem, ListItemIcon } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SensorsIcon from '@mui/icons-material/Sensors';

export default function AIIntelligence({ insights }) {
  const getIcon = (type) => {
    switch (type) {
      case 'alert': return <WarningAmberIcon sx={{ color: '#ef4444' }} />;
      case 'cost': return <ArrowUpwardIcon sx={{ color: '#f59e0b' }} />;
      case 'saving': return <CheckCircleOutlinedIcon sx={{ color: '#10b981' }} />;
      case 'inventory': return <AutorenewIcon sx={{ color: '#f59e0b' }} />;
      default: return <WarningAmberIcon sx={{ color: '#3b82f6' }} />;
    }
  };

  const getBackground = (severity) => severity === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 'transparent';
  const getTextColor = (severity) => severity === 'danger' ? '#fecaca' : '#e4e4e7';

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SensorsIcon sx={{ color: '#1976d2' }} />
          <Typography variant="body1" sx={{ fontWeight: 700 }}>AI Intelligence</Typography>
          <Chip label={6} size="small" sx={{ ml: 0.5, backgroundColor: '#1976d2', color: '#fff', borderRadius: '12px', height: '22px', fontSize: '0.7rem', fontWeight: 600 }} />
        </Box>
        <Box sx={{ border: '1px solid #1976d2', borderRadius: '4px', px: '8px', py: '2px', backgroundColor: '#1976d2' }}>
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.72rem' }}>Live</Typography>
        </Box>
      </Box>
      <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {insights.map((insight) => (
          <ListItem key={insight.id} sx={{ display: 'flex', alignItems: 'flex-start', p: '12px', borderRadius: '8px', backgroundColor: getBackground(insight.severity), border: insight.severity === 'danger' ? '1px dashed rgba(239, 68, 68, 0.2)' : '1px solid transparent' }}>
            <ListItemIcon sx={{ minWidth: '32px', mt: '2px' }}>{getIcon(insight.type)}</ListItemIcon>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: getTextColor(insight.severity), lineHeight: 1.4 }}>{insight.message}</Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.75rem', fontWeight: 500, mt: 0.5 }}>{insight.subtext}</Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}
