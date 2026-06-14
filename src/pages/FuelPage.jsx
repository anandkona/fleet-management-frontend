import React, { useState } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, IconButton, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Stack,
  Skeleton, Typography, Tooltip, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, LocalGasStation, Close, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { fuelService } from '../services/api';
import { useApi, useMutation } from '../hooks/useApi';
import { ConfirmDialog, PageHeader, EmptyState } from '../components/Common';
import { PALETTE } from '../theme';
import { useAuth } from '../context/AuthContext';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];

const EMPTY = {
  vehicleId: '', driverId: '', fuelType: 'Petrol', liters: '', pricePerLiter: '',
  totalCost: '', odometer: '', date: '', station: '', notes: '',
};

function fmt(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dt; }
}

export default function FuelPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = useAuth();
  const [page, setPage]     = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);

  const queryParams = { page: page + 1, limit: 10, search: search || undefined };
  const { data, loading, refetch } = useApi(fuelService.getAll, queryParams, [page, search]);

  const { mutate: save,   loading: saving   } = useMutation(editing ? (d) => fuelService.update(editing.id ?? editing._id, d) : fuelService.create);
  const { mutate: remove, loading: deleting } = useMutation((id) => fuelService.delete(id));

  const logs  = data?.data ?? data ?? [];
  const total = data?.total ?? data?.count ?? logs.length;

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...EMPTY, ...r }); setDialogOpen(true); };
  const close    = () => { setDialogOpen(false); setEditing(null); };

  const handle = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    // Auto-calc total if liters and price both filled
    if (e.target.name === 'liters' || e.target.name === 'pricePerLiter') {
      const l = parseFloat(updated.liters);
      const p = parseFloat(updated.pricePerLiter);
      if (!isNaN(l) && !isNaN(p)) updated.totalCost = (l * p).toFixed(2);
    }
    setForm(updated);
  };

  const handleSave = async () => {
    const res = await save(form);
    if (res.success) { enqueueSnackbar(editing ? 'Log updated' : 'Fuel log added', { variant: 'success' }); close(); refetch(); }
    else enqueueSnackbar(res.message || 'Failed', { variant: 'error' });
  };

  const handleDelete = async () => {
    const res = await remove(deleteId);
    if (res.success) { enqueueSnackbar('Log removed', { variant: 'success' }); setDeleteId(null); refetch(); }
    else enqueueSnackbar(res.message || 'Delete failed', { variant: 'error' });
  };

  // Totals
  const totalLiters = logs.reduce((s, l) => s + parseFloat(l.liters || 0), 0);
  const totalCost   = logs.reduce((s, l) => s + parseFloat(l.totalCost || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Fuel Logs"
        subtitle={`${total} entries · ${totalLiters.toFixed(1)} L · ₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        action={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh />} onClick={refetch} variant="outlined" size="small">Refresh</Button>
            {hasPermission('fuel_create') && (
              <Button startIcon={<Add />} onClick={openAdd} variant="contained">Add Fuel Log</Button>
            )}
          </Stack>
        }
      />

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            placeholder="Search fuel logs…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ width: 300 }}
          />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Date', 'Vehicle', 'Driver', 'Fuel Type', 'Liters', 'Price/L', 'Total Cost', 'Odometer', 'Station', 'Actions'].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>{Array(10).fill(0).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={10} sx={{ border: 0 }}>
                  <EmptyState icon={<LocalGasStation sx={{ fontSize: 64, color: PALETTE.mist }} />} title="No fuel logs" description="Start tracking fuel consumption." action={<Button startIcon={<Add />} variant="contained" onClick={openAdd}>Add Fuel Log</Button>} />
                </TableCell></TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id ?? l._id} hover>
                    <TableCell>{fmt(l.date)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{l.vehicle?.plate ?? l.vehicleId ?? '—'}</TableCell>
                    <TableCell>{l.driver?.name ?? l.driverId ?? '—'}</TableCell>
                    <TableCell>{l.fuelType ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{l.liters ? `${l.liters} L` : '—'}</TableCell>
                    <TableCell>{l.pricePerLiter ? `₹${l.pricePerLiter}` : '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: PALETTE.teal }}>{l.totalCost ? `₹${Number(l.totalCost).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}</TableCell>
                    <TableCell>{l.odometer ? `${Number(l.odometer).toLocaleString()} km` : '—'}</TableCell>
                    <TableCell>{l.station ?? '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row">
                        {hasPermission('fuel_update') && (
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(l)}><Edit fontSize="small" /></IconButton></Tooltip>
                        )}
                        {hasPermission('fuel_update') && (
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(l.id ?? l._id)}><Delete fontSize="small" /></IconButton></Tooltip>
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

      <Dialog open={dialogOpen} onClose={close} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editing ? 'Edit Fuel Log' : 'Add Fuel Log'}</Typography>
          <IconButton onClick={close} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Vehicle ID" name="vehicleId" value={form.vehicleId} onChange={handle} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Driver ID" name="driverId" value={form.driverId} onChange={handle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Fuel Type" name="fuelType" value={form.fuelType} onChange={handle}>
                {FUEL_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date" name="date" type="date" value={form.date} onChange={handle} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Liters" name="liters" type="number" value={form.liters} onChange={handle} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Price per Liter (₹)" name="pricePerLiter" type="number" value={form.pricePerLiter} onChange={handle} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Total Cost (₹)" name="totalCost" type="number" value={form.totalCost} onChange={handle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Odometer (km)" name="odometer" type="number" value={form.odometer} onChange={handle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Station / Location" name="station" value={form.station} onChange={handle} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Notes" name="notes" value={form.notes} onChange={handle} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Add Log'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteId} title="Remove Fuel Log" message="This fuel log entry will be permanently deleted." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </Box>
  );
}
