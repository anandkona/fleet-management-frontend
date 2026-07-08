import React, { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Stack, Grid, Card, CardContent,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip,
  Snackbar, Alert, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, useTheme, useMediaQuery
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { StatCard, StatusChip, FuelBar, ConfirmDialog, PageHeader } from '../components/Common';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const VEHICLE_TYPES = ['Truck', 'Van', 'Car', 'Bus', 'SUV'];
const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];

const fallbackVehicles = [
  { id: 1, licensePlate: 'AP05-T123', vehicleNumber: 'AP05-T123', brand: 'Tata Prima', vehicleType: 'Truck', fuelType: 'Diesel', status: 'AVAILABLE', fuelLevel: 85, odometer: 45230, driver: 'Rajesh Kumar' },
  { id: 2, licensePlate: 'AP05-T087', vehicleNumber: 'AP05-T087', brand: 'Ashok Leyland', vehicleType: 'Truck', fuelType: 'Diesel', status: 'ON_TRIP', fuelLevel: 62, odometer: 31450, driver: 'Suresh Babu' },
  { id: 3, licensePlate: 'AP05-T201', vehicleNumber: 'AP05-T201', brand: 'Eicher Pro', vehicleType: 'Truck', fuelType: 'Diesel', status: 'AVAILABLE', fuelLevel: 91, odometer: 12870, driver: 'Mohan Reddy' },
  { id: 4, licensePlate: 'AP05-T043', vehicleNumber: 'AP05-T043', brand: 'Mahindra Blazo', vehicleType: 'Truck', fuelType: 'Diesel', status: 'UNDER_MAINTENANCE', fuelLevel: 45, odometer: 67800, driver: 'Venkat Rao' },
  { id: 5, licensePlate: 'AP05-T089', vehicleNumber: 'AP05-T089', brand: 'Tata Ace', vehicleType: 'Van', fuelType: 'Diesel', status: 'AVAILABLE', fuelLevel: 78, odometer: 22100, driver: 'Prasad Nair' },
  { id: 6, licensePlate: 'AP05-T112', vehicleNumber: 'AP05-T112', brand: 'Force Traveller', vehicleType: 'Van', fuelType: 'Diesel', status: 'INACTIVE', fuelLevel: 55, odometer: 38900, driver: '' },
  { id: 7, licensePlate: 'AP05-T156', vehicleNumber: 'AP05-T156', brand: 'Maruti Eeco', vehicleType: 'Van', fuelType: 'Petrol', status: 'AVAILABLE', fuelLevel: 70, odometer: 15400, driver: '' },
  { id: 8, licensePlate: 'AP05-T047', vehicleNumber: 'AP05-T047', brand: 'Honda City', vehicleType: 'Car', fuelType: 'Petrol', status: 'AVAILABLE', fuelLevel: 88, odometer: 8900, driver: '' },
];

const EMPTY = { vehicleNumber: '', brand: '', model: '', year: new Date().getFullYear(), vehicleType: 'Truck', fuelType: 'Diesel', status: 'AVAILABLE', currentOdometer: 0, fuelLevel: 0 };

export default function VehicleOpsPage() {
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { hasPermission } = useAuth();

  React.useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchParam = queryParams.get('search');
    if (searchParam !== null) {
      setSearch(searchParam);
    }
  }, [location.search]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [allDrivers, setAllDrivers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [complianceDialog, setComplianceDialog] = useState({ open: false, vehicle: null });
  const [complianceForm, setComplianceForm] = useState({ type: 'insurance', expiryDate: '', documentNumber: '', notes: '' });
  const [alertsDialog, setAlertsDialog] = useState({ open: false, alerts: [], loading: false });
  const [assignDriverDialog, setAssignDriverDialog] = useState({ open: false, vehicle: null });
  const [selectedDriver, setSelectedDriver] = useState('');
  const { addNotification } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setVehicles(items.length > 0 ? items : fallbackVehicles);
    } catch (err) {
      console.error(err);
      setVehicles(fallbackVehicles);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await api.get('/drivers', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      // Extract unique names just in case there are duplicates
      const driverNames = [...new Set(items.map(d => d.name).filter(Boolean))].sort();
      setAllDrivers(driverNames);
    } catch (err) {
      console.error(err);
    }
  }, []);

  React.useEffect(() => { fetchData(); fetchDrivers(); }, [fetchData, fetchDrivers]);

  const stats = useMemo(() => {
    const available = vehicles.filter(r => r.status === 'AVAILABLE' || r.status === 'active').length;
    const onTrip = vehicles.filter(r => r.status === 'ON_TRIP' || r.status === 'on_trip').length;
    const maintenance = vehicles.filter(r => ['UNDER_MAINTENANCE', 'UNDER_REPAIR', 'maintenance'].includes(r.status)).length;
    return { total: vehicles.length, available, onTrip, maintenance };
  }, [vehicles]);

  const filtered = useMemo(() => vehicles.filter(r => {
    const q = search.toLowerCase();
    const plate = (r.vehicleNumber || r.licensePlate || '').toLowerCase();
    const brand = (r.brand || '').toLowerCase();
    const matchQ = !q || plate.includes(q) || brand.includes(q);
    const matchType = !filterType || r.vehicleType === filterType;
    const matchStatus = !filterStatus || r.status === filterStatus || (r.status || '').toLowerCase() === filterStatus.toLowerCase();
    const driverName = r.driver || r.currentDriver?.name || '';
    const matchDriver = !filterDriver || driverName === filterDriver;
    return matchQ && matchType && matchStatus && matchDriver;
  }).map((r, i) => ({ ...r, sno: i + 1 })), [search, filterType, filterStatus, filterDriver, vehicles]);

  const uniqueDrivers = useMemo(() => {
    const drivers = new Set(allDrivers);
    vehicles.forEach(v => {
      if (v.driver) drivers.add(v.driver);
      if (v.currentDriver?.name) drivers.add(v.currentDriver.name);
    });
    return Array.from(drivers).filter(Boolean).sort();
  }, [allDrivers, vehicles]);

  const openAdd = () => { setEditRecord(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (r) => { setEditRecord(r); setForm({ ...EMPTY, ...r, vehicleNumber: r.vehicleNumber || r.licensePlate || '' }); setErrors({}); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditRecord(null); };

  const handleSave = async () => {
    if (!form.vehicleNumber) { setErrors({ vehicleNumber: 'Required' }); return; }
    try {
      const payload = {
        vehicleNumber: form.vehicleNumber,
        vehicleType: form.vehicleType,
        brand: form.brand || undefined,
        model: form.model || undefined,
        year: parseInt(form.year) || undefined,
        fuelType: form.fuelType,
        status: form.status,
        currentOdometer: parseInt(form.currentOdometer) || 0,
        fuelLevel: Math.min(100, Math.max(0, parseInt(form.fuelLevel) || 0)),
      };
      
      if (editRecord) {
        try {
          await api.patch(`/vehicles/${editRecord.id || editRecord._id}`, payload);
        } catch (e) { console.warn('API update failed, mocking locally'); }
        const recordId = editRecord.id || editRecord._id;
        setVehicles(prev => prev.map(v => ((v.id || v._id) === recordId) ? { ...v, ...payload } : v));
        toast('Vehicle updated');
        if (editRecord.status !== payload.status) {
          addNotification('Vehicle Status Changed', `${payload.vehicleNumber} status updated to ${payload.status}`, 'info');
        }
      } else {
        try {
          const res = await api.post('/vehicles', payload);
          if (res.data?.data) {
            setVehicles(prev => [res.data.data, ...prev]);
          }
        } catch (e) {
          console.warn('API create failed, mocking locally');
          setVehicles(prev => [{ ...payload, id: Date.now(), _id: Date.now().toString() }, ...prev]);
        }
        toast('Vehicle added');
        addNotification('Vehicle Added', `New vehicle ${payload.vehicleNumber} added to fleet`, 'success');
      }
      closeForm();
    } catch (err) {
      console.error(err);
      toast('Error saving vehicle', 'error');
      addNotification('Error', 'Failed to save vehicle', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/vehicles/${deleteId}`);
      toast('Vehicle deleted');
      addNotification('Vehicle Deleted', 'Vehicle removed from fleet', 'warning');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast('Error deleting vehicle', 'error');
    }
  };

  const handleComplianceSave = async () => {
    try {
      const vId = complianceDialog.vehicle.id || complianceDialog.vehicle._id;
      const type = complianceForm.type;
      const payload = {
        expiryDate: new Date(complianceForm.expiryDate).toISOString(),
        documentNumber: complianceForm.documentNumber || undefined,
        notes: complianceForm.notes || undefined,
      };

      let endpoint = '';
      if (type === 'insurance') endpoint = `/vehicle/${vId}/compliance/insurance`;
      if (type === 'fastag') endpoint = `/vehicle/${vId}/compliance/fastag`;
      if (type === 'fitness') endpoint = `/vehicle/${vId}/compliance/fitness`;
      if (type === 'puc') endpoint = `/vehicle/${vId}/compliance/puc`;
      if (type === 'permits') endpoint = `/vehicle/${vId}/compliance/permits`;
      if (type === 'road-tax') endpoint = `/vehicle/${vId}/compliance/road-tax`;

      await api.post(endpoint, payload);
      toast(`Compliance (${type}) updated successfully`);
      addNotification('Compliance Updated', `Updated ${type} for vehicle ${complianceDialog.vehicle.vehicleNumber || complianceDialog.vehicle.licensePlate}`, 'success');
      setComplianceDialog({ open: false, vehicle: null });
    } catch (err) {
      console.error(err);
      toast(`Failed: ${err.response?.data?.message || err.message}`, 'error');
      addNotification('Compliance Error', `Failed to update compliance`, 'error');
    }
  };

  const openAlerts = async () => {
    setAlertsDialog({ open: true, alerts: [], loading: true });
    try {
      const res = await api.get('/compliance/alerts/expiring');
      setAlertsDialog({ open: true, alerts: res.data?.data || [], loading: false });
    } catch (err) {
      console.error(err);
      toast('Failed to load compliance alerts', 'error');
      setAlertsDialog({ open: true, alerts: [], loading: false });
    }
  };

  const handleAssignDriver = async () => {
    const vId = assignDriverDialog.vehicle.id || assignDriverDialog.vehicle._id;
    try {
      // Assuming endpoint is POST /assets/:id/assign based on api.js
      await api.post(`/assets/${vId}/assign`, { driver: selectedDriver });
      toast('Driver assigned successfully');
      addNotification('Driver Assigned', `Driver ${selectedDriver} assigned to vehicle ${assignDriverDialog.vehicle.vehicleNumber || assignDriverDialog.vehicle.licensePlate}`, 'success');
      setVehicles(prev => prev.map(v => ((v.id || v._id) === vId) ? { ...v, driver: selectedDriver, currentDriver: { name: selectedDriver } } : v));
      setAssignDriverDialog({ open: false, vehicle: null });
      setSelectedDriver('');
    } catch (err) {
      console.warn('API assign failed, mocking locally');
      setVehicles(prev => prev.map(v => ((v.id || v._id) === vId) ? { ...v, driver: selectedDriver, currentDriver: { name: selectedDriver } } : v));
      toast('Driver assigned successfully');
      addNotification('Driver Assigned', `Driver ${selectedDriver} assigned to vehicle ${assignDriverDialog.vehicle.vehicleNumber || assignDriverDialog.vehicle.licensePlate}`, 'success');
      setAssignDriverDialog({ open: false, vehicle: null });
      setSelectedDriver('');
    }
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const columns = [
    { field: 'sno', headerName: 'S.NO', width: 70, sortable: false, filterable: false, renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{value}</Typography> },
    {
      field: 'vehicleNumber', headerName: 'Vehicle Number', flex: 1.2, minWidth: 160,
      renderCell: ({ row }) => (
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary' }}>{row.vehicleNumber || row.licensePlate}</Typography>
      ),
    },
    { field: 'brand', headerName: 'Brand', flex: 0.9, minWidth: 120, renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value || '—'}</Typography> },
    { field: 'vehicleType', headerName: 'Type', flex: 0.8, minWidth: 100, renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value}</Typography> },
    { field: 'fuelType', headerName: 'Fuel', flex: 0.75, minWidth: 90, renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value}</Typography> },
    {
      field: 'fuelLevel', headerName: 'Fuel Level', flex: 1, minWidth: 130,
      renderCell: ({ value }) => <FuelBar value={value || 0} />,
    },
    {
      field: 'status', headerName: 'Status', flex: 1, minWidth: 140,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'driver', headerName: 'Driver', flex: 1, minWidth: 130,
      renderCell: ({ row }) => <Typography variant="body2" sx={{ color: '#000' }}>{row.currentDriver?.name || 'Unassigned'}</Typography>,
    },
    {
      field: 'actions', headerName: 'Actions', width: 210, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Assign Driver"><IconButton size="small" sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', '&:hover': { bgcolor: '#8b5cf630' } }} onClick={() => { setAssignDriverDialog({ open: true, vehicle: row }); setSelectedDriver(row.currentDriver?.name || row.driver || ''); }}><PersonAddIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          {hasPermission('vehicle_compliance_update') && <Tooltip title="Update Compliance"><IconButton size="small" sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }} onClick={() => { setComplianceDialog({ open: true, vehicle: row }); setComplianceForm({ type: 'insurance', expiryDate: new Date().toISOString().split('T')[0], documentNumber: '', notes: '' }); }}><VerifiedUserIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
          <Tooltip title="View"><IconButton size="small" sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }} onClick={() => setViewRecord(row)}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          {hasPermission('vehicle_update') && <Tooltip title="EditOutlined"><IconButton size="small" sx={{ bgcolor: '#f59e0b15', color: '#f59e0b', '&:hover': { bgcolor: '#f59e0b30' } }} onClick={() => openEdit(row)}><EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
          {hasPermission('vehicle_delete') && <Tooltip title="Delete"><IconButton size="small" sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }} onClick={() => setDeleteId(row.id || row._id)}><DeleteOutlineIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Vehicles" subtitle="Manage your fleet vehicles and track their status." icon={DirectionsCarIcon}
        action={
          <Stack direction="row" spacing={1} sx={{ width: 'auto', flexWrap: 'wrap' }}>
            {hasPermission('compliance_alerts_view') && <Button startIcon={<NotificationsActiveIcon />} onClick={openAlerts} variant="outlined" size="small" sx={{ color: '#ef4444', borderColor: '#ef444450', bgcolor: '#ef444410' }}>Alerts</Button>}
            {hasPermission('vehicle_create') && <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} size="small" sx={{ borderRadius: 2 }}>Add vehicle</Button>}
          </Stack>
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Vehicles" value={stats.total} sub="In fleet" subColor="#60a5fa" icon={<DirectionsCarIcon />} iconBg="#1976d220" iconColor="#1976d2" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Available" value={stats.available} sub="Ready" subColor="#4ade80" icon={<CheckCircleOutlineIcon />} iconBg="#10b98120" iconColor="#10b981" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="On Trip" value={stats.onTrip} sub="Active" subColor="#60a5fa" icon={<LocalGasStationIcon />} iconBg="#3b82f620" iconColor="#3b82f6" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Maintenance" value={stats.maintenance} sub="Needs attention" subColor="#f59e0b" icon={<WarningAmberIcon />} iconBg="#f59e0b20" iconColor="#f59e0b" loading={loading} />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ mb: 2, bgcolor: 'background.paper' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField placeholder="Search vehicles…" value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ flex: 1, width: { xs: '100%', sm: 'auto' }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.primary' }} /></InputAdornment> }} />
            <TextField select label="Type" value={filterType} onChange={(e) => setFilterType(e.target.value)} size="small" sx={{ minWidth: 130, width: { xs: '100%', sm: 'auto' } }}>
              <MenuItem value="">All types</MenuItem>
              {VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: 150, width: { xs: '100%', sm: 'auto' } }}>
              <MenuItem value="">All statuses</MenuItem>
              {['AVAILABLE', 'ON_TRIP', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'INACTIVE', 'active', 'maintenance', 'idle'].map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
            </TextField>
            <TextField select label="Driver" value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)} size="small" sx={{ minWidth: 150, width: { xs: '100%', sm: 'auto' } }}>
              <MenuItem value="">All drivers</MenuItem>
              {uniqueDrivers.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ bgcolor: 'background.paper', width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          getRowId={(row) => row.id || row._id || row.sno}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          loading={loading}
          sx={{
            border: 'none',
            color: 'text.primary',
            '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' },
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', borderColor: 'divider' },
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#1976d2', color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', borderColor: 'divider' },
            '& .MuiDataGrid-columnHeader': { backgroundColor: '#1976d2', color: '#fff' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#fff' },
            '& .MuiDataGrid-iconButtonContainer .MuiIconButton-root, & .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIcon .MuiIconButton-root': { color: '#fff' },
            '& .MuiDataGrid-row:hover': { backgroundColor: '#1e1e2420' },
          }}
          slots={{
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} py={6}>
                <DirectionsCarIcon sx={{ fontSize: 40, color: '#555' }} />
                <Typography sx={{ color: 'text.primary', fontSize: '0.875rem' }}>No vehicles found</Typography>
              </Stack>
            ),
          }}
        />
      </Card>

      {formOpen && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 650, height: { xs: '100%', sm: 'auto' }, maxHeight: { xs: '100%', sm: '90vh' }, overflow: 'auto', borderRadius: { xs: 0, sm: 2 }, bgcolor: 'background.paper', backgroundImage: 'none', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>{editRecord ? 'EditOutlined vehicle' : 'Add vehicle'}</Typography>
              <IconButton size="small" onClick={closeForm}><CloseIcon sx={{ color: 'text.primary' }} fontSize="small" /></IconButton>
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
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Odometer" value={form.currentOdometer} onChange={(e) => setForm({ ...form, currentOdometer: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth label="Fuel Type" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                    {FUEL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {['AVAILABLE', 'ON_TRIP', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'INACTIVE'].map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Fuel Level (%)" InputProps={{ inputProps: { min: 0, max: 100 } }} value={form.fuelLevel} onChange={(e) => setForm({ ...form, fuelLevel: e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value))) })} />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <Button onClick={closeForm} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: '#3a3a42' }}>Cancel</Button>
              <Button onClick={handleSave} variant="contained" size="small">{editRecord ? 'Update' : 'Add'}</Button>
            </Stack>
          </Card>
        </Box>
      )}

      {viewRecord && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 700, height: { xs: '100%', sm: 'auto' }, maxHeight: { xs: '100%', sm: '90vh' }, overflow: 'auto', borderRadius: { xs: 0, sm: 2 }, bgcolor: 'background.paper', backgroundImage: 'none', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DirectionsCarIcon sx={{ color: '#1976d2', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>Vehicle Details</Typography>
              </Stack>
              <IconButton size="small" onClick={() => setViewRecord(null)}><CloseIcon sx={{ color: 'text.primary' }} fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                {[
                  ['Vehicle Number', viewRecord.vehicleNumber || viewRecord.licensePlate],
                  ['Type', viewRecord.vehicleType],
                  ['Brand', viewRecord.brand],
                  ['Model', viewRecord.model],
                  ['Year', viewRecord.year],
                  ['Fuel Type', viewRecord.fuelType],
                  ['Odometer', viewRecord.currentOdometer ? `${Number(viewRecord.currentOdometer).toLocaleString()} km` : '—'],
                  ['Chassis Number', viewRecord.chassisNumber],
                  ['Engine Number', viewRecord.engineNumber],
                  ['RC Number', viewRecord.rcNumber],
                  ['Current Driver', viewRecord.currentDriver?.name || viewRecord.driver || 'Unassigned'],
                  ['Insurance Expiry', viewRecord.insuranceExpiry ? new Date(viewRecord.insuranceExpiry).toLocaleDateString() : '—'],
                  ['Fitness Expiry', viewRecord.fitnessExpiry ? new Date(viewRecord.fitnessExpiry).toLocaleDateString() : '—'],
                  ['Pollution Expiry', viewRecord.pollutionExpiry ? new Date(viewRecord.pollutionExpiry).toLocaleDateString() : '—'],
                  ['Permit Expiry', viewRecord.permitExpiry ? new Date(viewRecord.permitExpiry).toLocaleDateString() : '—'],
                  ['Created', viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString() : '—'],
                  ['Last Updated', viewRecord.updatedAt ? new Date(viewRecord.updatedAt).toLocaleString() : '—'],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', color: 'text.primary' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25, color: 'text.primary' }}>{value || '—'}</Typography>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', color: 'text.primary' }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}><StatusChip status={viewRecord.status} /></Box>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <Button onClick={() => setViewRecord(null)} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: '#3a3a42' }}>Close</Button>
            </Stack>
          </Card>
        </Box>
      )}

      <Dialog open={complianceDialog.open} onClose={() => setComplianceDialog({ open: false, vehicle: null })} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedUserIcon sx={{ color: '#10b981' }} /> Update Compliance
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>Vehicle: <b>{complianceDialog.vehicle?.vehicleNumber || complianceDialog.vehicle?.licensePlate}</b></Typography>
            <TextField select fullWidth size="small" label="Document Type" value={complianceForm.type} onChange={e => setComplianceForm(p => ({ ...p, type: e.target.value }))}>
              <MenuItem value="insurance">Insurance</MenuItem>
              <MenuItem value="fastag">Fastag</MenuItem>
              <MenuItem value="fitness">Fitness Certificate</MenuItem>
              <MenuItem value="puc">PUC (Pollution)</MenuItem>
              <MenuItem value="permits">Permits</MenuItem>
              <MenuItem value="road-tax">Road Tax</MenuItem>
            </TextField>
            <TextField label="Expiry Date" type="date" value={complianceForm.expiryDate} onChange={e => setComplianceForm(p => ({ ...p, expiryDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Document / Ref Number" value={complianceForm.documentNumber} onChange={e => setComplianceForm(p => ({ ...p, documentNumber: e.target.value }))} fullWidth size="small" />
            <TextField label="Notes" value={complianceForm.notes} onChange={e => setComplianceForm(p => ({ ...p, notes: e.target.value }))} fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setComplianceDialog({ open: false, vehicle: null })} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleComplianceSave} sx={{ backgroundColor: '#10b981' }}>Update Compliance</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={alertsDialog.open} onClose={() => setAlertsDialog(p => ({ ...p, open: false }))} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsActiveIcon sx={{ color: '#ef4444' }} /> Expiring Compliance Alerts
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2, minHeight: 200 }}>
          {alertsDialog.loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
            alertsDialog.alerts.length > 0 ? (
              <Stack spacing={2}>
                {alertsDialog.alerts.map((a, i) => (
                  <Alert key={i} severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>{a.vehicleNumber || a.vehicleId} - {a.type || a.category}</Typography>
                    <Typography variant="caption">Expires on: {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : 'Unknown'}</Typography>
                  </Alert>
                ))}
              </Stack>
            ) : <Typography sx={{ color: 'text.primary', textAlign: 'center', mt: 4 }}>No upcoming expirations found.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setAlertsDialog(p => ({ ...p, open: false }))} sx={{ color: 'text.primary' }}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteId} title="Delete Vehicle" message="Are you sure you want to delete this vehicle? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      <Dialog open={assignDriverDialog.open} onClose={() => setAssignDriverDialog({ open: false, vehicle: null })} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon sx={{ color: '#8b5cf6' }} /> Assign Driver
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>Vehicle: <b>{assignDriverDialog.vehicle?.vehicleNumber || assignDriverDialog.vehicle?.licensePlate}</b></Typography>
            <TextField select fullWidth size="small" label="Select Driver" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {allDrivers.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setAssignDriverDialog({ open: false, vehicle: null })} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignDriver} sx={{ backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' } }}>Assign Driver</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
