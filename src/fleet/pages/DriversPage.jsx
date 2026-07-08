import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Avatar, Snackbar, Alert, MenuItem, useTheme, useMediaQuery
} from '@mui/material';
import { ConfirmDialog } from '../components/Common';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const fallbackDrivers = [
  { id: 1, name: 'Rajesh Kumar', email: 'rajesh@fleet.com', phone: '9876543210', licenseNumber: 'DL-2021-4521', assignedVehicle: 'AP05-T123', status: 'active' },
  { id: 2, name: 'Suresh Babu', email: 'suresh@fleet.com', phone: '9876543211', licenseNumber: 'DL-2022-1187', assignedVehicle: 'AP05-T087', status: 'active' },
  { id: 3, name: 'Mohan Reddy', email: 'mohan@fleet.com', phone: '9876543212', licenseNumber: 'DL-2020-3344', assignedVehicle: 'AP05-T201', status: 'active' },
  { id: 4, name: 'Venkat Rao', email: 'venkat@fleet.com', phone: '9876543213', licenseNumber: 'DL-2023-5566', assignedVehicle: 'AP05-T043', status: 'on_leave' },
  { id: 5, name: 'Prasad Nair', email: 'prasad@fleet.com', phone: '9876543214', licenseNumber: 'DL-2021-7788', assignedVehicle: '', status: 'active' },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', licenseNumber: '', status: 'AVAILABLE' });
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, driver: null });
  const { hasPermission } = useAuth();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setDrivers(items.length > 0 ? items : fallbackDrivers);
    } catch (err) { console.error(err); setDrivers(fallbackDrivers); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setError('');
    try {
      if (editDriver) {
        await api.patch(`/drivers/${editDriver.id || editDriver._id}`, form);
        setSnack({ open: true, msg: 'Driver updated', severity: 'success' });
        addNotification('Success', 'Driver updated successfully', 'success');
      } else {
        await api.post('/drivers', form);
        setSnack({ open: true, msg: 'Driver created', severity: 'success' });
        addNotification('Success', 'Driver created successfully', 'success');
      }
      setOpenDialog(false);
      setEditDriver(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save driver. Check mobile number length (min 10) and license format.');
      addNotification('Error', 'Failed to save driver', 'error');
    }
  };

  const handleDeleteClick = (d) => {
    setDeleteConfirm({ open: true, driver: d });
  };

  const handleConfirmDelete = async () => {
    const d = deleteConfirm.driver;
    if (!d) return;
    try {
      if (typeof d.id === 'number') {
        setDrivers(prev => prev.filter(driver => driver.id !== d.id));
        setSnack({ open: true, msg: 'Driver deleted successfully', severity: 'success' });
        addNotification('Deleted', 'Driver deleted successfully', 'warning');
      } else {
        await api.delete(`/drivers/${d.id || d._id}`);
        setSnack({ open: true, msg: 'Driver deleted successfully', severity: 'success' });
        addNotification('Deleted', 'Driver deleted successfully', 'warning');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: err.response?.data?.message || 'Failed to delete driver', severity: 'error' });
      addNotification('Error', 'Failed to delete driver', 'error');
    } finally {
      setDeleteConfirm({ open: false, driver: null });
    }
  };

  const handleEdit = (d) => {
    setEditDriver(d);
    setForm({ name: d.name || '', mobile: d.mobile || d.phone || '', licenseNumber: d.licenseNumber || '', status: d.status || 'AVAILABLE' });
    setError('');
    setOpenDialog(true);
  };

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    return (d.name || '').toLowerCase().includes(q) || (d.mobile || d.phone || '').includes(q);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.primary' }} /> }}
            sx={{ flex: 1, width: { xs: '100%', sm: 200 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }} />
          {hasPermission('driver_create') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditDriver(null); setForm({ name: '', mobile: '', licenseNumber: '', status: 'AVAILABLE' }); setError(''); setOpenDialog(true); }}
            sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Add Driver</Button>}
        </Box>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Driver', 'Mobile', 'License', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((d, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: '0.8rem' }}>{(d.name || 'U')[0]}</Avatar>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{d.mobile || d.phone || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary' }}>{d.licenseNumber || '—'}</TableCell>
                  <TableCell>
                    <Chip label={(d.status || 'AVAILABLE').toUpperCase()} size="small"
                      color={(d.status === 'AVAILABLE' || d.status === 'active' || !d.status) ? 'success' : 'default'}
                      sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(d)}><EditOutlinedIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(d)}><DeleteOutlineIcon sx={{ fontSize: 17, color: '#ef4444' }} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.primary' }}>No drivers found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{editDriver ? 'EditOutlined Driver' : 'Add New Driver'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
            <TextField label="Mobile Number" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} fullWidth size="small" />
            <TextField label="License Number" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} fullWidth size="small" />
            <TextField label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} fullWidth size="small" select>
              {['AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2' }}>{editDriver ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Confirm Delete"
        message={`Are you sure you want to delete driver ${deleteConfirm.driver?.name}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, driver: null })}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
