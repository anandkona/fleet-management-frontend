import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, InputAdornment, IconButton, Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { VEHICLES, REPAIR_TYPES, VENDORS, REPAIR_STATUSES } from '../services/mockData';

const EMPTY = { vehicle: '', vehicleType: '', model: '', type: '', vendor: '', date: '', cost: '', status: 'Pending', notes: '' };

export default function RepairFormDialog({ open, onClose, onSave, record }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(record ? { ...record } : { ...EMPTY, date: new Date().toISOString().split('T')[0] });
    setErrors({});
  }, [record, open]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleVehicleChange = (e, newValue) => {
    setForm((f) => {
      const selected = VEHICLES.find(v => v.label === newValue);
      return { ...f, vehicle: newValue || '', vehicleType: selected ? selected.vehicleType : '' };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.vehicle) e.vehicle = 'Vehicle is required';
    if (!form.type)    e.type    = 'Job type is required';
    if (!form.vendor)  e.vendor  = 'Vendor is required';
    if (!form.date)    e.date    = 'Date is required';
    if (!form.cost || isNaN(form.cost) || Number(form.cost) <= 0) e.cost = 'Enter a valid cost';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, cost: Number(form.cost) });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {record ? 'Edit repair record' : 'Log new repair'}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={VEHICLES.map((v) => v.label)}
              value={form.vehicle}
              onChange={handleVehicleChange}
              renderInput={(params) => (
                <TextField {...params} label="Vehicle" placeholder="Search vehicle…" error={!!errors.vehicle} helperText={errors.vehicle} />
              )}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Vehicle Type" value={form.vehicleType} InputProps={{ readOnly: true }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Model Name" value={form.model} onChange={set('model')} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Job type" value={form.type} onChange={set('type')} error={!!errors.type} helperText={errors.type}>
              {REPAIR_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Vendor / Workshop" value={form.vendor} onChange={set('vendor')} error={!!errors.vendor} helperText={errors.vendor}>
              {VENDORS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Repair date" type="date" value={form.date} onChange={set('date')} error={!!errors.date} helperText={errors.date} InputLabelProps={{ shrink: true }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Cost" type="number" value={form.cost} onChange={set('cost')}
              error={!!errors.cost} helperText={errors.cost}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Status" value={form.status} onChange={set('status')}>
              {REPAIR_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Notes" placeholder="Describe the repair work done…" value={form.notes} onChange={set('notes')} />
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
