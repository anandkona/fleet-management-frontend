import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Chip, Typography, Grid,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { vehicleService } from '../services/api';
import { StatusChip, PageHeader, EmptyState } from '../components/Common';
import { useAuth } from '../context/AuthContext';

const vehicleTypes = ['CAR', 'BIKE', 'VAN', 'TRUCK', 'BUS'];
const fuelTypes = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'];
const statuses = ['AVAILABLE', 'ON_TRIP', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'INACTIVE', 'SOLD', 'ACCIDENT'];

const emptyForm = {
  vehicleNumber: '', brand: '', model: '', vehicleType: 'CAR',
  fuelType: 'PETROL', status: 'AVAILABLE', year: '',
  chassisNumber: '', engineNumber: '', rcNumber: '',
  insuranceExpiry: '', fitnessExpiry: '', pollutionExpiry: '', permitExpiry: '',
  currentOdometer: 0, currentDriverId: '',
};

export default function VehiclesPage() {
  const { hasPermission } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleService.getAll({ limit: 100 });
      const d = res.data?.data ?? res.data;
      setVehicles(d?.items ?? (Array.isArray(d) ? d : []));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const openCreate = () => { setSelected(null); setForm(emptyForm); setError(''); setDialogOpen(true); };

  const openEdit = (v) => {
    setSelected(v);
    setForm({
      vehicleNumber: v.vehicleNumber || '',
      brand: v.brand || '',
      model: v.model || '',
      vehicleType: v.vehicleType || 'CAR',
      fuelType: v.fuelType || 'PETROL',
      status: v.status || 'AVAILABLE',
      year: v.year ?? '',
      chassisNumber: v.chassisNumber || '',
      engineNumber: v.engineNumber || '',
      rcNumber: v.rcNumber || '',
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : '',
      fitnessExpiry: v.fitnessExpiry ? v.fitnessExpiry.split('T')[0] : '',
      pollutionExpiry: v.pollutionExpiry ? v.pollutionExpiry.split('T')[0] : '',
      permitExpiry: v.permitExpiry ? v.permitExpiry.split('T')[0] : '',
      currentOdometer: v.currentOdometer ?? 0,
      currentDriverId: v.currentDriverId || '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.vehicleNumber || !form.vehicleType || !form.fuelType) {
      setError('Vehicle Number, Type, and Fuel Type are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        year: form.year !== '' ? Number(form.year) : undefined,
        currentOdometer: form.currentOdometer ? Number(form.currentOdometer) : 0,
        brand: form.brand || undefined,
        model: form.model || undefined,
        chassisNumber: form.chassisNumber || undefined,
        engineNumber: form.engineNumber || undefined,
        rcNumber: form.rcNumber || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        fitnessExpiry: form.fitnessExpiry || undefined,
        pollutionExpiry: form.pollutionExpiry || undefined,
        permitExpiry: form.permitExpiry || undefined,
        currentDriverId: form.currentDriverId || undefined,
      };
      if (selected) {
        await vehicleService.update(selected.id, payload);
      } else {
        await vehicleService.create(payload);
      }
      setDialogOpen(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    }
    setSaving(false);
  };

  return (
    <Box>
      <PageHeader
        title="Vehicles"
        subtitle="Manage your fleet vehicles"
        action={hasPermission('vehicle_create') ? (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Vehicle</Button>
        ) : null}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {['Number', 'Brand', 'Model', 'Type', 'Fuel', 'Status', ''].map((h) => <TableCell key={h}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>Loading...</TableCell></TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow><TableCell colSpan={7}><EmptyState icon="🚗" title="No vehicles" description="Add your first vehicle to get started" action={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Vehicle</Button>} /></TableCell></TableRow>
            ) : vehicles.map((v) => (
              <TableRow key={v.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.vehicleNumber}</Typography>
                  {v.year && <Typography variant="caption" color="text.secondary" display="block">{v.year}</Typography>}
                </TableCell>
                <TableCell>{v.brand || '—'}</TableCell>
                <TableCell>{v.model || '—'}</TableCell>
                <TableCell><Chip label={v.vehicleType} size="small" variant="outlined" /></TableCell>
                <TableCell>{v.fuelType || '—'}</TableCell>
                <TableCell><StatusChip status={v.status} /></TableCell>
                <TableCell>
                  {hasPermission('vehicle_update') && (
                    <IconButton size="small" onClick={() => openEdit(v)}><Edit fontSize="small" /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selected ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label="Vehicle Number *" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} fullWidth required />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Vehicle Type *" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} select fullWidth>
                  {vehicleTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField label="Fuel Type *" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} select fullWidth>
                  {fuelTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} type="number" fullWidth />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label="Chassis Number" value={form.chassisNumber} onChange={(e) => setForm({ ...form, chassisNumber: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Engine Number" value={form.engineNumber} onChange={(e) => setForm({ ...form, engineNumber: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={4}>
                <TextField label="RC Number" value={form.rcNumber} onChange={(e) => setForm({ ...form, rcNumber: e.target.value })} fullWidth />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField label="Insurance Expiry" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={3}>
                <TextField label="Fitness Expiry" value={form.fitnessExpiry} onChange={(e) => setForm({ ...form, fitnessExpiry: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={3}>
                <TextField label="Pollution Expiry" value={form.pollutionExpiry} onChange={(e) => setForm({ ...form, pollutionExpiry: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={3}>
                <TextField label="Permit Expiry" value={form.permitExpiry} onChange={(e) => setForm({ ...form, permitExpiry: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
            </Grid>
            <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} select fullWidth>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
