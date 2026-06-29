import React from 'react';
import { Box, Card, Typography, LinearProgress } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';

export default function AssetInventory({ inventory }) {
  const getProgressColor = (name) => name === 'VANS' ? '#f59e0b' : '#10b981';
  const getTextColor = (name) => name === 'VANS' ? '#fb923c' : '#4ade80';

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Inventory2Icon sx={{ color: 'text.primary' }} />
          <Typography variant="body1" sx={{ fontWeight: 700 }}>Asset inventory</Typography>
        </Box>
        <Box sx={{ border: '1px solid #1e3a8a', borderRadius: '4px', px: '8px', py: '2px', backgroundColor: 'rgba(30, 58, 138, 0.2)' }}>
          <Typography variant="body2" sx={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.72rem' }}>AI</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', mb: 2.5 }}>
        {inventory.categories.map((cat) => (
          <Box key={cat.name}>
            <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.68rem', fontWeight: 700 }}>{cat.name}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem', color: 'text.primary' }}>{cat.count}</Typography>
              <Typography variant="body2" sx={{ color: getTextColor(cat.name), fontSize: '0.72rem', fontWeight: 600 }}>{cat.available} available</Typography>
              <Box sx={{ width: '100%', mt: 0.5 }}>
                <LinearProgress variant="determinate" value={cat.percentage} sx={{ height: '4px', borderRadius: '2px', backgroundColor: '#2e2e38', '& .MuiLinearProgress-bar': { backgroundColor: getProgressColor(cat.name) } }} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mt: 'auto' }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: 600 }}>Spare parts</Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: 700 }}>{inventory.sparePartsCount} SKUs</Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: 600 }}>Tools</Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: 700 }}>{inventory.toolsCount} items</Typography>
        </Box>
      </Box>
    </Card>
  );
}
