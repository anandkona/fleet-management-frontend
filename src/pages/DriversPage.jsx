import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Grid, Card, CardContent,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip,
  Snackbar, Alert, Chip, Avatar, Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CloseIcon from '@mui/icons-material/Close';

import StatCard from '../components/StatCard';
import { MOCK_DRIVERS, VEHICLES } from '../services/mockData';
import { useThemeSettings } from '../context/ThemeContext';

const STATUS_COLORS = {
  'Available': { bg: '#dcfce7', color: '#166534' },
  'On Trip': { bg: '#dbeafe', color: '#1e40af' },
  'On Leave': { bg: '#fef3c7', color: '#92400e' },
  'Suspended': { bg: '#fee2e2', color: '#991b1b' },
  'Inactive': { bg: '#f3f4f6', color: '#6b7280' },
};

const EMPTY = { name: '', mobile: '', licenseNumber: '', licenseExpiry: '', experience: '', status: 'Available', vehicleNumber: '' };

export default function DriversPage() {
  const { settings } = useThemeSettings();
  const isDark = settings.mode === 'dark';
  const [rows, setRows] = useState(MOCK_DRIVERS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const stats = useMemo(() => {
    const available = rows.filter(r => r.status === 'Available').length;
    const onTrip = rows.filter(r => r.status === 'On Trip').length;
    const onLeave = rows.filter(r => r.status === 'On Leave').length;
    return { total: rows.length, available, onTrip, onLeave };
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.name.toLowerCase().includes(q) || r.mobile.includes(q) || r.licenseNumber.toLowerCase().includes(q);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchQ && matchStatus;
  }), [rows, search, filterStatus]);

  const openAdd = () => { setEditRecord(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (r) => { setEditRecord(r); setForm({ ...EMPTY, ...r }); setErrors({}); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditRecord(null); };

  const handleSave = () => {
    if (!form.name || !form.mobile) { setErrors({ name: !form.name ? 'Required' : '', mobile: !form.mobile ? 'Required' : '' }); return; }
    if (editRecord) {
      setRows(prev => prev.map(r => r.id === editRecord.id ? { ...form, id: editRecord.id } : r));
      toast('Driver updated');
    } else {
      setRows(prev => [{ ...form, id: `D-${rows.length + 1}` }, ...prev]);
      toast('Driver added');
    }
    closeForm();
  };

  const handleDelete = () => {
    setRows(prev => prev.filter(r => r.id !== deleteId));
    setDeleteId(null);
    toast('Driver deleted');
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const columns = [
    {
      field: 'name', headerName: 'Driver Name', flex: 1.4, minWidth: 200,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: `${settings.primaryColor}20`, color: settings.primaryColor, fontSize: '0.85rem', fontWeight: 700 }}>
            {(row.name || '?')[0].toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{row.name}</Typography>
        </Stack>
      ),
    },
    {
      field: 'mobile', headerName: 'Mobile', flex: 1, minWidth: 130,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{value}</Typography>,
    },
    {
      field: 'vehicleNumber', headerName: 'Vehicle Number', flex: 1.1, minWidth: 140,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <DirectionsCarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{row.vehicleNumber || 'Unassigned'}</Typography>
        </Stack>
      ),
    },
    {
      field: 'experience', headerName: 'Experience', flex: 0.8, minWidth: 100,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value ? `${value} yrs` : '—'}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', flex: 0.9, minWidth: 120,
      renderCell: ({ value }) => {
        const colors = STATUS_COLORS[value] || STATUS_COLORS['Available'];
        return <Chip label={value} size="small" sx={{ bgcolor: isDark ? `${colors.color}33` : colors.bg, color: isDark ? colors.bg : colors.color, fontWeight: 600, fontSize: '0.7rem', height: 24 }} />;
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View"><IconButton size="small" onClick={() => setViewRecord(row)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteOutlineIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
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
            <PersonIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography variant="h5">Drivers</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Manage your drivers and their assignments.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 2 }}>
          Add driver
        </Button>
      </Stack>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Drivers" value={stats.total} sub="In system" subColor="info.main"
            icon={<PersonIcon sx={{ fontSize: 20 }} />} iconBg="primary.light" iconColor="primary.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Available" value={stats.available} sub="Ready" subColor="success.dark"
            icon={<BadgeIcon sx={{ fontSize: 20 }} />} iconBg="success.light" iconColor="success.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="On Trip" value={stats.onTrip} sub="Active" subColor="info.main"
            icon={<PersonIcon sx={{ fontSize: 20 }} />} iconBg="info.light" iconColor="info.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="On Leave" value={stats.onLeave} sub="Absent" subColor="warning.dark"
            icon={<BadgeIcon sx={{ fontSize: 20 }} />} iconBg="warning.light" iconColor="warning.main" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card elevation={0} sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              placeholder="Search drivers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
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
                <PersonIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" fontSize="0.875rem">No drivers found</Typography>
              </Stack>
            ),
          }}
        />
      </Card>

      {/* Add/Edit Dialog */}
      {formOpen && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 550, maxHeight: '90vh', overflow: 'auto', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{editRecord ? 'Edit driver' : 'Add driver'}</Typography>
              <IconButton size="small" onClick={closeForm}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={!!errors.name} helperText={errors.name} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Mobile Number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} error={!!errors.mobile} helperText={errors.mobile} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={VEHICLES.map(v => v.label)}
                    value={form.vehicleNumber}
                    onChange={(e, newValue) => setForm({ ...form, vehicleNumber: newValue || '' })}
                    renderInput={(params) => (
                      <TextField {...params} label="Vehicle Number" placeholder="Search vehicle…" />
                    )}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="License Expiry" type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Experience (years)" type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                <PersonIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Driver Details</Typography>
              </Stack>
              <IconButton size="small" onClick={() => setViewRecord(null)}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                {[
                  ['Name', viewRecord.name],
                  ['Mobile', viewRecord.mobile],
                  ['License', viewRecord.licenseNumber],
                  ['Vehicle Number', viewRecord.vehicleNumber || 'Unassigned'],
                  ['License Expiry', viewRecord.licenseExpiry ? new Date(viewRecord.licenseExpiry).toLocaleDateString() : '—'],
                  ['Experience', viewRecord.experience ? `${viewRecord.experience} years` : '—'],
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

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Delete Driver</Typography>
              <IconButton size="small" onClick={() => setDeleteId(null)}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">Are you sure you want to delete this driver? This action cannot be undone.</Typography>
            </Box>
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={() => setDeleteId(null)} variant="outlined" size="small">Cancel</Button>
              <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete</Button>
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
