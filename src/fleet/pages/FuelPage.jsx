import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent,
  TextField, MenuItem, IconButton, Tooltip, Snackbar, Alert,
  Chip, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, InputAdornment, Grid, Divider, GlobalStyles
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SpeedIcon from '@mui/icons-material/Speed';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import NotesIcon from '@mui/icons-material/Notes';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';

import { PageHeader, ConfirmDialog } from '../components/Common';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];
const ENTRY_MODES = ['QUICK_AMOUNT', 'FULL_DETAILS', 'RECEIPT_ASSISTED'];
const PAYMENT_MODES = ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'CREDIT', 'OTHER'];



const EMPTY_FORM = {
  vehicleId: '',
  tripId: '',
  driverId: '',
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
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [actionDialog, setActionDialog] = useState({ open: false, action: null, doc: null });
  const [viewDialog, setViewDialog] = useState({ open: false, doc: null });
  const [editing, setEditing] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fuelRes, vehRes, driverRes, tripRes] = await Promise.allSettled([
        api.get('/fuel', { params: { limit: 100 } }),
        api.get('/vehicles', { params: { limit: 100 } }),
        api.get('/drivers', { params: { limit: 100 } }),
        api.get('/trips', { params: { limit: 100 } })
      ]);

      if (vehRes.status === 'fulfilled') {
        const vItems = vehRes.value.data?.data?.items ?? (Array.isArray(vehRes.value.data?.data) ? vehRes.value.data.data : []);
        setVehicles(vItems);
      }
      if (driverRes.status === 'fulfilled') {
        const dItems = driverRes.value.data?.data?.items ?? (Array.isArray(driverRes.value.data?.data) ? driverRes.value.data.data : []);
        setDrivers(dItems);
      }
      if (tripRes.status === 'fulfilled') {
        const tItems = tripRes.value.data?.data?.items ?? (Array.isArray(tripRes.value.data?.data) ? tripRes.value.data.data : []);
        setTrips(tItems);
      }

      if (fuelRes.status === 'fulfilled') {
        const items = fuelRes.value.data?.data?.items ?? (Array.isArray(fuelRes.value.data?.data) ? fuelRes.value.data.data : []);
        setRows(items);
      } else {
        throw new Error('Fuel fetch failed');
      }


    } catch (err) {
      console.error('API /fuel failed', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.vehicleId) { toast('Please select a vehicle', 'warning'); return; }
    
    if (form.entryMode === 'FULL_DETAILS') {
      if (!form.quantityLiters) {
        toast('Quantity is required for Full Details mode', 'warning'); return;
      }
      if (!form.pricePerLiter && !form.totalAmount) {
        toast('Either Price/Liter or Total Amount must be provided', 'warning'); return;
      }
    } else if (form.entryMode === 'QUICK_AMOUNT') {
      if (!form.totalAmount) {
        toast('Total Amount is required for Quick Amount mode', 'warning'); return;
      }
    }

    try {
      const payload = { ...form, fuelDate: new Date(form.fuelDate).toISOString() };
      
      // Clean up payload based on entryMode
      if (form.entryMode === 'FULL_DETAILS') {
        payload.quantityLiters = Number(form.quantityLiters);
        if (form.pricePerLiter) {
          payload.pricePerLiter = Number(form.pricePerLiter);
          payload.totalAmount = form.totalAmount ? Number(form.totalAmount) : (payload.quantityLiters * payload.pricePerLiter);
        } else {
          payload.totalAmount = Number(form.totalAmount);
          payload.pricePerLiter = payload.totalAmount / payload.quantityLiters;
        }
      } else {
        payload.totalAmount = Number(form.totalAmount);
        delete payload.quantityLiters;
        delete payload.pricePerLiter;
      }
      
      if (form.odometerReading) payload.odometerReading = Number(form.odometerReading);
      else delete payload.odometerReading;
      
      // Strip all empty strings from payload to prevent 422 min(1) string errors
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') delete payload[key];
      });
      
      if (editing) {
        await api.patch(`/fuel/${editing.id}`, payload);
        toast('Fuel entry updated successfully');
        addNotification('Fuel Entry Updated', `Updated fuel entry for ${payload.totalAmount}`, 'success');
      } else {
        await api.post('/fuel', payload);
        toast('Fuel entry created successfully');
        addNotification('Fuel Entry Created', `Added fuel entry for ${payload.totalAmount}`, 'success');
      }
      setFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast(`Failed to ${editing ? 'update' : 'create'} fuel entry: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const openEdit = (doc) => {
    setViewDialog({ open: false, doc: null });
    setEditing(doc);
    setForm({
      vehicleId: doc.vehicleId || '',
      tripId: doc.tripId || '',
      driverId: doc.driverId || '',
      fuelDate: doc.fuelDate ? new Date(doc.fuelDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      fuelType: doc.fuelType || 'Diesel',
      entryMode: doc.entryMode || 'FULL_DETAILS',
      quantityLiters: doc.quantityLiters || '',
      pricePerLiter: doc.pricePerLiter || '',
      totalAmount: doc.totalAmount || '',
      paymentMode: doc.paymentMode || 'UPI',
      stationName: doc.stationName || '',
      receiptNumber: doc.receiptNumber || '',
      odometerReading: doc.odometerReading || '',
      notes: doc.notes || ''
    });
    setFormOpen(true);
  };

  const handleActionConfirm = async () => {
    const { action, doc } = actionDialog;
    try {
      await api.post(`/fuel/${doc.id}/${action}`);
      toast(`Fuel entry ${action}d successfully`);
      addNotification(`Fuel ${action}`, `Successfully ${action}d fuel entry`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      toast(`Failed to ${action} fuel entry`, 'error');
    }
    setActionDialog({ open: false, action: null, doc: null });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fuel entry?')) return;
    try {
      await api.delete(`/fuel/${id}`);
      toast('Fuel entry deleted successfully');
      addNotification('Fuel Entry Deleted', 'Successfully deleted fuel entry', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      toast('Failed to delete fuel entry', 'error');
    }
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
          <Button variant="contained" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); }} startIcon={<AddIcon />} sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Add Fuel</Button>
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
                      <Tooltip title="View Details">
                        <IconButton size="small"  onClick={() => setViewDialog({ open: true, doc: r })} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                          <VisibilityIcon sx={{ fontSize: 17 }}  />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(r)} sx={{ bgcolor: '#f59e0b15', color: '#f59e0b', '&:hover': { bgcolor: '#f59e0b30' } }}>
                          <EditIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      {(r.status === 'SUBMITTED' || r.status === 'DRAFT') && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small"  onClick={() => setActionDialog({ open: true, action: 'approve', doc: r })} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
                              <CheckCircleOutlineIcon sx={{ fontSize: 17 }}  />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small"  onClick={() => setActionDialog({ open: true, action: 'reject', doc: r })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                              <CancelOutlinedIcon sx={{ fontSize: 17 }}  />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(r.id || r._id)} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                          <DeleteIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
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
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicle</InputLabel>
              <Select value={form.vehicleId} label="Vehicle" onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                {vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.vehicleNumber} {v.brand ? `- ${v.brand}` : ''}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField type="datetime-local" label="Fuel Date" value={form.fuelDate} onChange={e => setForm({ ...form, fuelDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Driver (Optional)</InputLabel>
              <Select value={form.driverId} label="Driver (Optional)" onChange={e => setForm({ ...form, driverId: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {drivers.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Trip (Optional)</InputLabel>
              <Select value={form.tripId} label="Trip (Optional)" onChange={e => setForm({ ...form, tripId: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {trips.map(t => <MenuItem key={t.id} value={t.id}>{t.tripNumber || `#${String(t.id).slice(-6)}`}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

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
            <TextField label="Quantity (Liters)" type="number" value={form.quantityLiters} onChange={e => {
              const q = e.target.value;
              let t = form.totalAmount;
              if (q && form.pricePerLiter && form.entryMode === 'FULL_DETAILS') t = (Number(q) * Number(form.pricePerLiter)).toFixed(2);
              setForm({ ...form, quantityLiters: q, totalAmount: t });
            }} fullWidth size="small" disabled={form.entryMode === 'QUICK_AMOUNT'} />
            
            <TextField label="Price/Liter" type="number" value={form.pricePerLiter} onChange={e => {
              const p = e.target.value;
              let t = form.totalAmount;
              if (p && form.quantityLiters && form.entryMode === 'FULL_DETAILS') t = (Number(form.quantityLiters) * Number(p)).toFixed(2);
              setForm({ ...form, pricePerLiter: p, totalAmount: t });
            }} fullWidth size="small" disabled={form.entryMode === 'QUICK_AMOUNT'} />

            <TextField label="Total Amount (₹)" type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} fullWidth size="small" />
          </Stack>

          <Box 
            component="label" 
            sx={{ 
              width: '100%', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              border: '2px dashed', borderColor: 'divider', borderRadius: 2, cursor: 'pointer', bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected', borderColor: 'primary.main' }
            }}
          >
            <CloudUploadIcon sx={{ color: 'text.secondary', fontSize: 40, mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {form.receiptFile ? form.receiptFile.name : 'Click to Upload Receipt'}
            </Typography>
            {!form.receiptFile && <Typography variant="caption" color="text.disabled">PNG, JPG, PDF</Typography>}
            <input type="file" hidden accept="image/*,.pdf" onChange={e => setForm({ ...form, receiptFile: e.target.files[0] })} />
          </Box>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Mode</InputLabel>
              <Select value={form.paymentMode} label="Payment Mode" onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Station Name" value={form.stationName} onChange={e => setForm({ ...form, stationName: e.target.value })} fullWidth size="small" />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Receipt Number" value={form.receiptNumber} onChange={e => setForm({ ...form, receiptNumber: e.target.value })} fullWidth size="small" />
            <TextField label="Odometer" type="number" value={form.odometerReading} onChange={e => setForm({ ...form, odometerReading: e.target.value })} fullWidth size="small" />
          </Stack>
          <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth size="small" />
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

      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, doc: null })} maxWidth="md" fullWidth PaperProps={{ id: 'print-dialog', sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <span>Fuel Entry Details</span>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton onClick={handlePrint} size="small" title="Print to PDF" sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}><PrintIcon sx={{ fontSize: 17 }}  /></IconButton>
            <IconButton onClick={() => setViewDialog({ open: false, doc: null })} size="small" sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><CloseIcon sx={{ fontSize: 17 }}  /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 3 }}>
          {viewDialog.doc && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>Fuel Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><DirectionsCarIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Vehicle</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.vehicle?.vehicleNumber || viewDialog.doc.vehicleId}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><EventIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Date</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{new Date(viewDialog.doc.fuelDate).toLocaleString()}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><InfoIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Status</Typography>
                        <Box sx={{ mt: 0.5 }}><Chip label={viewDialog.doc.status} size="small" color={statusColor(viewDialog.doc.status)} sx={{ fontWeight: 'bold' }} /></Box>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><LocalGasStationIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Fuel Type</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.fuelType}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><AppRegistrationIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Trip</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.tripId ? `#${String(viewDialog.doc.tripId).slice(-6)}` : '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><DirectionsCarIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Driver</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.driver?.name || viewDialog.doc.driverId || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><InvertColorsIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Quantity (Liters)</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.quantityLiters ? `${viewDialog.doc.quantityLiters} L` : '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><AttachMoneyIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Total Amount</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>₹{viewDialog.doc.totalAmount}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><PaymentsIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Payment Mode</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.paymentMode || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><StorefrontIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Station Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.stationName || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><SpeedIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Odometer</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.odometerReading ? `${viewDialog.doc.odometerReading} km` : '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><ReceiptIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Receipt No.</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.receiptNumber || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><AppRegistrationIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Entry Mode</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.entryMode}</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}><NotesIcon sx={{ color: '#6b7280', fontSize: 20 }} /></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Notes</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDialog.doc.notes || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', '@media print': { display: 'none' } }}>
          {viewDialog.doc && (viewDialog.doc.status === 'SUBMITTED' || viewDialog.doc.status === 'DRAFT') && (
            <Button variant="contained" onClick={() => openEdit(viewDialog.doc)}>Edit</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
      {isPrinting && <GlobalStyles styles={{
        '@media print': {
          '@page': { margin: 0 },
          'body *': { visibility: 'hidden' },
          '#print-dialog, #print-dialog *': { visibility: 'visible' },
          '#print-dialog': { position: 'absolute', left: 0, top: 0, width: '100%', margin: 0, padding: '20px', boxShadow: 'none' },
        }
      }} />}
    </Box>
  );
}
