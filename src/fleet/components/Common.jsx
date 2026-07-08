import React from 'react';
import {
  Chip, Card, CardContent, Typography, Box, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Stack, LinearProgress, Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

const STATUS_MAP = {
  active: { color: '#00C2A8', bg: '#E6FAF8', label: 'Active' },
  inactive: { color: '#6B7A8D', bg: '#F2F4F7', label: 'Inactive' },
  available: { color: '#00C2A8', bg: '#E6FAF8', label: 'Available' },
  on_trip: { color: '#7C6FF7', bg: '#EEF0FF', label: 'On Trip' },
  under_maintenance: { color: '#F5A623', bg: '#FEF6E7', label: 'Under Maintenance' },
  under_repair: { color: '#FF8C42', bg: '#FFF3E6', label: 'Under Repair' },
  sold: { color: '#6B7A8D', bg: '#F2F4F7', label: 'Sold' },
  accident: { color: '#FF5D5D', bg: '#FFEEEE', label: 'Accident' },
  on_leave: { color: '#F5A623', bg: '#FEF6E7', label: 'On Leave' },
  suspended: { color: '#FF5D5D', bg: '#FFEEEE', label: 'Suspended' },
  assigned: { color: '#7C6FF7', bg: '#EEF0FF', label: 'Assigned' },
  damaged: { color: '#FF5D5D', bg: '#FFEEEE', label: 'Damaged' },
  lost: { color: '#FF5D5D', bg: '#FFEEEE', label: 'Lost' },
  retired: { color: '#6B7A8D', bg: '#F2F4F7', label: 'Retired' },
  pending: { color: '#F5A623', bg: '#FEF6E7', label: 'Pending' },
  draft: { color: '#6B7A8D', bg: '#F2F4F7', label: 'Draft' },
  scheduled: { color: '#7C6FF7', bg: '#EEF0FF', label: 'Scheduled' },
  started: { color: '#00C2A8', bg: '#E6FAF8', label: 'Started' },
  completed: { color: '#00C2A8', bg: '#E6FAF8', label: 'Completed' },
  cancelled: { color: '#FF5D5D', bg: '#FFEEEE', label: 'Cancelled' },
  overdue: { color: '#FF5D5D', bg: '#FFEEEE', label: 'Overdue' },
  'on trip': { color: '#7C6FF7', bg: '#EEF0FF', label: 'On Trip' },
  'under maintenance': { color: '#F5A623', bg: '#FEF6E7', label: 'Under Maintenance' },
  'under repair': { color: '#FF8C42', bg: '#FFF3E6', label: 'Under Repair' },
  'on leave': { color: '#F5A623', bg: '#FEF6E7', label: 'On Leave' },
};

export function StatusChip({ status }) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? { color: '#6B7A8D', bg: '#F2F4F7', label: status ?? '—' };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ 
        color: s.color, 
        bgcolor: s.bg, 
        fontWeight: 700, 
        fontSize: '0.7rem', 
        height: 24, 
        borderRadius: '6px',
        border: `1px solid ${alpha(s.color, 0.3)}`,
        letterSpacing: '0.03em',
        textTransform: 'uppercase'
      }}
    />
  );
}

export function StatCard({ icon, label, value, sub, subColor, color = '#00C2A8', iconBg, iconColor, loading }) {
  const bg = iconBg || alpha(color, 0.05);
  const mainColor = iconColor || color;
  return (
    <Card 
      sx={{ 
        height: '100%', 
        bgcolor: 'background.paper', 
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        borderRadius: '16px',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
          borderColor: alpha(mainColor, 0.3)
        }
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
            {label}
          </Typography>
          <Box sx={{ 
            color: mainColor, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(mainColor, 0.1),
            borderRadius: '10px',
            width: 32,
            height: 32
          }}>
            {icon}
          </Box>
        </Box>
        <Box sx={{ mt: 0.5 }}>
          {loading ? <Skeleton width={80} height={30} /> : (
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
              {value ?? '—'}
            </Typography>
          )}
        </Box>
        {sub && <Typography variant="caption" sx={{ color: subColor || mainColor, fontWeight: 700, mt: 0.5 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, confirmColor = 'error' }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
      <DialogTitle sx={{ fontWeight: 600, color: 'text.primary' }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'text.primary' }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ color: 'text.primary' }}>Cancel</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading}>
          {loading ? 'Processing...' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function PageHeader({ action }) {
  if (!action) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
      {action}
    </Box>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      {icon && <Box sx={{ fontSize: 64, mb: 2, color: '#D0D5DD' }}>{icon}</Box>}
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: 'text.primary', mb: 3 }}>{description}</Typography>
      {action}
    </Box>
  );
}

export function FuelBar({ value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct < 20 ? '#FF5D5D' : pct < 50 ? '#F5A623' : '#00C2A8';
  return (
    <Box sx={{ minWidth: 80 }}>
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" sx={{ fontWeight: 600, color }}>{Math.round(pct)}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: color }, bgcolor: alpha(color, 0.15) }} />
    </Box>
  );
}
