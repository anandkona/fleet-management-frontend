import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, InputAdornment, IconButton, Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { VEHICLES, MAINTENANCE_TYPES, MAINTENANCE_STATUSES } from '../services/mockData';

const EMPTY = { vehicle: '', model: '', type: '', lastDone: '', nextDue: '', odometer: '', nextOdometer: '', status: 'Scheduled', notes: '' };

export default function MaintenanceFormDialog({ open, onClose, onSave, record }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(record ? { ...record } : { ...EMPTY, lastDone: new Date().toISOString().split('T')[0] });
    setErrors({});
  }, [record, open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.vehicle)      e.vehicle      = 'Vehicle is required';
    if (!form.type)         e.type         = 'Service type is required';
    if (!form.lastDone)     e.lastDone     = 'Last service date is required';
    if (!form.nextDue)      e.nextDue      = 'Next due date is required';
    if (!form.odometer)     e.odometer     = 'Current odometer is required';
    if (!form.nextOdometer) e.nextOdometer = 'Next due odometer is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, odometer: Number(form.odometer), nextOdometer: Number(form.nextOdometer) });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {record ? 'Edit maintenance record' : 'Schedule maintenance'}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={VEHICLES.map((v) => v.label)}
              value={form.vehicle}
              onChange={(e, newValue) => setForm((f) => ({ ...f, vehicle: newValue || '' }))}
              renderInput={(params) => (
                <TextField {...params} label="Vehicle" placeholder="Search vehicle…" error={!!errors.vehicle} helperText={errors.vehicle} />
              )}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Model name" value={form.model} onChange={set('model')} error={!!errors.model} helperText={errors.model} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Service type" value={form.type} onChange={set('type')} error={!!errors.type} helperText={errors.type}>
              {MAINTENANCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Last service date" type="date" value={form.lastDone} onChange={set('lastDone')} error={!!errors.lastDone} helperText={errors.lastDone} InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Next due date" type="date" value={form.nextDue} onChange={set('nextDue')} error={!!errors.nextDue} helperText={errors.nextDue} InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Current odometer" type="number" value={form.odometer} onChange={set('odometer')}
              error={!!errors.odometer} helperText={errors.odometer}
              InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Next due at (odometer)" type="number" value={form.nextOdometer} onChange={set('nextOdometer')}
              error={!!errors.nextOdometer} helperText={errors.nextOdometer}
              InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Status" value={form.status} onChange={set('status')}>
              {MAINTENANCE_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Notes" placeholder="Any additional notes for this service…" value={form.notes} onChange={set('notes')} />
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small">Save record</Button>
      </DialogActions>
    </Dialog>
  );
}
