import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, IconButton, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Stack,
  Typography, Tooltip, InputAdornment, Chip, Skeleton, useTheme, useMediaQuery, Autocomplete, Alert, Snackbar
} from '@mui/material';
import { Add, EditOutlined, Search, Close, PlayArrow, Stop, Refresh, VisibilityOutlined, Schedule, CancelOutlined } from '@mui/icons-material';
import { tripService, vehicleService, driverService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { StatusChip, ConfirmDialog, PageHeader } from '../components/Common';

const TRIP_TYPES = ['TRANSFER', 'DELIVERY', 'PICKUP', 'SERVICE', 'INTERNAL'];
const STATUSES = ['DRAFT', 'SCHEDULED', 'STARTED', 'COMPLETED', 'CANCELLED'];

const fallbackTrips = [
  { id: 1, tripNumber: 'TRP-001', tripType: 'DELIVERY', originName: 'Vizag Port', destinationName: 'APSEZ', vehicleId: 'AP05-T123', driverId: 'Rajesh Kumar', plannedStartAt: '2026-06-22T08:00', status: 'COMPLETED', distanceKm: 42 },
  { id: 2, tripNumber: 'TRP-002', tripType: 'TRANSFER', originName: 'Gajuwaka', destinationName: 'Pendurthi', vehicleId: 'AP05-T087', driverId: 'Suresh Babu', plannedStartAt: '2026-06-22T10:00', status: 'STARTED', distanceKm: 28 },
  { id: 3, tripNumber: 'TRP-003', tripType: 'PICKUP', originName: 'BHPV Gate', destinationName: 'Simhachalam', vehicleId: 'AP05-T201', driverId: 'Mohan Reddy', plannedStartAt: '2026-06-23T14:00', status: 'SCHEDULED', distanceKm: 18 },
  { id: 4, tripNumber: 'TRP-004', tripType: 'SERVICE', originName: 'Dwaraka Nagar', destinationName: 'Rushikonda', vehicleId: 'AP05-T043', driverId: 'Venkat Rao', plannedStartAt: '2026-06-24T09:00', status: 'DRAFT', distanceKm: 22 },
];

const EMPTY = { tripType: 'TRANSFER', originName: '', destinationName: '', vehicleId: '', driverId: '', plannedStartAt: '', plannedEndAt: '', purpose: '', notes: '', distanceKm: '' };

function fmt(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return dt; }
}

export default function TripLogsPage() {
  const { addNotification, refreshNotifications } = useNotification();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const [lifecycleDialog, setLifecycleDialog] = useState(false);
  const [lifecycleTarget, setLifecycleTarget] = useState(null);
  const [lifecycleAction, setLifecycleAction] = useState('');
  const [lifecycleForm, setLifecycleForm] = useState({ notes: '', odometer: '', distanceKm: '' });

  const [historyDialog, setHistoryDialog] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, vRes, dRes] = await Promise.allSettled([
        tripService.getAll({ limit: 100 }),
        vehicleService.getAll({ limit: 100 }),
        driverService.getAll({ limit: 100 }),
      ]);
      const tItems = tRes.status === 'fulfilled' ? (tRes.value.data?.data?.items ?? (Array.isArray(tRes.value.data?.data) ? tRes.value.data.data : [])) : [];
      setTrips(tItems.length > 0 ? tItems : fallbackTrips);
      const vItems = vRes.status === 'fulfilled' ? (vRes.value.data?.data?.items ?? (Array.isArray(vRes.value.data?.data) ? vRes.value.data.data : [])) : [];
      setVehicles(vItems);
      const dItems = dRes.status === 'fulfilled' ? (dRes.value.data?.data?.items ?? (Array.isArray(dRes.value.data?.data) ? dRes.value.data.data : [])) : [];
      setDrivers(dItems);
    } catch (err) {
      console.error(err);
      setTrips(fallbackTrips);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uniqueDrivers = useMemo(() => {
    const dSet = new Set(trips.map(t => t.driverId).filter(Boolean));
    drivers.forEach(d => { if (d.name) dSet.add(d.name); });
    return Array.from(dSet).sort();
  }, [trips, drivers]);

  const uniqueVehicles = useMemo(() => {
    const vSet = new Set(trips.map(t => t.vehicleId).filter(Boolean));
    vehicles.forEach(v => {
      if (v.vehicleNumber) vSet.add(v.vehicleNumber);
      else if (v.licensePlate) vSet.add(v.licensePlate);
    });
    return Array.from(vSet).sort();
  }, [trips, vehicles]);

  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || (t.tripNumber || '').toLowerCase().includes(q) || (t.originName || '').toLowerCase().includes(q) || (t.destinationName || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchDriver = !driverFilter || t.driverId === driverFilter;
    const matchVehicle = !vehicleFilter || t.vehicleId === vehicleFilter;
    return matchQ && matchStatus && matchDriver && matchVehicle;
  });
  const paged = filtered.slice(page * 10, (page + 1) * 10);

  const getDriverName = useCallback((t) => {
    if (t.driver?.name) return t.driver.name;
    const d = drivers.find(drv => drv.id === t.driverId || drv.name === t.driverId);
    return d ? d.name : t.driverId;
  }, [drivers]);

  const getVehicleName = useCallback((t) => {
    if (t.vehicle?.vehicleNumber || t.vehicle?.licensePlate) return t.vehicle.vehicleNumber || t.vehicle.licensePlate;
    const v = vehicles.find(veh => veh.id === t.vehicleId || veh.vehicleNumber === t.vehicleId || veh.licensePlate === t.vehicleId);
    return v ? (v.vehicleNumber || v.licensePlate) : t.vehicleId;
  }, [vehicles]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ tripType: t.tripType || 'TRANSFER', originName: t.originName || '', destinationName: t.destinationName || '', vehicleId: t.vehicleId || '', driverId: t.driverId || '', plannedStartAt: t.plannedStartAt ? t.plannedStartAt.slice(0, 16) : '', plannedEndAt: t.plannedEndAt ? t.plannedEndAt.slice(0, 16) : '', purpose: t.purpose || '', notes: t.notes || '', distanceKm: t.distanceKm || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.originName || !form.destinationName) { toast('Origin and Destination are required', 'warning'); return; }
    try {
      const payload = { ...form };
      if (payload.distanceKm) payload.distanceKm = Number(payload.distanceKm);
      if (!payload.plannedStartAt) delete payload.plannedStartAt;
      else payload.plannedStartAt = new Date(payload.plannedStartAt).toISOString();
      if (!payload.plannedEndAt) delete payload.plannedEndAt;
      else payload.plannedEndAt = new Date(payload.plannedEndAt).toISOString();
      if (!payload.notes) delete payload.notes;
      if (!payload.purpose) delete payload.purpose;

      if (editing) { await tripService.update(editing.id, payload); toast('Trip updated'); addNotification('Success', 'Trip updated successfully', 'success'); if (refreshNotifications) refreshNotifications(); }
      else { await tripService.create(payload); toast('Trip created'); addNotification('Success', 'Trip created successfully', 'success'); if (refreshNotifications) refreshNotifications(); }
      setDialogOpen(false); fetchData();
    } catch (err) { console.error(err); toast('Error saving trip', 'error'); addNotification('Error', 'Failed to save trip', 'error'); }
  };

  const handleDelete = async () => {
    try { await tripService.delete(deleteId); toast('Trip deleted'); addNotification('Deleted', 'Trip deleted successfully', 'warning'); if (refreshNotifications) refreshNotifications(); setDeleteId(null); fetchData(); }
    catch (err) { console.error(err); toast('Error deleting trip', 'error'); addNotification('Error', 'Failed to delete trip', 'error'); }
  };

  const openLifecycle = (t, action) => { setLifecycleTarget(t); setLifecycleAction(action); setLifecycleForm({ notes: '', odometer: '', distanceKm: '' }); setLifecycleDialog(true); };

  const handleLifecycle = async () => {
    try {
      const id = lifecycleTarget.id;
      if (lifecycleAction === 'schedule') { await tripService.schedule(id, lifecycleForm); toast('Trip scheduled'); addNotification('Success', 'Trip scheduled successfully', 'success'); if (refreshNotifications) refreshNotifications(); }
      else if (lifecycleAction === 'start') { await tripService.start(id, { ...lifecycleForm, startOdometer: lifecycleForm.odometer ? Number(lifecycleForm.odometer) : undefined }); toast('Trip started'); addNotification('Success', 'Trip started successfully', 'success'); if (refreshNotifications) refreshNotifications(); }
      else if (lifecycleAction === 'complete') { await tripService.complete(id, { ...lifecycleForm, endOdometer: lifecycleForm.odometer ? Number(lifecycleForm.odometer) : undefined, distanceKm: lifecycleForm.distanceKm ? Number(lifecycleForm.distanceKm) : undefined }); toast('Trip completed'); addNotification('Success', 'Trip completed successfully', 'success'); if (refreshNotifications) refreshNotifications(); }
      else if (lifecycleAction === 'cancel') { await tripService.cancel(id, { notes: lifecycleForm.notes }); toast('Trip cancelled'); addNotification('Success', 'Trip cancelled successfully', 'warning'); if (refreshNotifications) refreshNotifications(); }
      setLifecycleDialog(false); fetchData();
    } catch (err) { console.error(err); toast(`Error: ${err.message}`, 'error'); addNotification('Error', `Failed to ${lifecycleAction} trip`, 'error'); }
  };

  const openHistory = async (t) => {
    setHistoryDialog(true); setHistoryLoading(true);
    try { const res = await tripService.history(t.id); setHistoryData(res.data?.data ?? res.data ?? []); }
    catch { setHistoryData([]); }
    setHistoryLoading(false);
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const lifecycleTitle = { schedule: 'Schedule Trip', start: 'Start Trip', complete: 'Complete Trip', cancel: 'Cancel Trip' };

  return (
    <Box>
      <PageHeader title="Trips" subtitle={`${filtered.length} trips recorded`} icon={Schedule}
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button startIcon={<Refresh />} onClick={fetchData} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: '#3a3a42', flex: { xs: 1, sm: 'none' } }}>Refresh</Button>
            <Button startIcon={<Add />} onClick={openAdd} variant="contained" sx={{ flex: { xs: 1, sm: 'none' } }}>New Trip</Button>
          </Stack>
        }
      />

      <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ py: 2, pr: 2, pl: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-start', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField placeholder="Search trips…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.primary' }} /></InputAdornment> }}
            sx={{ width: { xs: '100%', sm: 1000 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }} size="small" />
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Autocomplete
            size="small"
            options={uniqueDrivers}
            value={driverFilter || null}
            onChange={(e, v) => { setDriverFilter(v || ''); setPage(0); }}
            renderInput={(params) => <TextField {...params} label="Driver" />}
            sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }}
          />
          <Autocomplete
            size="small"
            options={uniqueVehicles}
            value={vehicleFilter || null}
            onChange={(e, v) => { setVehicleFilter(v || ''); setPage(0); }}
            renderInput={(params) => <TextField {...params} label="Vehicle" />}
            sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }}
          />
        </Box>
        <TableContainer sx={{ maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Trip ID', 'Type', 'Route', 'Driver', 'Vehicle', 'Planned Start', 'Actual Start', 'Distance', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(11).fill(0).map((_, j) => <TableCell key={j} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><Skeleton sx={{ bgcolor: 'divider' }} /></TableCell>)}</TableRow>)
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={11} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No trips found</TableCell></TableRow>
              ) : paged.map((t, idx) => (
                <TableRow key={t.id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{idx + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.tripNumber || `#${String(t.id).slice(-6)}`}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.tripType}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.primary', whiteSpace: 'nowrap' }}>{t.originName || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.primary', whiteSpace: 'nowrap' }}>→ {t.destinationName || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{getDriverName(t) || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{getVehicleName(t) || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{fmt(t.plannedStartAt)}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{fmt(t.startedAt || t.actualStartAt)}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.distanceKm ? `${t.distanceKm} km` : '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><StatusChip status={t.status} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5}>
                      {t.status === 'SCHEDULED' && <Tooltip title="Start Trip"><IconButton size="small" color="success" onClick={() => openLifecycle(t, 'start')}><PlayArrow fontSize="small" /></IconButton></Tooltip>}
                      {t.status === 'STARTED' && <Tooltip title="Complete Trip"><IconButton size="small" color="warning" onClick={() => openLifecycle(t, 'complete')}><Stop fontSize="small" /></IconButton></Tooltip>}
                      {!['COMPLETED', 'CANCELLED'].includes(t.status) && <Tooltip title="EditOutlined"><IconButton size="small" onClick={() => openEdit(t)}><EditOutlined sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>}
                      <Tooltip title="View"><IconButton size="small" onClick={() => openHistory(t)}><VisibilityOutlined sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>
                      {['DRAFT', 'SCHEDULED'].includes(t.status) && <Tooltip title="Cancel"><IconButton size="small" onClick={() => openLifecycle(t, 'cancel')}><CancelOutlined sx={{ fontSize: 17, color: '#ef4444' }} /></IconButton></Tooltip>}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={10} onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[10]}
          sx={{ borderTop: '1px solid', borderColor: 'divider', color: 'text.primary' }} />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: 'text.primary' }}>{editing ? 'EditOutlined Trip' : 'New Trip'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close sx={{ color: 'text.primary' }} /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'divider' }}>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}><TextField select fullWidth label="Trip Type *" value={form.tripType} onChange={(e) => setForm({ ...form, tripType: e.target.value })}>
              {TRIP_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Origin Name *" value={form.originName} onChange={(e) => setForm({ ...form, originName: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Destination Name *" value={form.destinationName} onChange={(e) => setForm({ ...form, destinationName: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={6}><TextField select fullWidth label="Vehicle" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              {vehicles.map((v) => <MenuItem key={v.id || v._id} value={v.id || v._id}>{v.vehicleNumber || v.licensePlate}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField select fullWidth label="Driver" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
              {drivers.map((d) => <MenuItem key={d.id || d._id} value={d.id || d._id}>{d.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Planned Start" type="datetime-local" value={form.plannedStartAt} onChange={(e) => setForm({ ...form, plannedStartAt: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Distance (km)" type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{editing ? 'Update' : 'Create Trip'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lifecycleDialog} onClose={() => setLifecycleDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ color: 'text.primary' }}>{lifecycleTitle[lifecycleAction]}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {lifecycleAction === 'complete' && <><TextField fullWidth label="End Odometer (km)" type="number" value={lifecycleForm.odometer} onChange={(e) => setLifecycleForm({ ...lifecycleForm, odometer: e.target.value })} /><TextField fullWidth label="Distance (km)" type="number" value={lifecycleForm.distanceKm} onChange={(e) => setLifecycleForm({ ...lifecycleForm, distanceKm: e.target.value })} /></>}
            {lifecycleAction === 'start' && <TextField fullWidth label="Start Odometer (km)" type="number" value={lifecycleForm.odometer} onChange={(e) => setLifecycleForm({ ...lifecycleForm, odometer: e.target.value })} />}
            <TextField fullWidth multiline rows={3} label={lifecycleAction === 'cancel' ? 'Reason for cancellation' : 'Notes'} value={lifecycleForm.notes} onChange={(e) => setLifecycleForm({ ...lifecycleForm, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLifecycleDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" color={lifecycleAction === 'cancel' ? 'error' : lifecycleAction === 'complete' ? 'warning' : 'primary'} onClick={handleLifecycle}>
            {lifecycleTitle[lifecycleAction]}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.primary' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>Trip History</Typography>
          <IconButton onClick={() => setHistoryDialog(false)} size="small"><Close sx={{ color: 'text.primary' }} /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'divider' }}>
          {historyLoading ? <Stack spacing={1}>{Array(3).fill(0).map((_, i) => <Skeleton key={i} height={40} sx={{ bgcolor: 'divider' }} />)}</Stack>
            : historyData.length === 0 ? <Typography sx={{ color: 'text.primary', py: 4, textAlign: 'center' }}>No history entries</Typography>
              : <Table stickyHeader size="small">
                <TableHead><TableRow>{['Action', 'From Status', 'To Status', 'Remarks', 'Date'].map(h => <TableCell key={h} sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>{historyData.map((h, i) => <TableRow key={i}><TableCell><Chip label={h.action} size="small" /></TableCell><TableCell sx={{ color: 'text.primary' }}>{h.fromStatus || '—'}</TableCell><TableCell>{h.toStatus ? <StatusChip status={h.toStatus} /> : '—'}</TableCell><TableCell sx={{ color: 'text.primary' }}>{h.remarks || '—'}</TableCell><TableCell sx={{ color: 'text.primary' }}>{fmt(h.createdAt)}</TableCell></TableRow>)}</TableBody>
              </Table>}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} title="Delete Trip" message="This action cannot be undone. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
