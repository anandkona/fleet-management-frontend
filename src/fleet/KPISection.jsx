import React from 'react';
import { Box, Card, Typography } from '@mui/material';

export default function KPISection({ summary }) {
  const cards = [
    { title: 'Total Vehicles', value: summary.totalVehicles.value, trend: summary.totalVehicles.trend, isPositive: summary.totalVehicles.isPositive, color: '#4ade80' },
    { title: 'Active Now', value: summary.activeNow.value, trend: summary.activeNow.trend, isPositive: summary.activeNow.isPositive, color: '#3182ce', numberColor: '#3182ce' },
    { title: 'Maintenance Due', value: summary.maintenanceDue.value, trend: summary.maintenanceDue.trend, isPositive: summary.maintenanceDue.isPositive, color: '#fb923c' },
    { title: 'Monthly Expense', value: summary.monthlyExpense.value, trend: summary.monthlyExpense.trend, isPositive: summary.monthlyExpense.isPositive, color: '#ef4444' },
    { title: 'Fuel Efficiency', value: summary.fuelEfficiency.value, unit: summary.fuelEfficiency.unit, trend: summary.fuelEfficiency.trend, isPositive: summary.fuelEfficiency.isPositive, color: '#4ade80' }
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: '16px' }}>
      {cards.map((card, idx) => (
        <Card key={idx} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '105px', bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: 600 }}>{card.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '2rem', lineHeight: 1.1, color: card.numberColor || '#fff' }}>{card.value}</Typography>
            {card.unit && <Typography variant="body2" sx={{ ml: 1, color: 'text.primary', fontWeight: 600 }}>{card.unit}</Typography>}
          </Box>
          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600, color: card.isPositive ? '#4ade80' : card.title === 'Monthly Expense' ? '#f87171' : card.title === 'Maintenance Due' ? '#fb923c' : '#8a8a93', mt: 0.5 }}>
            {card.trend}
          </Typography>
        </Card>
      ))}
    </Box>
  );
}
