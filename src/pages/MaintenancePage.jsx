import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Grid, Card, CardContent,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip,
  Snackbar, Alert, Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';

import StatCard from '../components/StatCard';
import StatusChip from '../components/StatusChip';
import { PageHeader } from '../components/Common';
import MaintenanceFormDialog from '../components/MaintenanceFormDialog';
import MaintenanceViewDialog from '../components/MaintenanceViewDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { MOCK_MAINTENANCE, MAINTENANCE_TYPES, MAINTENANCE_STATUSES } from '../services/mockData';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function MaintenancePage() {
  const [rows, setRows] = useState(MOCK_MAINTENANCE);
  const [search, setSearch] = useState('');
  const [filterStatus, setStatus] = useState('');
  const [filterType, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // ── Stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    const overdue = rows.filter(r => r.status === 'Overdue');
    const scheduled = rows.filter(r => r.status === 'Scheduled');
    const completed = rows.filter(r => r.status === 'Completed');
    const total = rows.length;
    const healthPct = total ? Math.round(((completed.length + scheduled.length) / total) * 100) : 0;
    return { overdue, scheduled, completed: completed.length, healthPct };
  }, [rows]);

  // ── Filtered rows ────────────────────────────────────
  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.vehicle.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    const matchStart = !startDate || r.nextDue >= startDate;
    const matchEnd = !endDate || r.nextDue <= endDate;
    return matchQ && (!filterStatus || r.status === filterStatus) && (!filterType || r.type === filterType) && matchStart && matchEnd;
  }), [rows, search, filterStatus, filterType, startDate, endDate]);

  // ── CRUD ─────────────────────────────────────────────
  const handleSave = (data) => {
    if (editRecord) {
      setRows(prev => prev.map(r => r.id === editRecord.id ? { ...data, id: editRecord.id } : r));
      toast('Maintenance record updated');
    } else {
      const newId = `M-${200 + rows.length + 1}`;
      setRows(prev => [{ ...data, id: newId }, ...prev]);
      toast('Maintenance scheduled');
    }
    setFormOpen(false);
    setEditRecord(null);
  };

  const handleDelete = () => {
    setRows(prev => prev.filter(r => r.id !== deleteId));
    setDeleteId(null);
    toast('Record deleted', 'error');
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const exportToExcel = () => {
    const data = filtered.map(r => ({
      'Vehicle': r.vehicle,
      'Model': r.model,
      'Service Type': r.type,
      'Last Done': r.lastDone,
      'Next Due': r.nextDue,
      'Odometer': r.odometer,
      'Next Odometer': r.nextOdometer,
      'Status': r.status,
      'Notes': r.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maintenance');
    XLSX.writeFile(wb, 'maintenance.xlsx');
  };

  // ── Columns ──────────────────────────────────────────
  const columns = [
    {
      field: 'vehicle', headerName: 'Vehicle', flex: 1.4, minWidth: 180,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 17 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>{row.vehicle}</Typography>
          </Box>
        </Stack>
      ),
    },
    { field: 'type', headerName: 'Service Type', flex: 1, minWidth: 150, renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value}</Typography> },
    {
      field: 'lastDone', headerName: 'Last Done', flex: 0.85, minWidth: 120,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{fmtDate(value)}</Typography>,
    },
    {
      field: 'nextDue', headerName: 'Next Due', flex: 0.85, minWidth: 120,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: row.status === 'Overdue' ? 'error.main' : 'text.primary' }}>
          {fmtDate(row.nextDue)}
        </Typography>
      ),
    },
    {
      field: 'odometer', headerName: 'Odometer', flex: 0.85, minWidth: 120,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{Number(value).toLocaleString()} km</Typography>,
    },
    {
      field: 'status', headerName: 'Status', flex: 0.85, minWidth: 120,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View"><IconButton size="small" onClick={() => setViewRecord(row)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditRecord(row); setFormOpen(true); }}>
              <EditOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
              <DeleteOutlineIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Maintenance"
        subtitle="Schedule and track preventive maintenance for your fleet."
        icon={SettingsIcon}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditRecord(null); setFormOpen(true); }}
            sx={{ borderRadius: 2 }}
          >
            Schedule service
          </Button>
        }
      />

      {/* ── Stats ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Scheduled" value={stats.scheduled.length} sub="Next 30 days" subColor="info.main"
            icon={<EventAvailableIcon sx={{ fontSize: 20 }} />} iconBg="#E6F1FB" iconColor="#185FA5" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Overdue" value={stats.overdue.length} sub="Needs immediate attention" subColor="error.main"
            icon={<WarningAmberIcon sx={{ fontSize: 20 }} />} iconBg="#FCEBEB" iconColor="#A32D2D" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Completed" value={stats.completed} sub="This year" subColor="success.dark"
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 20 }} />} iconBg="#E1F5EE" iconColor="#0F6E56" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Fleet health" value={`${stats.healthPct}%`} sub="↑ 3% from last month" subColor="success.dark"
            icon={<SpeedIcon sx={{ fontSize: 20 }} />} iconBg="#E1F5EE" iconColor="#0F6E56" />
        </Grid>
      </Grid>

      {/* ── Alert Panels ── */}
      <Grid container spacing={2} mb={3}>

        {/* Overdue */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: '12px !important', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WarningAmberIcon sx={{ color: '#E24B4A', fontSize: 18 }} />
                  <Typography variant="h6" fontSize="0.875rem" sx={{ color: 'text.primary' }}>Overdue services</Typography>
                </Stack>
                <Chip label={`${stats.overdue.length} overdue`} size="small" sx={{ bgcolor: '#FCEBEB', color: '#A32D2D', fontWeight: 600, fontSize: '0.7rem', border: 'none', height: 22 }} />
              </Stack>
              <List dense disablePadding sx={{ flex: 1 }}>
                {stats.overdue.map((item, i) => (
                  <React.Fragment key={item.id}>
                    {i > 0 && <Divider />}
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A32D2D' }}>
                          <BuildCircleOutlinedIcon sx={{ fontSize: 17 }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{item.type}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{item.vehicle} · {item.model}</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: '#A32D2D', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Due {fmtDate(item.nextDue)}
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
                {stats.overdue.length === 0 && (
                  <Stack alignItems="center" py={2}>
                    <CheckCircleOutlineIcon sx={{ color: '#1D9E75', fontSize: 28, mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">No overdue services</Typography>
                  </Stack>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: '12px !important', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EventAvailableIcon sx={{ color: '#1a6fd4', fontSize: 18 }} />
                  <Typography variant="h6" fontSize="0.875rem" sx={{ color: 'text.primary' }}>Upcoming this week</Typography>
                </Stack>
                <Chip label={`${stats.scheduled.length} scheduled`} size="small" sx={{ bgcolor: '#E6F1FB', color: '#185FA5', fontWeight: 600, fontSize: '0.7rem', border: 'none', height: 22 }} />
              </Stack>
              <List dense disablePadding sx={{ flex: 1 }}>
                {stats.scheduled.slice(0, 4).map((item, i) => (
                  <React.Fragment key={item.id}>
                    {i > 0 && <Divider />}
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5' }}>
                          <BuildCircleOutlinedIcon sx={{ fontSize: 17 }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{item.type}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{item.vehicle} · {item.model}</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: '#185FA5', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Due {fmtDate(item.nextDue)}
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
                {stats.scheduled.length === 0 && (
                  <Stack alignItems="center" py={2}>
                    <Typography variant="body2" color="text.secondary">No upcoming services</Typography>
                  </Stack>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* ── Filters ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              placeholder="Search vehicle, service type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField select label="Status" value={filterStatus} onChange={(e) => setStatus(e.target.value)} size="small" sx={{ minWidth: 140 }}>
              <MenuItem value="">All statuses</MenuItem>
              {MAINTENANCE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Service type" value={filterType} onChange={(e) => setType(e.target.value)} size="small" sx={{ minWidth: 160 }}>
              <MenuItem value="">All types</MenuItem>
              {MAINTENANCE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField
              label="Start date" type="date" size="small" sx={{ minWidth: 150, '& input[type="date"]': { color: '#9e9e9e' }, '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'grayscale(100%) opacity(0.5)' } }}
              value={startDate} onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End date" type="date" size="small" sx={{ minWidth: 150, '& input[type="date"]': { color: '#9e9e9e' }, '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'grayscale(100%) opacity(0.5)' } }}
              value={endDate} onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Tooltip title="Export to Excel">
              <IconButton size="small" onClick={exportToExcel} sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                <FileDownloadIcon sx={{ fontSize: 18, color: '#1acda3' }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Data Grid ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            border: 'none', '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' }, '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',  
            }
          }}
          getRowClassName={({ row }) => row.status === 'Overdue' ? 'overdue-row' : ''}
          slots={{
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} py={6}>
                <SettingsIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" fontSize="0.875rem">No maintenance records found</Typography>
              </Stack>
            ),
          }}
        />
      </Card>

      {/* ── Dialogs ── */}
      <MaintenanceFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditRecord(null); }} onSave={handleSave} record={editRecord} />

      <MaintenanceViewDialog open={!!viewRecord} onClose={() => setViewRecord(null)} record={viewRecord} />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete maintenance record"
        message="This action cannot be undone. Are you sure you want to delete this maintenance record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

    </Box>
  );
}
