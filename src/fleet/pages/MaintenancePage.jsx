import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery
} from '@mui/material';
import { ConfirmDialog } from '../components/Common';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { format, parseISO, isValid } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNotification } from '../../contexts/NotificationContext';
import { Tooltip, Snackbar, Alert, Stack } from '@mui/material';
import api from '../../services/api';

const MAINTENANCE_SERVICES = [
  { name: 'Oil Change', defaultPrice: 2500 },           // Includes oil, filter, and labor
  { name: 'Brake Inspection', defaultPrice: 500 },      // Diagnostic check
  { name: 'Brake Pad Replacement', defaultPrice: 2200 }, // Per axle
  { name: 'Tire Rotation', defaultPrice: 400 },         // Balancing extra
  { name: 'Tire Replacement', defaultPrice: 3500 },     // Per tire (average R14/R15)
  { name: 'Wheel Alignment', defaultPrice: 700 },       // 4-wheel computerized
  { name: 'Engine Tune-up', defaultPrice: 2500 },       // General cleaning/check
  { name: 'Air Filter Replacement', defaultPrice: 600 }, // Part + labor
  { name: 'Transmission Service', defaultPrice: 6000 }, // Fluid change & filter
  { name: 'Coolant Flush', defaultPrice: 1200 },        // Full system flush
  { name: 'Battery Replacement', defaultPrice: 4500 },  // Standard 35Ah-45Ah
  { name: 'AC Service', defaultPrice: 2000 },           // Gas refill & cleaning
  { name: 'Spark Plug Replacement', defaultPrice: 1000 },// Set of 4
  { name: 'Suspension Check', defaultPrice: 800 },      // Comprehensive inspection
  { name: 'Exhaust System Repair', defaultPrice: 2500 }, // Minor welding/sealing
  { name: 'Hydraulic System Service', defaultPrice: 2000 }, // Clutch/Brake fluid flush
  { name: 'Electrical Diagnostic', defaultPrice: 1000 }, // OBD-II scanning
  { name: 'General Inspection', defaultPrice: 800 },    // Basic 50-point check
];




const MAINTENANCE_CACHE_KEY = 'fleet_maintenance_page_cache';
const MAINTENANCE_CACHE_TTL_MS = 45 * 1000;

const readMaintenanceCache = () => {
  try {
    const raw = localStorage.getItem(MAINTENANCE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > MAINTENANCE_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeMaintenanceCache = (payload) => {
  try {
    localStorage.setItem(MAINTENANCE_CACHE_KEY, JSON.stringify({ ...payload, timestamp: Date.now() }));
  } catch {
    // ignore storage errors
  }
};

export default function MaintenancePage() {
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', vehiclePlate: '', vendor: '', date: '', priority: 'LOW', category: '', description: '', notes: '', lineItems: [], images: [] });
  const [tempServiceType, setTempServiceType] = useState('');
  const [serviceTypes, setServiceTypes] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [processingId, setProcessingId] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [servicesDialogItem, setServicesDialogItem] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleAddLineItem = () => {
    const svc = MAINTENANCE_SERVICES.find(s => s.name === tempServiceType);
    const defaultAmount = svc?.defaultPrice ?? 0;
    setForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { id: Date.now(), serviceType: tempServiceType || '', amount: defaultAmount, tax: 0, total: defaultAmount }]
    }));
  };

  const handleLineItemChange = (id, field, value) => {
    setForm(prev => {
      const newLineItems = prev.lineItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'amount' || field === 'tax') {
            const amt = parseFloat(updated.amount) || 0;
            const tx = parseFloat(updated.tax) || 0;
            updated.total = amt + (amt * tx / 100);
          }
          return updated;
        }
        return item;
      });
      return { ...prev, lineItems: newLineItems };
    });
  };

  const handleDeleteLineItem = (id) => {
    setForm(prev => ({ ...prev, lineItems: prev.lineItems.filter(item => item.id !== id) }));
  };

  const handleImageUpload = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
    }
  };

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    const cached = readMaintenanceCache();
    if (cached) {
      setTasks(cached.tasks ?? []);
      setVehicles(cached.vehicles ?? []);
      setServiceTypes(cached.serviceTypes ?? []);
    }

    if (!silent) setLoading(true);
    try {
      const [mRes, vRes] = await Promise.allSettled([
        api.get('/maintenance', { params: { limit: 100 } }),
        api.get('/vehicles', { params: { limit: 100 } })
      ]);

      let nextTasks = cached?.tasks ?? [];
      let nextVehicles = cached?.vehicles ?? [];
      let nextServiceTypes = cached?.serviceTypes ?? [];

      if (mRes.status === 'fulfilled') {
        nextTasks = mRes.value.data?.data?.items ?? (Array.isArray(mRes.value.data?.data) ? mRes.value.data.data : []);
        setTasks(nextTasks);
        try {
          const localTypes = MAINTENANCE_SERVICES.map(s => s.name);
          const typesSet = new Set(localTypes);
          nextTasks.forEach(t => {
            if (t.category) typesSet.add(t.category);
            if (t.serviceType) typesSet.add(t.serviceType);
            if (Array.isArray(t.lineItems)) {
              t.lineItems.forEach(li => { if (li.serviceType) typesSet.add(li.serviceType); });
            }
          });
          const typesArr = Array.from(typesSet);
          const blacklist = ['Tyre Rotation', 'Battery Check'];
          const filtered = typesArr.filter(t => !blacklist.includes(String(t).trim()));
          nextServiceTypes = Array.from(new Set(filtered));
          setServiceTypes(nextServiceTypes);
          if (nextServiceTypes.length > 0 && !tempServiceType) setTempServiceType(nextServiceTypes[0]);
        } catch (e) {
          console.error('derive/service-types flow failed', e);
        }
      } else {
        console.error('Failed to fetch maintenance data', mRes.reason);
        setTasks(nextTasks);
      }

      if (vRes.status === 'fulfilled') {
        nextVehicles = vRes.value.data?.data?.items ?? (Array.isArray(vRes.value.data?.data) ? vRes.value.data.data : []);
        setVehicles(nextVehicles);
      } else {
        console.error('Failed to fetch vehicle data', vRes.reason);
        setVehicles(nextVehicles);
      }

      writeMaintenanceCache({ tasks: nextTasks, vehicles: nextVehicles, serviceTypes: nextServiceTypes });
    } catch (err) {
      console.error('fetchData failed', err);
      if (cached) {
        setTasks(cached.tasks ?? []);
        setVehicles(cached.vehicles ?? []);
        setServiceTypes(cached.serviceTypes ?? []);
      } else {
        setTasks([]);
        setVehicles([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWorkflow = async (id, action) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/maintenance/${id}/${action}`);
      toast(`Maintenance ${action}d successfully`);
      await fetchData({ silent: true });
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message?.includes('Cannot transition')) {
        toast(`Record is already in the requested state.`);
        await fetchData();
      } else {
        toast(`Error: ${err.response?.data?.message || err.message}`, 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };


  const handleSave = async () => {
    try {
      console.log('handleSave called', { editItem, form });
      if (!form.vehicleId) { toast('Please select a vehicle', 'error'); return; }

      const isoDate = form.date ? new Date(form.date).toISOString() : new Date().toISOString();
      const calculatedCost = form.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const derivedCategory = form.lineItems.length > 0 ? form.lineItems[0].serviceType : 'General Service';
      
      let payload;
      if (editItem) {
        payload = {
          vehicleId: form.vehicleId,
          requestDate: editItem.requestDate || isoDate,
          priority: form.priority || editItem.priority || "LOW",
          category: form.category || derivedCategory || editItem.category || 'General Service',
          description: form.description || editItem.description || 'Maintenance request',
          estimatedCost: calculatedCost > 0 ? calculatedCost : (editItem.estimatedCost || 0),
          scheduledDate: form.date ? new Date(form.date).toISOString() : undefined,
          notes: form.notes || "",
          vendor: form.vendor || "",
          lineItems: form.lineItems.length > 0 ? form.lineItems.map(item => ({
            serviceType: item.serviceType,
            amount: Number(item.amount) || 0,
            tax: Number(item.tax) || 0,
            total: Number(item.total) || 0,
          })) : [],
        };
      } else {
        payload = {
          vehicleId: form.vehicleId,
          requestDate: isoDate,
          priority: form.priority || "LOW",
          category: form.category || derivedCategory,
          description: form.description || 'Maintenance request',
          estimatedCost: calculatedCost,
          scheduledDate: form.date ? new Date(form.date).toISOString() : undefined,
          notes: form.notes || "",
          vendor: form.vendor || "",
          lineItems: form.lineItems.length > 0 ? form.lineItems.map(item => ({
            serviceType: item.serviceType,
            amount: Number(item.amount) || 0,
            tax: Number(item.tax) || 0,
            total: Number(item.total) || 0,
          })) : [],
        };
      }

      const maintenanceId = editItem?.id || editItem?._id;
      const requestUrl = editItem ? `/maintenance/${maintenanceId}` : '/maintenance';
      console.log('handleSave payload', { payload, requestUrl, isUpdate: Boolean(editItem), maintenanceId });

      if (editItem) {
        if (!maintenanceId) {
          const missingIdMsg = 'Cannot update maintenance record: missing id';
          console.error(missingIdMsg, editItem);
          toast(missingIdMsg, 'error');
          return;
        }
        console.log('Updating maintenance record', maintenanceId);
        const response = await api.patch(requestUrl, payload);
        console.log('handleSave response', response?.status, response?.data);
        toast('Maintenance updated successfully', 'success');
        addNotification('Success', 'Maintenance record updated successfully', 'success');
      } else {
        console.log('Creating maintenance record');
        const response = await api.post(requestUrl, payload);
        console.log('handleSave response', response?.status, response?.data);
        toast('Maintenance scheduled successfully', 'success');
        addNotification('Success', 'Maintenance record created successfully', 'success');
      }
      console.log('Maintenance saved successfully');
      setOpenDialog(false); setEditItem(null); fetchData();
    } catch (err) {
      console.error('handleSave failed', {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message,
        request: err.request,
      });
      let msg;
      if (err.response) {
        msg = err.response.data?.message || err.response.data?.error || 'Failed to save maintenance record';
        if (err.response.data?.errors && Array.isArray(err.response.data.errors)) {
          msg = err.response.data.errors.join(', ');
        }
      } else if (err.request) {
        msg = 'No response from server. Check network or API availability.';
      } else {
        msg = err.message || 'Failed to save maintenance record';
      }
      toast(msg, 'error');
      addNotification('Error', 'Failed to save maintenance record', 'error');
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteConfirm({ open: true, item });
  };

  const handleConfirmDelete = async () => {
    const item = deleteConfirm.item;
    if (!item) return;
    try {
      const delId = item.id || item._id;
      await api.delete(`/maintenance/${delId}`);
      setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
      toast('Maintenance record deleted');
      fetchData();
      addNotification('Success', 'Maintenance record deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      if (errMsg?.includes('Cannot transition')) {
        const delId = item.id || item._id;
        setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
        toast('Maintenance record removed');
      } else {
        toast(errMsg || 'Failed to delete maintenance record', 'error');
      }
    } finally {
      setDeleteConfirm({ open: false, item: null });
    }
  };

  const statusColor = (s) => {
    if (!s) return 'default';
    const up = s.toUpperCase();
    if (up === 'APPROVED' || up === 'COMPLETED' || up === 'DONE') return 'success';
    if (up === 'SUBMITTED' || up === 'PENDING') return 'warning';
    if (up === 'REJECTED' || up === 'CANCELLED') return 'error';
    return 'default';
  };

  const getServiceLabel = (item) => item?.serviceType || item?.name || item?.service || item?.type || 'Service';
  const normalizeServiceItem = (item) => {
    if (!item || typeof item !== 'object') return { id: Date.now(), serviceType: 'Service', amount: 0, tax: 0, total: 0 };
    const serviceType = item.serviceType || item.name || item.service || item.type || 'Service';
    const amount = Number(item.amount ?? item.price ?? item.cost ?? item.defaultPrice ?? 0) || 0;
    const tax = Number(item.tax ?? item.taxPercent ?? 0) || 0;
    const total = Number(item.total ?? (amount + (amount * tax / 100))) || 0;
    return {
      id: item.id || item._id || `${serviceType}-${amount}-${tax}` || Date.now(),
      serviceType,
      amount,
      tax,
      total,
    };
  };
  const formatAmount = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? `₹${num.toFixed(2)}` : '₹0.00';
  };
  const getRecordLineItems = (record) => {
    if (!record || typeof record !== 'object') return [];
    const rawItems = Array.isArray(record.lineItems) && record.lineItems.length > 0 ? record.lineItems
      : Array.isArray(record.services) && record.services.length > 0 ? record.services
      : Array.isArray(record.items) && record.items.length > 0 ? record.items
      : [];
    return rawItems.map(normalizeServiceItem);
  };
  const getServiceSummary = (lineItems) => {
    const items = Array.isArray(lineItems) ? lineItems : [];
    if (items.length === 0) return '—';
    const labels = items.map(i => i.serviceType).filter(Boolean);
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} / ${labels[1]}`;
    return `${labels[0]} / ${labels[1]} +${labels.length - 2}`;
  };

  const selectedService = MAINTENANCE_SERVICES.find(s => s.name === tempServiceType);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          {isMobile ? (
            <Button variant="contained" onClick={() => { setEditItem(null); setForm({ vehicleId: '', vehiclePlate: '', vendor: '', date: '', priority: 'LOW', category: '', description: '', notes: '', lineItems: [], images: [] }); setOpenDialog(true); }}
              sx={{ backgroundColor: '#1976d2', minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}>
              <AddIcon />
            </Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setForm({ vehicleId: '', vehiclePlate: '', vendor: '', date: '', priority: 'LOW', category: '', description: '', notes: '', lineItems: [], images: [] }); setOpenDialog(true); }}
              sx={{ backgroundColor: '#1976d2' }}>Schedule Maintenance</Button>
          )}
        </Box>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Date', 'Vehicle', 'Category / Priority', 'Amount', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((t, i) => (
                <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString() : (t.requestDate ? new Date(t.requestDate).toLocaleDateString() : (t.date ? new Date(t.date).toLocaleDateString() : '—'))}
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.vehiclePlate || t.vehicle?.vehicleNumber || t.vehicle?.licensePlate || t.vehicleId || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {`${t.category || t.serviceType || t.name || '—'} / ${t.priority || 'LOW'}`}
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {t.actualCost ? `${Number(t.actualCost).toFixed(2)}` : (t.estimatedCost ? `${Number(t.estimatedCost).toFixed(2)}` : (t.totalCost ? `${Number(t.totalCost).toFixed(2)}` : (t.cost ? `${t.cost}` : '—')))}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><Chip label={(t.status || 'Pending').toUpperCase()} size="small" color={statusColor(t.status)} sx={{ fontSize: '0.65rem', fontWeight: 700 }} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Preview"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => setServicesDialogItem(t)}><VisibilityOutlinedIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>
                      {(!t.status || t.status === 'DRAFT') && <Tooltip title="EditOutlined"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => { setEditItem(t); setForm({ vehicleId: t.vehicleId || t.vehicle?._id || t.vehicle?.id || '', vehiclePlate: t.vehiclePlate || t.vehicle?.vehicleNumber || t.vehicle?.licensePlate || '', vendor: t.vendor || '', date: t.date ? new Date(t.date).toISOString().split('T')[0] : (t.requestDate ? new Date(t.requestDate).toISOString().split('T')[0] : ''), priority: t.priority || 'LOW', category: t.category || '', description: t.description || '', notes: t.notes || '', lineItems: getRecordLineItems(t).map(item => ({
                          id: item.id || Date.now(),
                          serviceType: getServiceLabel(item),
                          amount: item.amount ?? item.price ?? item.cost ?? 0,
                          tax: item.tax ?? 0,
                          total: item.total ?? (Number(item.amount ?? item.price ?? item.cost ?? 0) + ((Number(item.amount ?? item.price ?? item.cost ?? 0) * Number(item.tax ?? 0)) / 100)),
                        })), images: t.images || [] }); setOpenDialog(true); }}><EditOutlinedIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>}
                      {t.status === 'SUBMITTED' && <Tooltip title="Approve"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'approve')}><CheckCircleOutlineIcon sx={{ fontSize: 17, color: '#10b981' }} /></IconButton></Tooltip>}

                      {(!t.status || t.status === 'DRAFT' || t.status === 'SUBMITTED') && <Tooltip title="Cancel"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'cancel')}><CancelOutlinedIcon sx={{ fontSize: 17, color: '#ef4444' }} /></IconButton></Tooltip>}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.primary' }}>No maintenance records found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{editItem ? 'EditOutlined Maintenance' : 'Schedule Maintenance'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small"><InputLabel>Vehicle *</InputLabel>
                <Select value={form.vehicleId || ''} label="Vehicle *" onChange={e => {
                  const selectedVehicle = vehicles.find(v => (v.id || v._id) === e.target.value);
                  setForm({ ...form, vehicleId: e.target.value, vehiclePlate: selectedVehicle?.licensePlate || selectedVehicle?.vehicleNumber || '' });
                }}>
                  {vehicles.map((v, i) => <MenuItem key={i} value={v.id || v._id}>{v.licensePlate || v.vehicleNumber}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small"><InputLabel>Category *</InputLabel>
                <Select value={form.category || ''} label="Category *" onChange={e => setForm({ ...form, category: e.target.value })}>
                  {MAINTENANCE_SERVICES.map((s, idx) => <MenuItem key={idx} value={s.name}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small"><InputLabel>Priority</InputLabel>
                <Select value={form.priority || 'LOW'} label="Priority" onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Scheduled Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Vendor / Garage" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} fullWidth size="small" />
              <TextField label="Description *" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth size="small" placeholder="Describe the maintenance..." />
            </Box>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Maintenance Line Items</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Service Type</InputLabel>
                  <Select value={tempServiceType} label="Service Type" onChange={e => setTempServiceType(e.target.value)}>
                    {MAINTENANCE_SERVICES.map((s, idx) => <MenuItem key={idx} value={s.name}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 140 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Price:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, ml: 1 }}>₹{selectedService?.defaultPrice ?? 0}</Typography>
                </Box>
                <Button variant="outlined" onClick={handleAddLineItem}>Add</Button>
              </Box>
              {form.lineItems.length > 0 && (
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Service</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Amount</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Tax (%)</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Total</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.lineItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>{item.serviceType}</TableCell>
                        <TableCell sx={{ py: 0.5 }}><TextField size="small" type="number" variant="standard" value={item.amount} onChange={e => handleLineItemChange(item.id, 'amount', e.target.value)} /></TableCell>
                        <TableCell sx={{ py: 0.5 }}><TextField size="small" type="number" variant="standard" value={item.tax} onChange={e => handleLineItemChange(item.id, 'tax', e.target.value)} /></TableCell>
                        <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>{item.total ? Number(item.total).toFixed(2) : 0}</TableCell>
                        <TableCell sx={{ py: 0.5 }}><IconButton size="small" onClick={() => handleDeleteLineItem(item.id)}><DeleteIcon sx={{ fontSize: 16, color: 'error.main' }} /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Typography variant="subtitle2" sx={{ mt: 1, textAlign: 'right', fontWeight: 600 }}>Grand Total: ₹{form.lineItems.reduce((acc, item) => acc + (item.total || 0), 0).toFixed(2)}</Typography>
            </Box>
            <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth size="small" multiline rows={2} />
            <Box>
              <Button component="label" variant="outlined" startIcon={<PhotoCamera />} size="small">
                Upload Images
                <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
              </Button>
              {form.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {form.images.map((file, idx) => (
                    <Chip key={idx} label={file.name || `Image ${idx + 1}`} size="small" onDelete={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2' }}>{editItem ? 'Update' : 'Schedule'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Confirm Delete"
        message={`Are you sure you want to delete the ${deleteConfirm.item?.serviceType || 'maintenance'} record for ${deleteConfirm.item?.vehicle?.vehicleNumber || deleteConfirm.item?.vehiclePlate || 'this vehicle'}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, item: null })}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>


      <Dialog open={!!servicesDialogItem} onClose={() => setServicesDialogItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          Maintenance Preview
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 3 }}>
          {servicesDialogItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Vehicle</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{servicesDialogItem.vehiclePlate || servicesDialogItem.vehicle?.vehicleNumber || servicesDialogItem.vehicle?.licensePlate || servicesDialogItem.vehicleId || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Vendor</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{servicesDialogItem.vendor || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Scheduled Date</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{servicesDialogItem.scheduledDate ? new Date(servicesDialogItem.scheduledDate).toLocaleDateString() : (servicesDialogItem.requestDate ? new Date(servicesDialogItem.requestDate).toLocaleDateString() : (servicesDialogItem.date ? new Date(servicesDialogItem.date).toLocaleDateString() : '—'))}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Status</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{(servicesDialogItem.status || 'Pending').toUpperCase()}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Total Cost</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{formatAmount(servicesDialogItem.actualCost ?? servicesDialogItem.estimatedCost ?? servicesDialogItem.totalCost ?? servicesDialogItem.cost ?? getRecordLineItems(servicesDialogItem).reduce((sum, item) => sum + Number(item.total || 0), 0))}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Notes</Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{servicesDialogItem.notes || servicesDialogItem.description || '—'}</Typography>
                </Box>
              </Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Service Items</Typography>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Service</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Amount</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Tax (%)</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getRecordLineItems(servicesDialogItem).map((item, index) => (
                    <TableRow key={item.id || `${getServiceLabel(item)}-${index}`}>
                      <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>{getServiceLabel(item)}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>{formatAmount(item.amount)}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>{item.tax ?? 0}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: '0.8rem' }}>{formatAmount(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setServicesDialogItem(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
