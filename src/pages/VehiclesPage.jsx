import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Grid, Card, CardContent,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip,
  Snackbar, Alert, Chip, Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';

import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { MOCK_VEHICLES, VEHICLE_TYPES, FUEL_TYPES } from '../services/mockData';
import { useThemeSettings } from '../context/ThemeContext';

const STATUS_COLORS = {
  'Available': { bg: '#dcfce7', color: '#166534' },
  'On Trip': { bg: '#dbeafe', color: '#1e40af' },
  'Under Maintenance': { bg: '#fef3c7', color: '#92400e' },
  'Under Repair': { bg: '#fee2e2', color: '#991b1b' },
  'Inactive': { bg: '#f3f4f6', color: '#6b7280' },
};

const EMPTY = { vehicleNumber: '', brand: '', vehicleType: 'Truck', fuelType: 'Diesel', status: 'Available', odometer: '', driver: '' };

export default function VehiclesPage() {
  const { settings } = useThemeSettings();
  const isDark = settings.mode === 'dark';
  const [rows, setRows] = useState(MOCK_VEHICLES);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const stats = useMemo(() => {
    const available = rows.filter(r => r.status === 'Available').length;
    const onTrip = rows.filter(r => r.status === 'On Trip').length;
    const maintenance = rows.filter(r => r.status === 'Under Maintenance' || r.status === 'Under Repair').length;
    return { total: rows.length, available, onTrip, maintenance };
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.vehicleNumber.toLowerCase().includes(q) || r.brand.toLowerCase().includes(q) || r.model.toLowerCase().includes(q);
    const matchType = !filterType || r.vehicleType === filterType;
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchQ && matchType && matchStatus;
  }), [rows, search, filterType, filterStatus]);

  const openAdd = () => { setEditRecord(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (r) => { setEditRecord(r); setForm({ ...EMPTY, ...r }); setErrors({}); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditRecord(null); };

  const handleSave = () => {
    if (!form.vehicleNumber) { setErrors({ vehicleNumber: 'Required' }); return; }
    if (editRecord) {
      setRows(prev => prev.map(r => r.id === editRecord.id ? { ...form, id: editRecord.id } : r));
      toast('Vehicle updated');
    } else {
      setRows(prev => [{ ...form, id: `V-${rows.length + 1}` }, ...prev]);
      toast('Vehicle added');
    }
    closeForm();
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const columns = [
    {
      field: 'vehicleNumber', headerName: 'Vehicle Number', flex: 1.2, minWidth: 160,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${settings.primaryColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: settings.primaryColor, flexShrink: 0 }}>
            <DirectionsCarIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{row.vehicleNumber}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'brand', headerName: 'Brand', flex: 0.9, minWidth: 120,
      renderCell: ({ value }) => <Typography variant="body2">{value || '—'}</Typography>,
    },
    {
      field: 'vehicleType', headerName: 'Type', flex: 0.8, minWidth: 100,
      renderCell: ({ value }) => <Chip label={value} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />,
    },
    {
      field: 'fuelType', headerName: 'Fuel', flex: 0.75, minWidth: 90,
      renderCell: ({ value }) => <Typography variant="body2">{value}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', flex: 1, minWidth: 140,
      renderCell: ({ value }) => {
        const colors = STATUS_COLORS[value] || STATUS_COLORS['Available'];
        return <Chip label={value} size="small" sx={{ bgcolor: isDark ? `${colors.color}33` : colors.bg, color: isDark ? colors.bg : colors.color, fontWeight: 600, fontSize: '0.7rem', height: 24 }} />;
      },
    },
    {
      field: 'driver', headerName: 'Driver', flex: 1, minWidth: 130,
      renderCell: ({ value }) => <Typography variant="body2" color="text.secondary">{value || 'Unassigned'}</Typography>,
    },
    {
      field: 'actions', headerName: 'Actions', width: 90, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View"><IconButton size="small" onClick={() => setViewRecord(row)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>

      {/* Page Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.2} mb={0.5}>
            <DirectionsCarIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography variant="h5">Vehicles</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Manage your fleet vehicles and track their status.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 2 }}>
          Add vehicle
        </Button>
      </Stack>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Vehicles" value={stats.total} sub="In fleet" subColor="info.main"
            icon={<DirectionsCarIcon sx={{ fontSize: 20 }} />} iconBg="primary.light" iconColor="primary.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Available" value={stats.available} sub="Ready" subColor="success.dark"
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 20 }} />} iconBg="success.light" iconColor="success.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="On Trip" value={stats.onTrip} sub="Active" subColor="info.main"
            icon={<LocalGasStationIcon sx={{ fontSize: 20 }} />} iconBg="info.light" iconColor="info.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Maintenance" value={stats.maintenance} sub="Needs attention" subColor="warning.dark"
            icon={<WarningAmberIcon sx={{ fontSize: 20 }} />} iconBg="warning.light" iconColor="warning.main" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card elevation={0} sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              placeholder="Search vehicles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField select label="Type" value={filterType} onChange={(e) => setFilterType(e.target.value)} size="small" sx={{ minWidth: 130 }}>
              <MenuItem value="">All types</MenuItem>
              {VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: 150 }}>
              <MenuItem value="">All statuses</MenuItem>
              {Object.keys(STATUS_COLORS).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card elevation={0}>
        <DataGrid
          rows={filtered}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
          }}
          slots={{
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} py={6}>
                <DirectionsCarIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" fontSize="0.875rem">No vehicles found</Typography>
              </Stack>
            ),
          }}
        />
      </Card>

      {/* Add/Edit Dialog */}
      {formOpen && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 650, maxHeight: '90vh', overflow: 'auto', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{editRecord ? 'Edit vehicle' : 'Add vehicle'}</Typography>
              <IconButton size="small" onClick={closeForm}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Vehicle Number" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} error={!!errors.vehicleNumber} helperText={errors.vehicleNumber} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Vehicle Type" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                    {VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth label="Fuel Type" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                    {FUEL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.keys(STATUS_COLORS).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </Box>
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={closeForm} variant="outlined" size="small">Cancel</Button>
              <Button onClick={handleSave} variant="contained" size="small">{editRecord ? 'Update' : 'Add'}</Button>
            </Stack>
          </Card>
        </Box>
      )}

      {/* View Dialog */}
      {viewRecord && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 500, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DirectionsCarIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Vehicle Details</Typography>
              </Stack>
              <IconButton size="small" onClick={() => setViewRecord(null)}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                {[
                  ['Vehicle Number', viewRecord.vehicleNumber],
                  ['Brand', viewRecord.brand],
                  ['Type', viewRecord.vehicleType],
                  ['Fuel Type', viewRecord.fuelType],
                  ['Odometer', viewRecord.odometer ? `${Number(viewRecord.odometer).toLocaleString()} km` : '—'],
                  ['Driver', viewRecord.driver || 'Unassigned'],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>{value || '—'}</Typography>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={viewRecord.status} size="small" sx={{ bgcolor: isDark ? `${STATUS_COLORS[viewRecord.status]?.color}33` : STATUS_COLORS[viewRecord.status]?.bg, color: isDark ? STATUS_COLORS[viewRecord.status]?.bg : STATUS_COLORS[viewRecord.status]?.color, fontWeight: 600 }} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={() => setViewRecord(null)} variant="outlined" size="small">Close</Button>
            </Stack>
          </Card>
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

    </Box>
  );
}
