import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery
} from '@mui/material';
import { ConfirmDialog } from '../components/Common';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Tooltip, Snackbar, Alert, Stack } from '@mui/material';
import api from '../../services/api';

const fallbackTasks = [
  { id: 1, vehiclePlate: 'AP05-T043', serviceType: 'Oil Change', vendor: 'Vizag Auto Care', date: '2026-06-15', status: 'Overdue', notes: 'Last done 45 days ago' },
  { id: 2, vehiclePlate: 'AP05-T089', serviceType: 'Tyre Rotation', vendor: 'FleetFix Garage', date: '2026-06-18', status: 'Pending', notes: 'Front pair wear critical' },
  { id: 3, vehiclePlate: 'AP05-T112', serviceType: 'Battery Check', vendor: 'PowerZone Batteries', date: '2026-06-25', status: 'Pending', notes: 'AI predicts replacement in 3 weeks' },
  { id: 4, vehiclePlate: 'AP05-T047', serviceType: 'Brake Service', vendor: 'Vizag Auto Care', date: '2026-07-01', status: 'Scheduled', notes: 'Pad thickness 3mm' },
  { id: 5, vehiclePlate: 'AP05-T123', serviceType: 'General Service', vendor: 'Tata Motors Service', date: '2026-06-20', status: 'Completed', notes: 'Routine 10K km service done' },
];

const fallbackVehicles = [
  { id: 1, licensePlate: 'AP05-T123' }, { id: 2, licensePlate: 'AP05-T087' },
  { id: 3, licensePlate: 'AP05-T201' }, { id: 4, licensePlate: 'AP05-T043' },
  { id: 5, licensePlate: 'AP05-T089' }, { id: 6, licensePlate: 'AP05-T112' },
];

export default function MaintenancePage() {
  const [tasks, setTasks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ vehiclePlate: '', serviceType: 'Oil Change', vendor: '', date: '', status: 'Pending', notes: '' });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [processingId, setProcessingId] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleWorkflow = async (id, action) => {
    if (processingId) return;
    if (typeof id === 'number' || fallbackTasks.some(f => String(f.id) === String(id))) {
      setTasks(prev => prev.map(t => String(t.id) === String(id) || String(t._id) === String(id) ? { ...t, status: action === 'submit' ? 'SUBMITTED' : action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'CANCELLED' } : t));
      toast(`Maintenance ${action}d successfully`);
      return;
    }
    setProcessingId(id);
    try {
      await api.post(`/maintenance/${id}/${action}`);
      toast(`Maintenance ${action}d successfully`);
      await fetchData();
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, vRes] = await Promise.allSettled([
        api.get('/maintenance', { params: { limit: 100 } }),
        api.get('/vehicles', { params: { limit: 100 } })
      ]);
      if (mRes.status === 'fulfilled') {
        const items = mRes.value.data?.data?.items ?? (Array.isArray(mRes.value.data?.data) ? mRes.value.data.data : []);
        setTasks(items.length > 0 ? items : fallbackTasks);
      } else { setTasks(fallbackTasks); }
      if (vRes.status === 'fulfilled') {
        const items = vRes.value.data?.data?.items ?? (Array.isArray(vRes.value.data?.data) ? vRes.value.data.data : []);
        setVehicles(items.length > 0 ? items : fallbackVehicles);
      } else { setVehicles(fallbackVehicles); }
    } catch (err) { console.error(err); setTasks(fallbackTasks); setVehicles(fallbackVehicles); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      if (!form.vehiclePlate) { toast('Please select a vehicle', 'error'); return; }

      // If vehiclePlate is not a real MongoDB 24-char hex string, it's likely a demo vehicle plate. Mock the save!
      if (!/^[0-9a-fA-F]{24}$/.test(form.vehiclePlate) && fallbackVehicles.some(v => v.licensePlate === form.vehiclePlate || v.vehicleNumber === form.vehiclePlate)) {
        const newTask = {
          id: Date.now(),
          vehiclePlate: form.vehiclePlate,
          vehicle: { vehicleNumber: form.vehiclePlate },
          serviceType: form.serviceType,
          vendor: form.vendor,
          date: form.date,
          status: 'DRAFT',
          notes: form.notes
        };
        if (editItem) {
          setTasks(prev => prev.map(t => (t.id === editItem.id || t._id === editItem._id) ? { ...t, ...newTask, id: editItem.id || editItem._id } : t));
        } else {
          setTasks(prev => [newTask, ...prev]);
        }
        toast(editItem ? 'Maintenance updated (Demo)' : 'Maintenance scheduled (Demo)');
        setOpenDialog(false); setEditItem(null);
        return;
      }

      if (editItem) { await api.patch(`/maintenance/${editItem.id || editItem._id}`, form); }
      else { await api.post('/maintenance', form); }
      setOpenDialog(false); setEditItem(null); fetchData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save maintenance record';
      toast(msg, 'error');
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
      // If the ID is not a MongoDB 24-char hex string, it's a mock/demo item
      if (!/^[0-9a-fA-F]{24}$/.test(String(delId))) {
        setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
        toast('Maintenance record deleted (Demo)');
      } else {
        await api.delete(`/maintenance/${delId}`);
        setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
        toast('Maintenance record deleted');
        fetchData();
      }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon sx={{ color: '#1976d2' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Maintenance Schedule</Typography>
          <Chip label={tasks.length} size="small" sx={{ ml: 1, backgroundColor: '#1976d2', color: '#fff', borderRadius: '12px', height: '22px', fontSize: '0.7rem', fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <IconButton onClick={fetchData} sx={{ color: 'text.primary', border: { xs: '1px solid', sm: 'none' }, borderColor: 'divider', borderRadius: 1.5 }}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setForm({ vehiclePlate: '', serviceType: 'Oil Change', vendor: '', date: '', status: 'Pending', notes: '' }); setOpenDialog(true); }}
            sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Schedule Maintenance</Button>
        </Box>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Vehicle', 'Service Type', 'Vendor', 'Scheduled Date', 'Status', 'Notes', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((t, i) => (
                <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.vehiclePlate || t.vehicle?.vehicleNumber || t.vehicle?.licensePlate || t.vehicleId || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.serviceType || t.name}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.vendor || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.date || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><Chip label={(t.status || 'Pending').toUpperCase()} size="small" color={statusColor(t.status)} sx={{ fontSize: '0.65rem', fontWeight: 700 }} /></TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1}>
                      {(!t.status || t.status === 'DRAFT') && <Tooltip title="Edit"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => { setEditItem(t); setForm({ vehiclePlate: t.vehiclePlate || t.vehicleId || '', serviceType: t.serviceType || t.category || 'Oil Change', vendor: t.vendor || '', date: t.date || t.requestDate || '', status: t.status || 'DRAFT', notes: t.notes || t.description || '' }); setOpenDialog(true); }} sx={{ color: '#60a5fa', bgcolor: '#60a5fa15', '&:hover': { bgcolor: '#60a5fa30' } }}><EditIcon fontSize="small" /></IconButton></Tooltip>}
                      {(!t.status || t.status === 'DRAFT') && <Tooltip title="Submit"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'submit')} sx={{ color: '#10b981', bgcolor: '#10b98115', '&:hover': { bgcolor: '#10b98130' } }}><SendIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                      {t.status === 'SUBMITTED' && <Tooltip title="Approve"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'approve')} sx={{ color: '#10b981', bgcolor: '#10b98115', '&:hover': { bgcolor: '#10b98130' } }}><CheckCircleOutlineIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                      {t.status === 'SUBMITTED' && <Tooltip title="Reject"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'reject')} sx={{ color: '#ef4444', bgcolor: '#ef444415', '&:hover': { bgcolor: '#ef444430' } }}><HighlightOffIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                      {(!t.status || t.status === 'DRAFT' || t.status === 'SUBMITTED') && <Tooltip title="Cancel"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'cancel')} sx={{ color: '#f59e0b', bgcolor: '#f59e0b15', '&:hover': { bgcolor: '#f59e0b30' } }}><CancelOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                      <Tooltip title="Delete"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleDeleteClick(t)} sx={{ color: '#ef4444', bgcolor: '#ef444415', '&:hover': { bgcolor: '#ef444430' } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{editItem ? 'Edit Maintenance' : 'Schedule Maintenance'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small"><InputLabel>Vehicle</InputLabel>
              <Select value={form.vehiclePlate} label="Vehicle" onChange={e => setForm({ ...form, vehiclePlate: e.target.value })}>
                {vehicles.map((v, i) => <MenuItem key={i} value={v.licensePlate || v.vehicleNumber}>{v.licensePlate || v.vehicleNumber}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small"><InputLabel>Service Type</InputLabel>
              <Select value={form.serviceType} label="Service Type" onChange={e => setForm({ ...form, serviceType: e.target.value })}>
                <MenuItem value="Oil Change">Oil Change</MenuItem><MenuItem value="Tyre Rotation">Tyre Rotation</MenuItem><MenuItem value="Brake Service">Brake Service</MenuItem>
                <MenuItem value="Battery Check">Battery Check</MenuItem><MenuItem value="General Service">General Service</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Vendor / Garage" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} fullWidth size="small" />
            <TextField label="Scheduled Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth size="small" multiline rows={2} />
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
    </Box>
  );
}
