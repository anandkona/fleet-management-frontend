import React from 'react';
import { Chip } from '@mui/material';

const STATUS_MAP = {
  ACTIVE: { color: '#00C2A8', bg: '#E6FAF8', label: 'Active' },
  INACTIVE: { color: '#6B7A8D', bg: '#F2F4F7', label: 'Inactive' },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { color: '#6B7A8D', bg: '#F2F4F7', label: status || '—' };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ color: s.color, bgcolor: s.bg, fontWeight: 600, fontSize: '0.75rem', height: 26 }}
    />
  );
}
