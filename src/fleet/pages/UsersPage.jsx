import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Avatar, Typography, Chip, useTheme, useMediaQuery, Card, CircularProgress
} from '@mui/material';
import { Add, Edit, People, Delete as DeleteIcon } from '@mui/icons-material';
import { userService, roleService } from '../../services/api';
import { StatusChip, PageHeader, ConfirmDialog } from '../components/Common';
import { ALL_PERMISSIONS } from './RolesPage';
import { useAuth } from '../../contexts/AuthContext';

const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const emptyForm = { name: '', email: '', password: '', mobile: '', roleId: '', status: 'ACTIVE' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.allSettled([
        userService.getAll({ limit: 100 }),
        roleService.getAll(),
      ]);
      const uData = uRes.status === 'fulfilled' ? uRes.value.data?.data ?? uRes.value.data : null;
      const uItems = uData?.items ?? (Array.isArray(uData) ? uData : []);
      setUsers(uItems);
      const rData = rRes.status === 'fulfilled' ? rRes.value.data?.data ?? rRes.value.data : null;
      setRoles(Array.isArray(rData) ? rData : (rData?.items && Array.isArray(rData.items) ? rData.items : []));
    } catch (err) {
      console.error(err);
      setUsers([]);
      setRoles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setSelected(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ name: u.name || '', email: u.email || '', password: '', mobile: u.mobile || '', roleId: u.roleId || u.role?.id || '', status: u.status || 'ACTIVE' });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || (!selected && !form.email)) { setError('Name and Email are required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      delete payload.driverId; // Don't send this to user API
      if (!payload.mobile) delete payload.mobile;
      
      let userId = selected?.id;
      if (selected) { 
        delete payload.password;
        delete payload.email; // email cannot be updated
        await userService.update(selected.id, payload); 
      } else { 
        const res = await userService.create(payload); 
        userId = res.data?.id || res.data?._id;
      }

      // If a driver is linked, update the driver record with the user ID
      if (form.driverId && userId) {
        // We only patch the user_id onto the driver
        const driverToUpdate = drivers.find(d => d.id === form.driverId || d._id === form.driverId);
        if (driverToUpdate) {
          const driverPayload = { ...driverToUpdate, user_id: userId, userId: userId };
          await api.patch(`/drivers/${form.driverId}`, driverPayload);
        }
      }

      setDialogOpen(false); fetchData();
      setSnack({ open: true, msg: selected ? 'User updated' : 'User created', severity: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.item) return;
    try {
      await userService.delete(deleteConfirm.item.id);
      fetchData();
      setSnack({ open: true, msg: 'User deleted', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: 'Failed to delete user', severity: 'error' });
    }
    setDeleteConfirm({ open: false, item: null });
  };

  return (
    <Box>
      <PageHeader title="Users" subtitle="Manage system users" icon={People}
        action={hasPermission('user_create') ? <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ width: { xs: '100%', sm: 'auto' } }}>Add User</Button> : null}
      />
      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Name', 'Email', 'Mobile', 'Role', 'Permissions', 'Access', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No users found</TableCell></TableRow>
              ) : users.map((u, i) => (
                <TableRow key={u.id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#10b98118', color: '#10b981', fontSize: '0.75rem' }}>
                        {(u.name || '?')[0].toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{u.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{u.email || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{u.mobile || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}><Chip label={u.role?.name || '—'} size="small" sx={{ bgcolor: '#7C6FF718', color: '#7C6FF7', fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {((u.role?.rolePermissions?.length ?? u.role?.permissions?.length) || 0)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>Allocated</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Chip label={u.role?.name || 'No role'} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', color: 'text.primary', borderColor: 'divider' }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}><StatusChip status={u.status} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    {(hasPermission('user_update') || hasPermission('user_delete')) && (
                      <Stack direction="row" spacing={0.5}>
                        {hasPermission('user_update') && <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: '#60a5fa' }}><Edit fontSize="small" /></IconButton>}
                        {hasPermission('user_delete') && <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, item: u })} sx={{ color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton>}
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>{selected ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" fullWidth required />
            <TextField label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} fullWidth />
            {!selected && <TextField label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" fullWidth required />}
            <TextField label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} select fullWidth>
              <MenuItem value="">None</MenuItem>
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
            {form.roleId && (
              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', mt: -1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block', textTransform: 'uppercase' }}>
                  Role Permissions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(() => {
                    const selectedRole = roles.find(r => r.id === form.roleId);
                    const perms = selectedRole?.rolePermissions || selectedRole?.permissions;
                    if (perms && Array.isArray(perms) && perms.length > 0) {
                      return perms.map((p, i) => (
                        <Chip key={p.permission?.key || p.id || p.name || p || i} label={p.permission?.description || p.permission?.key || p.name || p} size="small" variant="outlined" sx={{ fontSize: '0.65rem', color: 'text.primary', borderColor: 'divider' }} />
                      ));
                    }
                    return <Typography variant="caption" color="text.secondary">No permission details available</Typography>;
                  })()}
                </Box>
              </Box>
            )}
            <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} select fullWidth>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete User"
        content={`Are you sure you want to delete ${deleteConfirm.item?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, item: null })}
      />
    </Box>
  );
}
