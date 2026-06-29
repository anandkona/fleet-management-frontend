import React from 'react';
import { Box, Card, Typography, LinearProgress } from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';

export default function ExpenseBreakdown({ expenses }) {
  const formatRupee = (num) => `₹${num.toLocaleString('en-IN')}`;

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 2 }}>
        <PaidIcon sx={{ color: 'text.primary' }} />
        <Typography variant="body1" sx={{ fontWeight: 700 }}>Expense breakdown — June 2026</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', mb: 3 }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: '8px', textAlign: 'center', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.65rem', fontWeight: 700 }}>Total MTD</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'text.primary', fontSize: '1.15rem' }}>{expenses.mtd}</Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: '8px', textAlign: 'center', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.65rem', fontWeight: 700 }}>Budget</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#d97706', fontSize: '1.15rem' }}>{expenses.budget}</Typography>
        </Box>
        <Box sx={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', p: '8px', textAlign: 'center', height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: '#dc2626', fontSize: '0.65rem', fontWeight: 700 }}>Over by</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#b91c1c', fontSize: '1.15rem' }}>{expenses.overBy}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mb: 2 }}>
        {expenses.categories.map((cat) => (
          <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.82rem', fontWeight: 500, width: '100px' }}>{cat.name}</Typography>
            <Box sx={{ flex: 1, mx: 2 }}>
              <LinearProgress variant="determinate" value={cat.percentage} sx={{ height: '8px', borderRadius: '4px', backgroundColor: '#232329', '& .MuiLinearProgress-bar': { backgroundColor: cat.color } }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.82rem', fontWeight: 700, textAlign: 'right', width: '90px' }}>{formatRupee(cat.amount)}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mt: 'auto', pt: 1 }}>
        <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
        <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.78rem', fontWeight: 500 }}>{expenses.forecast}</Typography>
      </Box>
    </Card>
  );
}
