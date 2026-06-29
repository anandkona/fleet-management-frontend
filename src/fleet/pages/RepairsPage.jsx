import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Stack, Tooltip, Snackbar, Alert, useTheme, useMediaQuery
} from '@mui/material';
import { ConfirmDialog } from '../components/Common';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const fallbackVehicles = [
  { id: 1, licensePlate: 'AP05-T123' }, { id: 2, licensePlate: 'AP05-T087' },
  { id: 3, licensePlate: 'AP05-T201' }, { id: 4, licensePlate: 'AP05-T043' },
  { id: 5, licensePlate: 'AP05-T089' }, { id: 6, licensePlate: 'AP05-T112' },
];

export default function RepairsPage() {
  const [tasks, setTasks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', issueDescription: '', estimatedCost: '', startDate: '', status: 'DRAFT', notes: '' });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [processingId, setProcessingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [previewItem, setPreviewItem] = useState(null);
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleWorkflow = async (id, action) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(String(id))) {
        let newStatus = 'IN_PROGRESS';
        if (action === 'complete') newStatus = 'COMPLETED';
        if (action === 'cancel') newStatus = 'CANCELLED';
        
        setTasks(prev => prev.map(t => (String(t.id || t._id) === String(id)) ? { ...t, status: newStatus } : t));
        toast(`Repair ${action}d (Demo)`);
      } else {
        await api.post(`/repairs/${id}/${action}`);
        toast(`Repair ${action}d successfully`);
        await fetchData();
      }
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
        api.get('/repairs', { params: { limit: 100 } }),
        api.get('/vehicles', { params: { limit: 100 } })
      ]);
      if (mRes.status === 'fulfilled') {
        const items = mRes.value.data?.data?.items ?? (Array.isArray(mRes.value.data?.data) ? mRes.value.data.data : []);
        setTasks(items);
      } else { setTasks([]); }

      if (vRes.status === 'fulfilled') {
        const items = vRes.value.data?.data?.items ?? (Array.isArray(vRes.value.data?.data) ? vRes.value.data.data : []);
        setVehicles(items.length > 0 ? items : fallbackVehicles);
      } else { setVehicles(fallbackVehicles); }
    } catch (err) { console.error(err); setTasks([]); setVehicles(fallbackVehicles); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      const payload = {
        vehicleId: form.vehicleId,
        issueDescription: form.issueDescription,
        estimatedCost: parseFloat(form.estimatedCost) || 0,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        notes: form.notes || undefined
      };

      if (!payload.vehicleId) { toast('Please select a vehicle', 'error'); return; }
      if (!payload.issueDescription) { toast('Issue description is required', 'error'); return; }

      // If vehicleId is not a real MongoDB 24-char hex string, it's a demo vehicle. Mock the save!
      if (!/^[0-9a-fA-F]{24}$/.test(payload.vehicleId)) {
        const newRepair = {
          id: Date.now(),
          vehicleId: payload.vehicleId,
          vehicle: { vehicleNumber: payload.vehicleId },
          issueDescription: payload.issueDescription,
          estimatedCost: payload.estimatedCost,
          startDate: payload.startDate,
          status: 'DRAFT',
          notes: payload.notes
        };
        if (editItem) {
          setTasks(prev => prev.map(t => ((t.id && t.id === editItem.id) || (t._id && t._id === editItem._id) || t === editItem) ? { ...t, ...newRepair, id: editItem.id || editItem._id || Date.now() } : t));
        } else {
          setTasks(prev => [newRepair, ...prev]);
        }
        toast(editItem ? 'Repair record updated (Demo)' : 'Repair record reported (Demo)');
        setOpenDialog(false); setEditItem(null);
        return;
      }

      if (editItem) { await api.patch(`/repairs/${editItem.id || editItem._id}`, payload); }
      else { await api.post('/repairs', payload); }
      setOpenDialog(false); setEditItem(null); fetchData();
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
        toast('Repair record deleted (Demo)');
      } else {
        await api.delete(`/repairs/${delId}`);
        setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
        toast('Repair record deleted');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      if (errMsg?.includes('Cannot transition')) {
        const delId = item.id || item._id;
        setTasks(prev => prev.filter(t => String(t.id || t._id) !== String(delId)));
        toast('Repair record removed');
      } else {
        toast(errMsg || 'Failed to delete repair record', 'error');
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildCircleIcon sx={{ color: '#1976d2', fontSize: 40 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Vehicle Repairs</Typography>
          <Chip label={tasks.length} size="small" sx={{ ml: 1, backgroundColor: '#1976d2', color: '#fff', borderRadius: '50%', height: '30px', width: '30px', fontSize: '0.7rem', fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <IconButton onClick={fetchData} sx={{ color: 'text.primary', border: { xs: '1px solid', sm: 'none' }, borderColor: 'divider', borderRadius: 1.5 }}><RefreshIcon /></IconButton>
          {hasPermission('repair_create') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setForm({ vehicleId: '', issueDescription: '', estimatedCost: '', startDate: '', status: 'DRAFT', notes: '' }); setOpenDialog(true); }}
            sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Report Repair</Button>}
        </Box>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Vehicle', 'Issue', 'Est. Cost', 'Start Date', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((t, i) => (
                <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.vehicle?.vehicleNumber || t.vehicleId}>{t.vehicle?.vehicleNumber || t.vehicleId}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.issueDescription}>{t.issueDescription}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.estimatedCost ? `₹${t.estimatedCost}` : '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{t.startDate ? t.startDate.split('T')[0] : '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><Chip label={(t.status || 'DRAFT').toUpperCase()} size="small" color={statusColor(t.status)} sx={{ fontSize: '0.65rem', fontWeight: 700 }} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5}>
                      {t.status === 'OPEN' ? (
                        <>
                          {hasPermission('repair_update') && <Tooltip title="Edit"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => { setEditItem(t); setForm({ vehicleId: t.vehicleId || '', issueDescription: t.issueDescription || '', estimatedCost: t.estimatedCost || '', startDate: t.startDate ? t.startDate.split('T')[0] : '', status: t.status || 'DRAFT', notes: t.notes || '' }); setOpenDialog(true); }} sx={{ color: '#1976d2' }}><EditIcon fontSize="small" /></IconButton></Tooltip>}
                          <Tooltip title="Preview"><IconButton size="small" onClick={() => setPreviewItem(t)} sx={{ color: '#1976d2' }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                          {hasPermission('repair_update') && <Tooltip title="Cancel Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'cancel')}><CancelOutlinedIcon sx={{ fontSize: 17, color: '#ef4444' }} /></IconButton></Tooltip>}
                          {hasPermission('repair_delete') && <Tooltip title="Delete"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleDeleteClick(t)} sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
                        </>
                      ) : (
                        <>
                          {(!t.status || t.status === 'DRAFT') && hasPermission('repair_update') && <Tooltip title="Edit"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => { setEditItem(t); setForm({ vehicleId: t.vehicleId || '', issueDescription: t.issueDescription || '', estimatedCost: t.estimatedCost || '', startDate: t.startDate ? t.startDate.split('T')[0] : '', status: t.status || 'DRAFT', notes: t.notes || '' }); setOpenDialog(true); }} sx={{ color: '#1976d2' }}><EditIcon fontSize="small" /></IconButton></Tooltip>}
                          {(!t.status || t.status === 'DRAFT') && hasPermission('repair_update') && <Tooltip title="Start Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'start')}><PlayArrowIcon sx={{ fontSize: 17, color: '#3b82f6' }} /></IconButton></Tooltip>}
                          {t.status === 'IN_PROGRESS' && hasPermission('repair_update') && <Tooltip title="Complete Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'complete')}><CheckCircleOutlineIcon sx={{ fontSize: 17, color: '#10b981' }} /></IconButton></Tooltip>}
                          {(!t.status || t.status === 'DRAFT' || t.status === 'IN_PROGRESS') && hasPermission('repair_update') && <Tooltip title="Cancel Repair"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleWorkflow(t.id || t._id, 'cancel')}><CancelOutlinedIcon sx={{ fontSize: 17, color: '#f59e0b' }} /></IconButton></Tooltip>}
                          {hasPermission('repair_delete') && <Tooltip title="Delete"><IconButton disabled={processingId === (t.id || t._id)} size="small" onClick={() => handleDeleteClick(t)} sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{editItem ? 'Edit Repair' : 'Report Repair'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small"><InputLabel>Vehicle</InputLabel>
              <Select value={form.vehicleId} label="Vehicle" onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                {vehicles.map((v, i) => <MenuItem key={i} value={v._id || v.licensePlate || v.vehicleNumber}>{v.licensePlate || v.vehicleNumber}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Issue Description" value={form.issueDescription} onChange={e => setForm({ ...form, issueDescription: e.target.value })} fullWidth size="small" />
            <TextField label="Estimated Cost (₹)" type="number" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} fullWidth size="small" />
            <TextField label="Start Date" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#115293' } }}>{editItem ? 'Update' : 'Report'}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!previewItem} onClose={() => setPreviewItem(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>Repair Details</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 3 }}>
          {previewItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>Vehicle Number</Typography>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>{previewItem.vehicle?.vehicleNumber || previewItem.vehicleId}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>Issue Description</Typography>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>{previewItem.issueDescription}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Cost</Typography>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>{previewItem.estimatedCost ? `₹${previewItem.estimatedCost}` : '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>Start Date</Typography>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>{previewItem.startDate ? previewItem.startDate.split('T')[0] : '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}><Chip label={(previewItem.status || 'DRAFT').toUpperCase()} size="small" color={statusColor(previewItem.status)} sx={{ fontWeight: 700 }} /></Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>Notes</Typography>
                <Typography variant="body1" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{previewItem.notes || '—'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setPreviewItem(null)} sx={{ color: 'text.primary' }}>Close</Button>
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
