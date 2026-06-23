import React from 'react';
import {
  Chip, Card, CardContent, Typography, Box, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Stack, LinearProgress, Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PALETTE } from '../theme';

const STATUS_MAP = {
  active:               { color: '#00C2A8', bg: '#E6FAF8', label: 'Active' },
  inactive:             { color: '#6B7A8D', bg: '#F2F4F7', label: 'Inactive' },
  available:            { color: '#00C2A8', bg: '#E6FAF8', label: 'Available' },
  on_trip:              { color: '#7C6FF7', bg: '#EEF0FF', label: 'On Trip' },
  under_maintenance:    { color: '#F5A623', bg: '#FEF6E7', label: 'Under Maintenance' },
  under_repair:         { color: '#FF8C42', bg: '#FFF3E6', label: 'Under Repair' },
  sold:                 { color: '#6B7A8D', bg: '#F2F4F7', label: 'Sold' },
  accident:             { color: '#FF5D5D', bg: '#FFEEEE', label: 'Accident' },
  on_leave:             { color: '#F5A623', bg: '#FEF6E7', label: 'On Leave' },
  suspended:            { color: '#FF5D5D', bg: '#FFEEEE', label: 'Suspended' },
  assigned:             { color: '#7C6FF7', bg: '#EEF0FF', label: 'Assigned' },
  damaged:              { color: '#FF5D5D', bg: '#FFEEEE', label: 'Damaged' },
  lost:                 { color: '#FF5D5D', bg: '#FFEEEE', label: 'Lost' },
  retired:              { color: '#6B7A8D', bg: '#F2F4F7', label: 'Retired' },
  pending:              { color: '#F5A623', bg: '#FEF6E7', label: 'Pending' },
  draft:                { color: '#6B7A8D', bg: '#F2F4F7', label: 'Draft' },
  scheduled:            { color: '#7C6FF7', bg: '#EEF0FF', label: 'Scheduled' },
  started:              { color: '#00C2A8', bg: '#E6FAF8', label: 'Started' },
  completed:            { color: '#00C2A8', bg: '#E6FAF8', label: 'Completed' },
  cancelled:            { color: '#FF5D5D', bg: '#FFEEEE', label: 'Cancelled' },
  overdue:              { color: '#FF5D5D', bg: '#FFEEEE', label: 'Overdue' },
};

export function StatusChip({ status }) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? { color: '#6B7A8D', bg: '#F2F4F7', label: status ?? '—' };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ color: s.color, bgcolor: s.bg, fontWeight: 600, fontSize: '0.75rem', height: 26, border: `1px solid ${alpha(s.color, 0.15)}` }}
    />
  );
}

export function StatCard({ icon, label, value, sub, color = PALETTE.teal, loading }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.1), color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </Typography>
          {loading ? <Skeleton width={60} height={32} /> : (
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              {value ?? '—'}
            </Typography>
          )}
          {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, confirmColor = 'error' }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading}>
          {loading ? 'Processing...' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function PageHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" mb={3} gap={2}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.2} mb={0.5}>
          {Icon && <Icon sx={{ color: PALETTE.teal, fontSize: 26 }} />}
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>{title}</Typography>
        </Stack>
        {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Box sx={{ fontSize: 64, mb: 2, color: '#D0D5DD' }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>{description}</Typography>
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
      <LinearProgress variant="determinate" value={pct} sx={{ '& .MuiLinearProgress-bar': { bgcolor: color }, bgcolor: alpha(color, 0.15) }} />
    </Box>
  );
}
