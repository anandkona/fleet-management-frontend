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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import OpacityIcon from '@mui/icons-material/Opacity';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import * as XLSX from 'xlsx';

import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { MOCK_FUEL, VEHICLES, FUEL_TYPES } from '../services/mockData';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const EMPTY = { vehicle: '', fuelType: 'Diesel', liters: '', pricePerLiter: '', totalCost: '', odometer: '', date: '', station: '', notes: '' };

export default function FuelPage() {
  const [rows, setRows] = useState(MOCK_FUEL);
  const [search, setSearch] = useState('');
  const [filterFuelType, setFilterFuelType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // Stats
  const stats = useMemo(() => {
    const totalLiters = rows.reduce((s, r) => s + Number(r.liters || 0), 0);
    const totalCost = rows.reduce((s, r) => s + Number(r.totalCost || 0), 0);
    const avgCostPerLiter = totalLiters ? (totalCost / totalLiters).toFixed(2) : 0;
    const avgKmPerLiter = 0;
    return { totalLiters, totalCost, avgCostPerLiter, avgKmPerLiter };
  }, [rows]);

  // Filtered rows
  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.vehicle.toLowerCase().includes(q) || (r.station && r.station.toLowerCase().includes(q));
    const matchType = !filterFuelType || r.fuelType === filterFuelType;
    const matchStart = !startDate || r.date >= startDate;
    const matchEnd = !endDate || r.date <= endDate;
    return matchQ && matchType && matchStart && matchEnd;
  }), [rows, search, filterFuelType, startDate, endDate]);

  // CRUD
  const openAdd = () => { setEditRecord(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (r) => { setEditRecord(r); setForm({ ...EMPTY, ...r }); setErrors({}); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditRecord(null); };

  const handleFormChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'liters' || e.target.name === 'pricePerLiter') {
      const l = parseFloat(updated.liters);
      const p = parseFloat(updated.pricePerLiter);
      if (!isNaN(l) && !isNaN(p)) updated.totalCost = (l * p).toFixed(2);
    }
    setForm(updated);
  };

  const validate = () => {
    const e = {};
    if (!form.vehicle) e.vehicle = 'Vehicle is required';
    if (!form.fuelType) e.fuelType = 'Fuel type is required';
    if (!form.liters) e.liters = 'Liters is required';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editRecord) {
      setRows(prev => prev.map(r => r.id === editRecord.id ? { ...form, id: editRecord.id } : r));
      toast('Fuel log updated');
    } else {
      const newId = `F-${300 + rows.length + 1}`;
      setRows(prev => [{ ...form, id: newId }, ...prev]);
      toast('Fuel log added');
    }
    closeForm();
  };

  const handleDelete = () => {
    setRows(prev => prev.filter(r => r.id !== deleteId));
    setDeleteId(null);
    toast('Record deleted', 'error');
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handlePrint = (record) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fuel Log - ${record.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #1acda3; padding-bottom: 15px; }
          .header h1 { font-size: 22px; color: #1acda3; }
          .header p { font-size: 12px; color: #888; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          td:first-child { font-weight: 600; color: #555; width: 40%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          .notes { margin-top: 15px; padding: 12px; background: #f9f9f9; border-radius: 6px; font-size: 13px; line-height: 1.5; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fuel Log Details</h1>
          <p>Record ID: ${record.id}</p>
        </div>
        <table>
          <tr><td>Vehicle</td><td>${record.vehicle}</td></tr>
          <tr><td>Fuel Type</td><td>${record.fuelType}</td></tr>
          <tr><td>Liters</td><td>${record.liters} L</td></tr>
          <tr><td>Price/L</td><td>₹${record.pricePerLiter}</td></tr>
          <tr><td>Total Cost</td><td>₹${Number(record.totalCost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td></tr>
          <tr><td>Date</td><td>${fmtDate(record.date)}</td></tr>
          <tr><td>Odometer</td><td>${record.odometer ? Number(record.odometer).toLocaleString() + ' km' : '—'}</td></tr>
          <tr><td>Station</td><td>${record.station || '—'}</td></tr>
        </table>
        ${record.notes ? `<div class="notes"><strong>Notes:</strong><br/>${record.notes}</div>` : ''}
        <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportToExcel = () => {
    const data = filtered.map(r => ({
      'Vehicle': r.vehicle,
      'Fuel Type': r.fuelType,
      'Liters': r.liters,
      'Price/L': r.pricePerLiter,
      'Total Cost': r.totalCost,
      'Odometer': r.odometer,
      'Date': r.date,
      'Station': r.station,
      'Notes': r.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fuel');
    XLSX.writeFile(wb, 'fuel-logs.xlsx');
  };

  // Columns
  const columns = [
    {
      field: 'date', headerName: 'Date', flex: 0.85, minWidth: 120,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{fmtDate(value)}</Typography>,
    },
    {
      field: 'vehicle', headerName: 'Vehicle', flex: 1.2, minWidth: 160,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
            <LocalGasStationIcon sx={{ fontSize: 17 }} />
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary' }}>{row.vehicle}</Typography>
        </Stack>
      ),
    },
    {
      field: 'fuelType', headerName: 'Fuel Type', flex: 0.85, minWidth: 100,
      renderCell: ({ value }) => <Chip label={value} size="small" sx={{ bgcolor: value === 'Diesel' ? 'primary.light' : value === 'Petrol' ? 'success.light' : 'warning.light', color: value === 'Diesel' ? 'primary.main' : value === 'Petrol' ? 'success.main' : 'warning.main', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />,
    },
    {
      field: 'liters', headerName: 'Liters', flex: 0.7, minWidth: 80,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{value ? `${value} L` : '—'}</Typography>,
    },
    {
      field: 'pricePerLiter', headerName: 'Price/L', flex: 0.75, minWidth: 90,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value ? `₹${value}` : '—'}</Typography>,
    },
    {
      field: 'totalCost', headerName: 'Total Cost', flex: 0.85, minWidth: 110,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{value ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}</Typography>,
    },
    {
      field: 'odometer', headerName: 'Odometer', flex: 0.85, minWidth: 110,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value ? `${Number(value).toLocaleString()} km` : '—'}</Typography>,
    },
    {
      field: 'station', headerName: 'Station', flex: 1, minWidth: 150,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value || '—'}</Typography>,
    },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
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

      <style>{`
        *, *::before, *::after {
          font-family: 'Nunito', sans-serif !important;
        }
      `}</style>

      {/* Page Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.2} mb={0.5}>
            <LocalGasStationIcon sx={{ color: '#1acda3', fontSize: 26 }} />
            <Typography variant="h5">Fuel Logs</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Track fuel purchases and consumption across your fleet.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 2 }}>
          Add fuel log
        </Button>
      </Stack>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Fuel" value={`${stats.totalLiters.toFixed(0)} L`} sub="All logs" subColor="info.main"
            icon={<OpacityIcon sx={{ fontSize: 20 }} />} iconBg="#E6F1FB" iconColor="#185FA5" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Cost" value={`₹${stats.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="All logs" subColor="error.main"
            icon={<AttachMoneyIcon sx={{ fontSize: 20 }} />} iconBg="#FCEBEB" iconColor="#A32D2D" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Avg Price/L" value={`₹${stats.avgCostPerLiter}`} sub="Current rate" subColor="success.dark"
            icon={<SpeedIcon sx={{ fontSize: 20 }} />} iconBg="#E1F5EE" iconColor="#0F6E56" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Logs" value={rows.length} sub="Records" subColor="info.main"
            icon={<LocalGasStationIcon sx={{ fontSize: 20 }} />} iconBg="#E6F1FB" iconColor="#185FA5" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              placeholder="Search vehicle, station…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField select label="Fuel type" value={filterFuelType} onChange={(e) => setFilterFuelType(e.target.value)} size="small" sx={{ minWidth: 140 }}>
              <MenuItem value="">All types</MenuItem>
              {FUEL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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

      {/* Data Grid */}
      <Card elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            border: 'none', '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #f0f0f0' }, '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            }
          }}
          slots={{
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} py={6}>
                <LocalGasStationIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" fontSize="0.875rem">No fuel logs found</Typography>
              </Stack>
            ),
          }}
        />
      </Card>

      {/* Add/Edit Dialog */}
      {formOpen && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid #f0f0f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{editRecord ? 'Edit fuel log' : 'Add fuel log'}</Typography>
              <IconButton size="small" onClick={closeForm}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={VEHICLES.map(v => v.label)}
                    value={form.vehicle}
                    onChange={(e, newValue) => setForm(f => ({ ...f, vehicle: newValue || '' }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Vehicle" placeholder="Search vehicle…" error={!!errors.vehicle} helperText={errors.vehicle} />
                    )}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Fuel type" name="fuelType" value={form.fuelType} onChange={handleFormChange} error={!!errors.fuelType} helperText={errors.fuelType}>
                    {FUEL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Liters" name="liters" type="number" value={form.liters} onChange={handleFormChange} error={!!errors.liters} helperText={errors.liters} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Price/L (₹)" name="pricePerLiter" type="number" value={form.pricePerLiter} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Total Cost (₹)" name="totalCost" type="number" value={form.totalCost} onChange={handleFormChange} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Date" name="date" type="date" value={form.date} onChange={handleFormChange} InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Odometer (km)" name="odometer" type="number" value={form.odometer} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Station / Location" name="station" value={form.station} onChange={handleFormChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Notes" name="notes" value={form.notes} onChange={handleFormChange} />
                </Grid>
              </Grid>
            </Box>
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2, borderTop: '1px solid #f0f0f0' }}>
              <Button onClick={closeForm} variant="outlined" size="small">Cancel</Button>
              <Button onClick={handleSave} variant="contained" size="small">{editRecord ? 'Update' : 'Add log'}</Button>
            </Stack>
          </Card>
        </Box>
      )}

      {/* View Dialog */}
      {viewRecord && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 500, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid #f0f0f0' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalGasStationIcon sx={{ color: '#1acda3', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Fuel Log Details</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Print">
                  <IconButton size="small" onClick={() => handlePrint(viewRecord)}>
                    <PrintIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => setViewRecord(null)}><CloseIcon fontSize="small" /></IconButton>
              </Stack>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                {[
                  ['Vehicle', viewRecord.vehicle],
                  ['Fuel Type', viewRecord.fuelType],
                  ['Liters', viewRecord.liters ? `${viewRecord.liters} L` : '—'],
                  ['Price/L', viewRecord.pricePerLiter ? `₹${viewRecord.pricePerLiter}` : '—'],
                  ['Total Cost', viewRecord.totalCost ? `₹${Number(viewRecord.totalCost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'],
                  ['Date', fmtDate(viewRecord.date)],
                  ['Odometer', viewRecord.odometer ? `${Number(viewRecord.odometer).toLocaleString()} km` : '—'],
                  ['Station', viewRecord.station || '—'],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>{value}</Typography>
                  </Grid>
                ))}
                {viewRecord.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>Notes</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{viewRecord.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
            <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, py: 2, borderTop: '1px solid #f0f0f0' }}>
              <Button onClick={() => setViewRecord(null)} variant="outlined" size="small">Close</Button>
            </Stack>
          </Card>
        </Box>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete fuel log"
        message="This action cannot be undone. Are you sure you want to delete this fuel log?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

    </Box>
  );
}
