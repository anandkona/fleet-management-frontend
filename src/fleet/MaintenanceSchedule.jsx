import React from 'react';
import { Box, Card, Typography, List, ListItem } from '@mui/material';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import OpacityIcon from '@mui/icons-material/Opacity';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';

const circleIconBg = { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default function MaintenanceSchedule({ tasks }) {
  const getIcon = (name) => {
    if (name.includes('Oil')) return <Box sx={{ ...circleIconBg, backgroundColor: '#fef3c7' }}><OpacityIcon sx={{ color: '#d97706', fontSize: '18px' }} /></Box>;
    if (name.includes('Tyre') || name.includes('Tire')) return <Box sx={{ ...circleIconBg, backgroundColor: '#fee2e2' }}><TripOriginIcon sx={{ color: '#dc2626', fontSize: '18px' }} /></Box>;
    if (name.includes('Battery')) return <Box sx={{ ...circleIconBg, backgroundColor: '#dcfce7' }}><BatteryAlertIcon sx={{ color: '#15803d', fontSize: '18px' }} /></Box>;
    return <Box sx={{ ...circleIconBg, backgroundColor: '#e0f2fe' }}><BuildCircleIcon sx={{ color: '#0369a1', fontSize: '18px' }} /></Box>;
  };

  const getStatusColor = (status) => {
    if (status === 'Overdue') return '#ef4444';
    if (status.includes('days')) return '#fb923c';
    return '#8a8a93';
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BuildCircleIcon sx={{ color: 'text.primary' }} />
          <Typography variant="body1" sx={{ fontWeight: 700 }}>Maintenance schedule</Typography>
        </Box>
        <Box sx={{ border: '1px solid #1e3a8a', borderRadius: '4px', px: '8px', py: '2px', backgroundColor: 'rgba(30, 58, 138, 0.2)' }}>
          <Typography variant="body2" sx={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.72rem' }}>Predictive AI</Typography>
        </Box>
      </Box>
      <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tasks.map((task) => (
          <ListItem key={task.id} sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {getIcon(task.name)}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                  {task.name} — <span style={{ color: 'text.primary' }}>{task.vehicle}</span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.78rem', mt: 0.2 }}>{task.details}</Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: getStatusColor(task.status), fontSize: '0.8rem', textAlign: 'right' }}>{task.status}</Typography>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}
