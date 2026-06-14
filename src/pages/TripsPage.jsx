import React, { useState } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, IconButton, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Stack,
  Skeleton, Typography, Tooltip, InputAdornment, Chip, Tab, Tabs,
} from '@mui/material';
import { Add, Edit, Search, Route, Close, PlayArrow, Stop, Refresh, Cancel, Schedule, History } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { tripService, vehicleService, driverService } from '../services/api';
import { useApi, useMutation } from '../hooks/useApi';
import { StatusChip, ConfirmDialog, PageHeader, EmptyState } from '../components/Common';
import { PALETTE } from '../theme';
import { useAuth } from '../context/AuthContext';

const TRIP_TYPES = ['TRANSFER', 'DELIVERY', 'PICKUP', 'SERVICE', 'INTERNAL'];
const STATUSES = ['DRAFT', 'SCHEDULED', 'STARTED', 'COMPLETED', 'CANCELLED'];

const EMPTY = {
  tripType: 'TRANSFER',
  vehicleId: '',
  driverId: '',
  assistantDriverId: '',
  originName: '',
  originAddress: '',
  destinationName: '',
  destinationAddress: '',
  plannedStartAt: '',
  plannedEndAt: '',
  purpose: '',
  notes: '',
};

const SCHEDULE_EMPTY = { plannedStartAt: '', plannedEndAt: '', notes: '' };
const START_EMPTY = { actualStartAt: '', startOdometer: '', notes: '' };
const COMPLETE_EMPTY = { actualEndAt: '', endOdometer: '', distanceKm: '', notes: '' };
const CANCEL_EMPTY = { notes: '' };

function fmt(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return dt; }
}

function fmtShort(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dt; }
}

export default function TripsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);

  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(SCHEDULE_EMPTY);

  const [startDialog, setStartDialog] = useState(false);
  const [startTarget, setStartTarget] = useState(null);
  const [startForm, setStartForm] = useState(START_EMPTY);

  const [completeDialog, setCompleteDialog] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeForm, setCompleteForm] = useState(COMPLETE_EMPTY);

  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelForm, setCancelForm] = useState(CANCEL_EMPTY);

  const [historyDialog, setHistoryDialog] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const queryParams = {
    page: page + 1,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
    tripType: typeFilter || undefined,
  };
  const { data, loading, refetch } = useApi(tripService.getAll, queryParams, [page, search, statusFilter, typeFilter]);

  const { mutate: save, loading: saving } = useMutation(
    editing ? (d) => tripService.update(editing.id, d) : tripService.create
  );
  const { mutate: scheduleTrip } = useMutation((id, d) => tripService.schedule(id, d));
  const { mutate: startTrip } = useMutation((id, d) => tripService.start(id, d));
  const { mutate: completeTrip } = useMutation((id, d) => tripService.complete(id, d));
  const { mutate: cancelTrip } = useMutation((id, d) => tripService.cancel(id, d));

  const { data: vehiclesData } = useApi(vehicleService.getAll, { limit: 100 }, []);
  const { data: driversData } = useApi(driverService.getAll, { limit: 100 }, []);

  const vehicles = vehiclesData?.items ?? (Array.isArray(vehiclesData) ? vehiclesData : []);
  const drivers = driversData?.items ?? (Array.isArray(driversData) ? driversData : []);

  const tripList = data?.items ?? (Array.isArray(data) ? data : []);
  const total = data?.pagination?.total ?? tripList.length;

  const openAdd = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      tripType: t.tripType || 'TRANSFER',
      vehicleId: t.vehicleId || '',
      driverId: t.driverId || '',
      assistantDriverId: t.assistantDriverId || '',
      originName: t.originName || '',
      originAddress: t.originAddress || '',
      destinationName: t.destinationName || '',
      destinationAddress: t.destinationAddress || '',
      plannedStartAt: t.plannedStartAt ? t.plannedStartAt.slice(0, 16) : '',
      plannedEndAt: t.plannedEndAt ? t.plannedEndAt.slice(0, 16) : '',
      purpose: t.purpose || '',
      notes: t.notes || '',
    });
    setDialogOpen(true);
  };
  const close = () => { setDialogOpen(false); setEditing(null); };
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.originName || !form.destinationName) {
      enqueueSnackbar('Origin and Destination are required', { variant: 'warning' });
      return;
    }
    const payload = {
      ...form,
      vehicleId: form.vehicleId || undefined,
      driverId: form.driverId || undefined,
      assistantDriverId: form.assistantDriverId || undefined,
      plannedStartAt: form.plannedStartAt || undefined,
      plannedEndAt: form.plannedEndAt || undefined,
      purpose: form.purpose || undefined,
      notes: form.notes || undefined,
    };
    const res = await save(payload);
    if (res.success !== false) {
      enqueueSnackbar(editing ? 'Trip updated' : 'Trip created', { variant: 'success' });
      close();
      refetch();
    } else {
      enqueueSnackbar(res.message || 'Failed', { variant: 'error' });
    }
  };

  const openSchedule = (t) => {
    setScheduleTarget(t);
    setScheduleForm({
      plannedStartAt: t.plannedStartAt ? t.plannedStartAt.slice(0, 16) : '',
      plannedEndAt: t.plannedEndAt ? t.plannedEndAt.slice(0, 16) : '',
      notes: t.notes || '',
    });
    setScheduleDialog(true);
  };
  const handleSchedule = async () => {
    const res = await scheduleTrip(scheduleTarget.id, {
      ...scheduleForm,
      plannedStartAt: scheduleForm.plannedStartAt || undefined,
      plannedEndAt: scheduleForm.plannedEndAt || undefined,
    });
    if (res.success !== false) {
      enqueueSnackbar('Trip scheduled', { variant: 'success' });
      setScheduleDialog(false);
      refetch();
    } else {
      enqueueSnackbar(res.message || 'Failed to schedule', { variant: 'error' });
    }
  };

  const openStart = (t) => {
    setStartTarget(t);
    setStartForm({ actualStartAt: '', startOdometer: '', notes: '' });
    setStartDialog(true);
  };
  const handleStart = async () => {
    const res = await startTrip(startTarget.id, {
      actualStartAt: startForm.actualStartAt || undefined,
      startOdometer: startForm.startOdometer ? Number(startForm.startOdometer) : undefined,
      notes: startForm.notes || undefined,
    });
    if (res.success !== false) {
      enqueueSnackbar('Trip started', { variant: 'success' });
      setStartDialog(false);
      refetch();
    } else {
      enqueueSnackbar(res.message || 'Failed to start', { variant: 'error' });
    }
  };

  const openComplete = (t) => {
    setCompleteTarget(t);
    setCompleteForm({ actualEndAt: '', endOdometer: '', distanceKm: '', notes: '' });
    setCompleteDialog(true);
  };
  const handleComplete = async () => {
    const res = await completeTrip(completeTarget.id, {
      actualEndAt: completeForm.actualEndAt || undefined,
      endOdometer: completeForm.endOdometer ? Number(completeForm.endOdometer) : undefined,
      distanceKm: completeForm.distanceKm ? Number(completeForm.distanceKm) : undefined,
      notes: completeForm.notes || undefined,
    });
    if (res.success !== false) {
      enqueueSnackbar('Trip completed', { variant: 'success' });
      setCompleteDialog(false);
      refetch();
    } else {
      enqueueSnackbar(res.message || 'Failed to complete', { variant: 'error' });
    }
  };

  const openCancel = (t) => {
    setCancelTarget(t);
    setCancelForm({ notes: '' });
    setCancelDialog(true);
  };
  const handleCancel = async () => {
    const res = await cancelTrip(cancelTarget.id, { notes: cancelForm.notes || undefined });
    if (res.success !== false) {
      enqueueSnackbar('Trip cancelled', { variant: 'success' });
      setCancelDialog(false);
      refetch();
    } else {
      enqueueSnackbar(res.message || 'Failed to cancel', { variant: 'error' });
    }
  };

  const openHistory = async (t) => {
    setHistoryTarget(t);
    setHistoryDialog(true);
    setHistoryLoading(true);
    try {
      const res = await tripService.history(t.id);
      setHistoryData(res.data?.data ?? res.data ?? []);
    } catch {
      setHistoryData([]);
    }
    setHistoryLoading(false);
  };

  return (
    <Box>
      <PageHeader
        title="Trips"
        subtitle={`${total} trips recorded`}
        action={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh />} onClick={refetch} variant="outlined" size="small">Refresh</Button>
            {hasPermission('trip_create') && (
              <Button startIcon={<Add />} onClick={openAdd} variant="contained">New Trip</Button>
            )}
          </Stack>
        }
      />

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search trips…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ width: 280 }}
            size="small"
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField
            select
            size="small"
            label="Type"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {TRIP_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Trip #', 'Type', 'Route', 'Driver', 'Vehicle', 'Dates', 'Distance', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <TableRow key={i}>{Array(9).fill(0).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                ))
              ) : tripList.length === 0 ? (
                <TableRow><TableCell colSpan={9} sx={{ border: 0 }}>
                  <EmptyState icon={<Route sx={{ fontSize: 64, color: PALETTE.mist }} />} title="No trips found" description="Create a trip to start tracking." action={<Button startIcon={<Add />} variant="contained" onClick={openAdd}>New Trip</Button>} />
                </TableCell></TableRow>
              ) : (
                tripList.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: PALETTE.teal, fontWeight: 700, fontSize: '0.78rem' }}>
                      {t.tripNumber || `#${String(t.id).slice(-6)}`}
                    </TableCell>
                    <TableCell><Chip label={t.tripType} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{t.originName || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">→ {t.destinationName || '—'}</Typography>
                    </TableCell>
                    <TableCell>{t.driverId || '—'}</TableCell>
                    <TableCell>{t.vehicleId || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">{fmtShort(t.plannedStartAt)}</Typography>
                      {t.plannedEndAt && <Typography variant="caption" color="text.secondary">{fmtShort(t.plannedEndAt)}</Typography>}
                    </TableCell>
                    <TableCell>{t.distanceKm ? `${t.distanceKm} km` : '—'}</TableCell>
                    <TableCell><StatusChip status={t.status} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {t.status === 'DRAFT' && hasPermission('trip_update') && (
                          <Tooltip title="Schedule">
                            <IconButton size="small" color="primary" onClick={() => openSchedule(t)}>
                              <Schedule fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(t.status === 'SCHEDULED') && hasPermission('trip_start') && (
                          <Tooltip title="Start Trip">
                            <IconButton size="small" color="success" onClick={() => openStart(t)}>
                              <PlayArrow fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {t.status === 'STARTED' && hasPermission('trip_end') && (
                          <Tooltip title="Complete Trip">
                            <IconButton size="small" color="warning" onClick={() => openComplete(t)}>
                              <Stop fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {['DRAFT', 'SCHEDULED'].includes(t.status) && hasPermission('trip_cancel') && (
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="error" onClick={() => openCancel(t)}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {hasPermission('trip_update') && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {hasPermission('trip_view') && (
                          <Tooltip title="History">
                            <IconButton size="small" onClick={() => openHistory(t)}><History fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={10} onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[10]} />
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={close} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editing ? 'Edit Trip' : 'New Trip'}</Typography>
          <IconButton onClick={close} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Trip Type *" name="tripType" value={form.tripType} onChange={handle}>
                {TRIP_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Origin Name *" name="originName" value={form.originName} onChange={handle} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Origin Address" name="originAddress" value={form.originAddress} onChange={handle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Destination Name *" name="destinationName" value={form.destinationName} onChange={handle} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Destination Address" name="destinationAddress" value={form.destinationAddress} onChange={handle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Vehicle" name="vehicleId" value={form.vehicleId} onChange={handle}
              >
                <MenuItem value="">None</MenuItem>
                {vehicles.map((v) => <MenuItem key={v.id} value={v.id}>{v.vehicleNumber}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Driver" name="driverId" value={form.driverId} onChange={handle}
              >
                <MenuItem value="">None</MenuItem>
                {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Assistant Driver" name="assistantDriverId" value={form.assistantDriverId} onChange={handle}
              >
                <MenuItem value="">None</MenuItem>
                {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Planned Start" name="plannedStartAt" type="datetime-local" value={form.plannedStartAt} onChange={handle} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Planned End" name="plannedEndAt" type="datetime-local" value={form.plannedEndAt} onChange={handle} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Purpose" name="purpose" value={form.purpose} onChange={handle} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Notes" name="notes" value={form.notes} onChange={handle} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Create Trip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Trip</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField fullWidth label="Planned Start" type="datetime-local" value={scheduleForm.plannedStartAt} onChange={(e) => setScheduleForm({ ...scheduleForm, plannedStartAt: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Planned End" type="datetime-local" value={scheduleForm.plannedEndAt} onChange={(e) => setScheduleForm({ ...scheduleForm, plannedEndAt: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth multiline rows={2} label="Notes" value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setScheduleDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSchedule}>Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Start Dialog */}
      <Dialog open={startDialog} onClose={() => setStartDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start Trip</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField fullWidth label="Actual Start Time" type="datetime-local" value={startForm.actualStartAt} onChange={(e) => setStartForm({ ...startForm, actualStartAt: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="Start Odometer (km)" type="number" value={startForm.startOdometer} onChange={(e) => setStartForm({ ...startForm, startOdometer: e.target.value })} />
            <TextField fullWidth multiline rows={2} label="Notes" value={startForm.notes} onChange={(e) => setStartForm({ ...startForm, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStartDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleStart}>Start Trip</Button>
        </DialogActions>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Trip</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField fullWidth label="Actual End Time" type="datetime-local" value={completeForm.actualEndAt} onChange={(e) => setCompleteForm({ ...completeForm, actualEndAt: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label="End Odometer (km)" type="number" value={completeForm.endOdometer} onChange={(e) => setCompleteForm({ ...completeForm, endOdometer: e.target.value })} />
            <TextField fullWidth label="Distance (km)" type="number" value={completeForm.distanceKm} onChange={(e) => setCompleteForm({ ...completeForm, distanceKm: e.target.value })} />
            <TextField fullWidth multiline rows={2} label="Notes" value={completeForm.notes} onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCompleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleComplete}>Complete Trip</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Trip</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField fullWidth multiline rows={3} label="Reason for cancellation" value={cancelForm.notes} onChange={(e) => setCancelForm({ ...cancelForm, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelDialog(false)}>Close</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>Cancel Trip</Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Trip History</Typography>
          <IconButton onClick={() => setHistoryDialog(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Stack spacing={1}>{Array(4).fill(0).map((_, i) => <Skeleton key={i} height={40} />)}</Stack>
          ) : historyData.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No history entries</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>From Status</TableCell>
                  <TableCell>To Status</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell><Chip label={h.action} size="small" /></TableCell>
                    <TableCell>{h.fromStatus || '—'}</TableCell>
                    <TableCell>{h.toStatus ? <StatusChip status={h.toStatus} /> : '—'}</TableCell>
                    <TableCell>{h.remarks || '—'}</TableCell>
                    <TableCell>{fmt(h.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
