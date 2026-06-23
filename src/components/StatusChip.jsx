import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const STATUS_CONFIG = {
  Completed:    { color: 'success', icon: <CheckCircleOutlineIcon sx={{ fontSize: 13 }} />, sx: { bgcolor: '#E1F5EE', color: '#0F6E56', border: 'none' } },
  Complete:     { color: 'success', icon: <CheckCircleOutlineIcon sx={{ fontSize: 13 }} />, sx: { bgcolor: '#E1F5EE', color: '#0F6E56', border: 'none' } },
  'In Progress':{ color: 'warning', icon: <HourglassTopIcon sx={{ fontSize: 13 }} />,       sx: { bgcolor: '#FAEEDA', color: '#854F0B', border: 'none' } },
  Pending:      { color: 'default', icon: <PendingOutlinedIcon sx={{ fontSize: 13 }} />,    sx: { bgcolor: '#F1EFE8', color: '#5F5E5A', border: 'none' } },
  Cancelled:    { color: 'error',   icon: <CancelOutlinedIcon sx={{ fontSize: 13 }} />,     sx: { bgcolor: '#FCEBEB', color: '#A32D2D', border: 'none' } },
  Overdue:      { color: 'error',   icon: <WarningAmberIcon sx={{ fontSize: 13 }} />,       sx: { bgcolor: '#FCEBEB', color: '#A32D2D', border: 'none' } },
  Scheduled:    { color: 'info',    icon: <EventAvailableIcon sx={{ fontSize: 13 }} />,     sx: { bgcolor: '#E6F1FB', color: '#185FA5', border: 'none' } },
};

export default function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || { icon: null, sx: {} };
  return (
    <Chip
      size="small"
      label={status}
      icon={cfg.icon}
      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, ...cfg.sx }}
    />
  );
}
