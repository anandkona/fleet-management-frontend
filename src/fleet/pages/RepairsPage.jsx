import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Tooltip, Snackbar, Alert, useTheme, useMediaQuery,
  Stepper, Step, StepLabel, StepContent, Grid, Tabs, Tab, Avatar, Divider
} from '@mui/material';
import { ConfirmDialog } from '../components/Common';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptIcon from '@mui/icons-material/Receipt';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { REPAIR_SERVICES } from '../constants';





export default function RepairsPage() {
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', tripId: '', driverId: '', repairDate: '', category: REPAIR_SERVICES[0]?.name || 'General Service', description: '', estimatedCost: REPAIR_SERVICES[0]?.defaultPrice || '', actualCost: '', provider: '', invoiceNumber: '', notes: '', status: 'DRAFT' });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [processingId, setProcessingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [previewItem, setPreviewItem] = useState(null);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [repairStep, setRepairStep] = useState(0);
  const [viewTab, setViewTab] = useState(0);
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleWorkflow = async (id, action) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/repairs/${id}/${action}`);
      toast(`Repair ${action}d successfully`);
      addNotification('Success', `Repair ${action}d successfully`, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message?.includes('Cannot transition')) {
        toast(`Record is already in the requested state.`);
        await fetchData();
      } else {
        toast(`Error: ${err.response?.data?.message || err.message}`, 'error');
        addNotification('Error', `Failed to ${action} repair`, 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, vRes] = await Promise.allSettled([
        api.get('/repairs', { params: { limit: 100 } }),
        api.get('/vehicles', { params: { limit: 100 } })
      ]);
      if (mRes.status === 'fulfilled') {
        const items = mRes.value.data?.data?.items ?? (Array.isArray(mRes.value.data?.data) ? mRes.value.data.data : []);
        setTasks(items);
      } else { setTasks([]); }

      if (vRes.status === 'fulfilled') {
        const items = vRes.value.data?.data?.items ?? (Array.isArray(vRes.value.data?.data) ? vRes.value.data.data : []);
        setVehicles(items || []);
      } else { setVehicles([]); }
    } catch (err) { console.error(err); setTasks([]); setVehicles([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedService = REPAIR_SERVICES.find(s => s.name === form.category);

  const handleSave = async () => {
    try {
      const payload = {
        vehicleId: form.vehicleId,
        tripId: form.tripId || undefined,
        driverId: form.driverId || undefined,
        category: form.category,
        description: form.description,
        estimatedCost: parseFloat(form.estimatedCost) || selectedService?.defaultPrice || 0,
        actualCost: parseFloat(form.actualCost) || undefined,
        provider: form.provider || undefined,
        invoiceNumber: form.invoiceNumber || undefined,
        repairDate: form.repairDate ? new Date(form.repairDate).toISOString() : new Date().toISOString(),
        notes: form.notes || undefined
      };

      if (!payload.vehicleId) { toast('Please select a vehicle', 'error'); return; }
      if (!payload.description) { toast('Description is required', 'error'); return; }

      if (editItem) { await api.patch(`/repairs/${editItem.id || editItem._id}`, payload); }
      else { await api.post('/repairs', payload); }
      setOpenDialog(false); setEditItem(null); fetchData();
      addNotification('Success', `Repair record ${editItem ? 'updated' : 'created'} successfully`, 'success');
    } catch (err) {
      console.error(err);
      let msg = 'Failed to save repair';
      if (err.response?.data?.errors) {
        msg = Array.isArray(err.response.data.errors) ? err.response.data.errors.map(e => e.msg || e.message).join(', ') : JSON.stringify(err.response.data.errors);
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      toast(msg, 'error');
      addNotification('Error', msg, 'error');
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
      await api.delete(`/repairs/${delId}`);
      setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
      toast('Repair record deleted');
      addNotification('Success', 'Repair record deleted successfully', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      if (errMsg?.includes('Cannot transition')) {
        const delId = item.id || item._id;
        setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
        toast('Repair record removed');
      } else {
        toast(errMsg || 'Failed to delete repair record', 'error');
        addNotification('Error', 'Failed to delete repair record', 'error');
      }
    } finally {
      setDeleteConfirm({ open: false, item: null });
    }
  };

  const statusColor = (s) => {
    if (!s) return 'default';
    const up = s.toUpperCase();
    if (up === 'COMPLETED' || up === 'DONE') return 'success';
    if (up === 'IN_PROGRESS' || up === 'STARTED') return 'info';
    if (up === 'DRAFT' || up === 'PENDING') return 'warning';
    if (up === 'CANCELLED') return 'error';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          {hasPermission('repair_create') && (isMobile ? (
            <Button variant="contained" onClick={() => {
              setEditItem(null);
              setForm({
                vehicleId: '',
                tripId: '',
                driverId: '',
                repairDate: '',
                category: REPAIR_SERVICES[0]?.name || 'General Service',
                description: '',
                estimatedCost: REPAIR_SERVICES[0]?.defaultPrice || '',
                actualCost: '',
                provider: '',
                invoiceNumber: '',
                status: 'DRAFT',
                notes: ''
              });
              setOpenDialog(true);
            }}
              sx={{ backgroundColor: '#1976d2', minWidth: 40, width: 40, height: 40, borderRadius: 1, p: 0 }}>
              <AddIcon />
            </Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
              setEditItem(null);
              setForm({
                vehicleId: '',
                tripId: '',
                driverId: '',
                repairDate: '',
                category: REPAIR_SERVICES[0]?.name || 'General Service',
                description: '',
                estimatedCost: REPAIR_SERVICES[0]?.defaultPrice || '',
                actualCost: '',
                provider: '',
                invoiceNumber: '',
                status: 'DRAFT',
                notes: ''
              });
              setOpenDialog(true);
            }}
              sx={{ backgroundColor: '#1976d2' }}>Report Repair</Button>
          ))}
        </Box>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Date', 'Vehicle', 'Category', 'Provider', 'Est. Cost', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((t, i) => (
                <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.repairDate ? t.repairDate.split('T')[0] : '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.vehicle?.vehicleNumber || t.vehicleId}>{t.vehicle?.vehicleNumber || t.vehicleId}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.category || t.description}>{t.category || t.description || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.provider || '-'}>{t.provider || '-'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.estimatedCost ? `${t.estimatedCost}` : '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={(t.status || 'OPEN').toUpperCase()} size="small" color={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : t.status === 'CANCELLED' ? 'error' : 'default'} sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5}>
                      {t.status === 'OPEN' ? (
                        <>
                          {hasPermission('repair_update') && <Tooltip title="Edit"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => {
                            setEditItem(t);
                            setForm({
                              vehicleId: t.vehicle?.id || t.vehicleId || '',
                              tripId: t.tripId || '',
                              driverId: t.driverId || '',
                              repairDate: t.repairDate ? t.repairDate.split('T')[0] : '',
                              category: t.category || REPAIR_SERVICES[0]?.name || 'General Service',
                              description: t.description || '',
                              estimatedCost: t.estimatedCost || REPAIR_SERVICES.find(s => s.name === t.category)?.defaultPrice || '',
                              actualCost: t.actualCost || '',
                              provider: t.provider || '',
                              invoiceNumber: t.invoiceNumber || '',
                              status: t.status || 'DRAFT',
                              notes: t.notes || ''
                            });
                            setOpenDialog(true);
                          }}><EditIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>}
                          <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreviewItem(t)}><VisibilityIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>
                          {hasPermission('repair_update') && <Tooltip title="Cancel Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'cancel')}><CancelIcon sx={{ fontSize: 17, color: '#ef4444' }} /></IconButton></Tooltip>}
                        </>
                      ) : (
                        <>
                          {(!t.status || t.status === 'DRAFT') && hasPermission('repair_update') && <Tooltip title="Edit"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => { setEditItem(t); setForm({ vehicleId: t.vehicleId || '', tripId: t.tripId || '', driverId: t.driverId || '', repairDate: t.repairDate ? t.repairDate.split('T')[0] : '', category: t.category || REPAIR_SERVICES[0]?.name || 'General Service', description: t.description || '', estimatedCost: t.estimatedCost || REPAIR_SERVICES.find(s => s.name === t.category)?.defaultPrice || '', actualCost: t.actualCost || '', provider: t.provider || '', invoiceNumber: t.invoiceNumber || '', status: t.status || 'DRAFT', notes: t.notes || '' }); setOpenDialog(true); }}><EditIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>}
                          {(t.status === 'CANCELLED' || t.status === 'COMPLETED') && <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreviewItem(t)}><VisibilityIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>}
                          {(!t.status || t.status === 'DRAFT') && hasPermission('repair_update') && <Tooltip title="Start Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'start')}><PlayArrowIcon sx={{ fontSize: 17, color: '#3b82f6' }} /></IconButton></Tooltip>}
                          {t.status === 'IN_PROGRESS' && hasPermission('repair_update') && <Tooltip title="Complete Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'complete')}><CheckCircleIcon sx={{ fontSize: 17, color: '#10b981' }} /></IconButton></Tooltip>}
                          {(!t.status || t.status === 'DRAFT' || t.status === 'IN_PROGRESS') && hasPermission('repair_update') && <Tooltip title="Cancel Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'cancel')}><CancelIcon sx={{ fontSize: 17, color: '#f59e0b' }} /></IconButton></Tooltip>}
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.primary' }}>No repair records found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── Add / Edit Repair Dialog (Trips-page style) ── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {editItem ? 'Edit Repair' : 'Report Repair'}
          </Typography>
          <IconButton onClick={() => setOpenDialog(false)} size="small"><CloseIcon sx={{ color: 'text.primary' }} /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'divider' }}>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vehicle *</InputLabel>
                <Select value={form.vehicleId} label="Vehicle *" onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                  {vehicles.map((v, i) => <MenuItem key={i} value={v.id || v._id}>{v.vehicleNumber || v.licensePlate}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={e => {
                  const categoryName = e.target.value;
                  const service = REPAIR_SERVICES.find(s => s.name === categoryName);
                  setForm(prev => ({ ...prev, category: categoryName, estimatedCost: service?.defaultPrice ?? prev.estimatedCost }));
                }}>
                  {REPAIR_SERVICES.map((s, idx) => <MenuItem key={idx} value={s.name}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Repair Date" type="date" value={form.repairDate} onChange={e => setForm({ ...form, repairDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Provider / Garage" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Estimated Cost (₹)" type="number" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Actual Cost (₹)" type="number" value={form.actualCost} onChange={e => setForm({ ...form, actualCost: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Invoice Number" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Trip ID (Optional)" value={form.tripId} onChange={e => setForm({ ...form, tripId: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{editItem ? 'Update Repair' : 'Submit Repair'}</Button>
        </DialogActions>
      </Dialog>

      {/* ── View Repair Profile (Driver Dialog Style) ── */}
      <Dialog 
        open={!!previewItem} 
        onClose={() => { setPreviewItem(null); setViewTab(0); }} 
        maxWidth="md" 
        fullWidth 
        fullScreen={isMobile} 
      >
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
          Repair Profile
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', p: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, minHeight: 400 }}>
          {previewItem && (
            <>
              <Tabs
                orientation={isMobile ? "horizontal" : "vertical"}
                variant="scrollable"
                value={viewTab}
                onChange={(e, v) => setViewTab(v)}
                sx={{ borderRight: { xs: 0, sm: 1 }, borderBottom: { xs: 1, sm: 0 }, borderColor: 'divider', minWidth: 200 }}
              >
                <Tab label="General Info" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
                <Tab label="Cost & Provider" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
                <Tab label="Notes" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
              </Tabs>
              
              <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: '#1976d2', fontSize: '1.5rem' }}>
                    {(previewItem.vehicle?.vehicleNumber || 'R')[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{previewItem.vehicle?.vehicleNumber || previewItem.vehicleId}</Typography>
                    <Chip
                      label={(previewItem.status || 'DRAFT').toUpperCase()}
                      size="small"
                      color={statusColor(previewItem.status)}
                      sx={{ mt: 0.5, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                  </Box>
                </Box>

                {viewTab === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>General Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <CategoryIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Category</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.category || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <DescriptionIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Description</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.description || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <EventIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Repair Date</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.repairDate ? previewItem.repairDate.split('T')[0] : '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <DirectionsCarIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Vehicle</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.vehicle?.vehicleNumber || previewItem.vehicleId || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  </Box>
                )}

                {viewTab === 1 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>Cost & Provider</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <AttachMoneyIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Estimated Cost</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.estimatedCost != null ? `₹${Number(previewItem.estimatedCost).toLocaleString()}` : '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <AttachMoneyIcon sx={{ color: '#059669', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Actual Cost</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: '#059669' }}>{previewItem.actualCost != null ? `₹${Number(previewItem.actualCost).toLocaleString()}` : '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <BuildIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Provider / Garage</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.provider || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <ReceiptIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Invoice Number</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.invoiceNumber || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  </Box>
                )}

                {viewTab === 2 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Card sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>Notes & Identifiers</Typography>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, mb: 0.5 }}>Repair Notes</Typography>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 400, whiteSpace: 'pre-wrap', bgcolor: '#f9fafb', p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>{previewItem.notes || 'No notes added.'}</Typography>
                      </Box>
                      {previewItem.tripId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                            <InfoIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Trip ID</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.tripId}</Typography>
                          </Box>
                        </Box>
                      )}
                      {previewItem.driverId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                            <InfoIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Driver ID</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{previewItem.driverId}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Card>
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => { setPreviewItem(null); setViewTab(0); }} sx={{ color: 'text.primary' }}>Close</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Confirm Delete"
        message={`Are you sure you want to delete the repair record for ${deleteConfirm.item?.vehicle?.vehicleNumber || deleteConfirm.item?.vehicleId || 'this vehicle'}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, item: null })}
      />
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
