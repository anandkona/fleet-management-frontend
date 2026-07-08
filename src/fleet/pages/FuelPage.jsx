import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent,
  TextField, MenuItem, IconButton, Tooltip, Snackbar, Alert,
  Chip, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReceiptIcon from '@mui/icons-material/Receipt';

import { PageHeader, ConfirmDialog } from '../components/Common';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];
const ENTRY_MODES = ['QUICK_AMOUNT', 'FULL_DETAILS'];
const PAYMENT_MODES = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER'];

const fallbackFuel = [
  { id: '1', vehicleId: 'V1', vehicle: { vehicleNumber: 'AP05-T123' }, fuelDate: '2026-06-22T10:00:00Z', fuelType: 'Diesel', totalAmount: 4200, quantityLiters: 120, pricePerLiter: 35, odometerReading: 45230, status: 'APPROVED', stationName: 'HPCL Vizag Port' },
  { id: '2', vehicleId: 'V2', vehicle: { vehicleNumber: 'AP05-T087' }, fuelDate: '2026-06-21T14:30:00Z', fuelType: 'Diesel', totalAmount: 3800, quantityLiters: 100, pricePerLiter: 38, odometerReading: 31450, status: 'SUBMITTED', stationName: 'BPCL Gajuwaka' },
];

const EMPTY_FORM = {
  vehicleId: '',
  fuelDate: new Date().toISOString().slice(0, 16),
  fuelType: 'Diesel',
  entryMode: 'FULL_DETAILS',
  quantityLiters: '',
  pricePerLiter: '',
  totalAmount: '',
  paymentMode: 'UPI',
  stationName: '',
  receiptNumber: '',
  odometerReading: '',
  notes: ''
};

export default function FuelPage() {
  const { addNotification } = useNotification();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [actionDialog, setActionDialog] = useState({ open: false, action: null, doc: null });

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fuelRes, vehRes] = await Promise.allSettled([
        api.get('/fuel', { params: { limit: 100 } }),
        api.get('/vehicles', { params: { limit: 100 } })
      ]);

      if (vehRes.status === 'fulfilled') {
        const vItems = vehRes.value.data?.data?.items ?? (Array.isArray(vehRes.value.data?.data) ? vehRes.value.data.data : []);
        setVehicles(vItems);
      } else {
        console.warn('Failed to fetch vehicles', vehRes.reason);
      }

      if (fuelRes.status === 'fulfilled') {
        const items = fuelRes.value.data?.data?.items ?? (Array.isArray(fuelRes.value.data?.data) ? fuelRes.value.data.data : []);
        setRows(items);
      } else {
        throw new Error('Fuel fetch failed');
      }


    } catch (err) {
      console.warn('API /fuel failed, using fallback data');
      setRows(fallbackFuel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        quantityLiters: form.quantityLiters ? Number(form.quantityLiters) : undefined,
        pricePerLiter: form.pricePerLiter ? Number(form.pricePerLiter) : undefined,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
        odometerReading: form.odometerReading ? Number(form.odometerReading) : undefined,
        fuelDate: new Date(form.fuelDate).toISOString()
      };
      await api.post('/fuel', payload);
      toast('Fuel entry created successfully');
      addNotification('Fuel Entry Created', `Added fuel entry for ${payload.totalAmount}`, 'success');
      setFormOpen(false);
      fetchData();
    } catch (err) {
      console.warn('API create fuel failed, mocking locally');
      setRows([{ ...form, id: Math.random().toString(), vehicle: { vehicleNumber: form.vehicleId || 'Unknown' }, status: 'DRAFT', fuelDate: new Date(form.fuelDate).toISOString() }, ...rows]);
      toast('Fuel entry created successfully (Mocked)', 'warning');
      setFormOpen(false);
    }
  };

  const handleActionConfirm = async () => {
    const { action, doc } = actionDialog;
    try {
      await api.post(`/fuel/${doc.id}/${action}`);
      toast(`Fuel entry ${action}d successfully`);
      addNotification(`Fuel ${action}`, `Successfully ${action}d fuel entry`, 'success');
      fetchData();
    } catch (err) {
      console.warn(`API ${action} failed, mocking locally`);
      const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : action === 'cancel' ? 'CANCELLED' : 'SUBMITTED';
      setRows(prev => prev.map(r => r.id === doc.id ? { ...r, status: newStatus } : r));
      toast(`Fuel entry ${action}d successfully (Mocked)`, 'warning');
    }
    setActionDialog({ open: false, action: null, doc: null });
  };

  const statusColor = (s) => {
    switch (s) {
      case 'APPROVED': return 'success';
      case 'SUBMITTED': return 'primary';
      case 'REJECTED': case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="contained" onClick={() => { setForm(EMPTY_FORM); setFormOpen(true); }} startIcon={<AddIcon />} sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Add Fuel</Button>
        </Box>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Date', 'Vehicle', 'Fuel Type', 'Station', 'Qty (L)', 'Total (₹)', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h.includes('Qty') || h.includes('Total') || h === 'Status' || h === 'Actions' ? (h === 'Status' || h === 'Actions' ? 'center' : 'right') : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">No fuel entries found</TableCell></TableRow>
              ) : rows.map((r, i) => (
                <TableRow key={r.id || i}>
                  <TableCell>{new Date(r.fuelDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{r.vehicle?.vehicleNumber || r.vehicleId}</TableCell>
                  <TableCell>{r.fuelType}</TableCell>
                  <TableCell>{r.stationName || '—'}</TableCell>
                  <TableCell align="right">{r.quantityLiters || '—'}</TableCell>
                  <TableCell align="right">₹{r.totalAmount}</TableCell>
                  <TableCell align="center">
                    <Chip label={r.status || 'DRAFT'} size="small" color={statusColor(r.status)} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {(r.status === 'SUBMITTED' || r.status === 'DRAFT') && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => setActionDialog({ open: true, action: 'approve', doc: r })}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => setActionDialog({ open: true, action: 'reject', doc: r })}>
                              <CancelOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Fuel Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Fuel Entry</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Vehicle</InputLabel>
            <Select value={form.vehicleId} label="Vehicle" onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
              {vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.vehicleNumber} {v.brand ? `- ${v.brand}` : ''}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField type="datetime-local" label="Fuel Date" value={form.fuelDate} onChange={e => setForm({ ...form, fuelDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Entry Mode</InputLabel>
              <Select value={form.entryMode} label="Entry Mode" onChange={e => setForm({ ...form, entryMode: e.target.value })}>
                {ENTRY_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Fuel Type</InputLabel>
              <Select value={form.fuelType} label="Fuel Type" onChange={e => setForm({ ...form, fuelType: e.target.value })}>
                {FUEL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Total Amount (₹)" type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} fullWidth size="small" />
            <TextField label="Quantity (Liters)" type="number" value={form.quantityLiters} onChange={e => setForm({ ...form, quantityLiters: e.target.value })} fullWidth size="small" disabled={form.entryMode === 'QUICK_AMOUNT'} />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Station Name" value={form.stationName} onChange={e => setForm({ ...form, stationName: e.target.value })} fullWidth size="small" />
            <TextField label="Odometer" type="number" value={form.odometerReading} onChange={e => setForm({ ...form, odometerReading: e.target.value })} fullWidth size="small" />
          </Stack>

          <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={actionDialog.open}
        title={`Confirm ${actionDialog.action}`}
        message={`Are you sure you want to ${actionDialog.action} this fuel entry?`}
        onConfirm={handleActionConfirm}
        onCancel={() => setActionDialog({ open: false, action: null, doc: null })}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
