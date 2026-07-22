import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, useTheme, useMediaQuery,
  TableContainer, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Button, Tooltip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { PageHeader } from '../components/Common';

const MAINTENANCE_SERVICES = [
  { name: 'Oil Change', defaultPrice: 2500 },
  { name: 'Brake Inspection', defaultPrice: 500 },
  { name: 'Brake Pad Replacement', defaultPrice: 2200 },
  { name: 'Tire Rotation', defaultPrice: 400 },
  { name: 'Tire Replacement', defaultPrice: 3500 },
  { name: 'Wheel Alignment', defaultPrice: 700 },
  { name: 'Engine Tune-up', defaultPrice: 2500 },
  { name: 'Air Filter Replacement', defaultPrice: 600 },
  { name: 'Transmission Service', defaultPrice: 6000 },
  { name: 'Coolant Flush', defaultPrice: 1200 },
  { name: 'Battery Replacement', defaultPrice: 4500 },
  { name: 'AC Service', defaultPrice: 2000 },
  { name: 'Spark Plug Replacement', defaultPrice: 1000 },
  { name: 'Suspension Check', defaultPrice: 800 },
  { name: 'Exhaust System Repair', defaultPrice: 2500 },
  { name: 'Hydraulic System Service', defaultPrice: 2000 },
  { name: 'Electrical Diagnostic', defaultPrice: 1000 },
  { name: 'General Inspection', defaultPrice: 800 },
];

export default function MechanicMaintenancePage() {
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', vehiclePlate: '', vendor: '', date: '', priority: 'LOW', category: '', description: '', notes: '', lineItems: [], images: [] });
  const [tempServiceType, setTempServiceType] = useState('');

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleWorkflow = async (id, action) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/maintenance/${id}/${action}`);
      addNotification('Success', `Maintenance ${action}d successfully`, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message?.includes('Cannot transition')) {
        addNotification('Info', `Record is already in the requested state.`, 'info');
        await fetchData();
      } else {
        addNotification('Error', `Failed to ${action} maintenance`, 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, vRes] = await Promise.allSettled([
        api.get('/maintenance', { params: { limit: 100 } }),
        api.get('/vehicles', { params: { limit: 100 } })
      ]);
      let items = [];
      if (mRes.status === 'fulfilled') {
        items = mRes.value.data?.data?.items ?? (Array.isArray(mRes.value.data?.data) ? mRes.value.data.data : []);
      }

      setTasks(items);

      if (vRes.status === 'fulfilled') {
        const vitems = vRes.value.data?.data?.items ?? (Array.isArray(vRes.value.data?.data) ? vRes.value.data.data : []);
        setVehicles(vitems || []);
      } else { setVehicles([]); }

      if (!tempServiceType && MAINTENANCE_SERVICES.length > 0) {
        setTempServiceType(MAINTENANCE_SERVICES[0].name);
      }
    } catch (err) { console.error(err); setTasks([]); setVehicles([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Edit Handlers
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

  const handleSave = async () => {
    try {
      if (!form.vehicleId) { addNotification('Error', 'Please select a vehicle', 'error'); return; }
      const calculatedCost = form.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const payload = {
        vehicleId: form.vehicleId,
        requestDate: new Date().toISOString(),
        priority: form.priority || 'LOW',
        category: form.category || 'General Service',
        description: form.description || 'Maintenance request',
        estimatedCost: calculatedCost > 0 ? calculatedCost : (editItem?.estimatedCost || 0),
        scheduledDate: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        notes: form.notes || ''
      };

      const maintenanceId = editItem?.id || editItem?._id;
      if (editItem && maintenanceId) {
        await api.patch(`/maintenance/${maintenanceId}`, payload);
        addNotification('Success', 'Maintenance record updated successfully', 'success');
      } else {
        await api.post('/maintenance', payload);
        addNotification('Success', 'Maintenance scheduled successfully', 'success');
      }
      setOpenDialog(false); setEditItem(null); fetchData();
    } catch (err) {
      addNotification('Error', 'Failed to save maintenance record', 'error');
    }
  };

  const getRecordLineItems = (record) => {
    if (!record || typeof record !== 'object') return [];
    const rawItems = Array.isArray(record.lineItems) && record.lineItems.length > 0 ? record.lineItems : [];
    return rawItems.map(item => ({
      id: item.id || Date.now(),
      serviceType: item.serviceType || 'Service',
      amount: item.amount || 0,
      tax: item.tax || 0,
      total: item.total || 0
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': case 'PENDING': case 'SCHEDULED': return 'warning';
      case 'APPROVED': case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': case 'SETTLED': return 'success';
      case 'REJECTED': case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const selectedService = MAINTENANCE_SERVICES.find(s => s.name === tempServiceType);

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader
          title="My Assigned Maintenance"
          subtitle="Manage and update your routine maintenance schedules"
        />
        <Button
          variant="contained"
          onClick={() => {
            setEditItem(null);
            setForm({ vehicleId: '', vehiclePlate: '', vendor: '', date: '', priority: 'LOW', category: '', description: '', notes: '', lineItems: [], images: [] });
            setOpenDialog(true);
          }} sx={{ borderRadius: 2 }}>
            New Maintenance
          </Button>
        </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Vehicle', 'Vendor', 'Date', 'Priority', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(t => { return (
                <TableRow key={t.id || t._id} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">{t.vehiclePlate || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{t.vendor || 'N/A'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {t.date ? new Date(t.date).toLocaleDateString() : (t.requestDate ? new Date(t.requestDate).toLocaleDateString() : '—')}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={t.priority || 'LOW'} size="small" color={t.priority === 'HIGH' ? 'error' : t.priority === 'MEDIUM' ? 'warning' : 'info'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={t.status || 'OPEN'} size="small" color={getStatusColor(t.status)} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {(!t.status || t.status === 'DRAFT' || t.status === 'OPEN') && (
                        <Tooltip title="Edit">
                          <IconButton size="small" disabled={processingId === t.id} onClick={() => {
                            setEditItem(t);
                            setForm({
                              vehicleId: t.vehicleId || '',
                              vehiclePlate: t.vehiclePlate || '',
                              vendor: t.vendor || '',
                              date: t.date ? new Date(t.date).toISOString().split('T')[0] : (t.requestDate ? new Date(t.requestDate).toISOString().split('T')[0] : ''),
                              priority: t.priority || 'LOW',
                              category: t.category || '',
                              description: t.description || '',
                              notes: t.notes || '',
                              lineItems: getRecordLineItems(t),
                              images: t.images || []
                            });
                            setOpenDialog(true);
                          }} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                            <EditIcon sx={{ fontSize: 17 }}    />
                            </IconButton>
                          </Tooltip>
                        )}
                        {t.status === 'DRAFT' && (
                          <Tooltip title="Submit">
                            <IconButton size="small"  disabled={processingId === t.id} onClick={() => handleWorkflow(t.id, 'submit')} sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}>
                              <SendIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(t.status === 'SUBMITTED' || t.status === 'PENDING') && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton size="small"  disabled={processingId === t.id} onClick={() => handleWorkflow(t.id, 'approve')} sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}>
                                <ThumbUpIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small"  disabled={processingId === t.id} onClick={() => handleWorkflow(t.id, 'reject')} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }} >
                                <ThumbDownIcon sx={{ fontSize: 17 }}  />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {(t.status === 'APPROVED' || t.status === 'SCHEDULED') && (
                          <Tooltip title="Start">
                            <IconButton size="small"  disabled={processingId === t.id} onClick={() => handleWorkflow(t.id, 'start')} sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}>
                              <PlayArrowIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <Tooltip title="Complete">
                            <IconButton size="small"  disabled={processingId === t.id} onClick={() => handleWorkflow(t.id, 'complete')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }} >
                              <CheckCircleIcon sx={{ fontSize: 17 }}  />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(t.status === 'DRAFT' || t.status === 'APPROVED' || t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS') && (
                          <Tooltip title="Cancel">
                            <IconButton size="small"  disabled={processingId === t.id} onClick={() => handleWorkflow(t.id, 'cancel')} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                              <CloseIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Edit Maintenance</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small"><InputLabel>Vehicle *</InputLabel>
                <Select value={form.vehicleId || ''} label="Vehicle *" disabled={!!editItem} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
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
                        <TableCell sx={{ py: 0.5 }}><IconButton size="small" onClick={() => handleDeleteLineItem(item.id)} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }} ><DeleteIcon sx={{ fontSize: 17 }}   /></IconButton></TableCell>
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
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2' }}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
