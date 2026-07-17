import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Avatar, Typography, Chip, useTheme, useMediaQuery, Card, CircularProgress,
  Tabs, Tab, Grid, Divider, Tooltip
} from '@mui/material';
import { Add, Edit, People, Delete as DeleteIcon, Visibility, Link, Close } from '@mui/icons-material';
import api, { userService, roleService, driverService } from '../../services/api';
import { StatusChip, PageHeader, ConfirmDialog } from '../components/Common';
import { ALL_PERMISSIONS } from './RolesPage';
import { useAuth } from '../../contexts/AuthContext';

const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const emptyForm = { name: '', username: '', email: '', password: '', mobile: '', roleId: '', status: 'ACTIVE' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const [viewDialog, setViewDialog] = useState(false);
  const [viewTab, setViewTab] = useState(0);
  const [viewUser, setViewUser] = useState(null);
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes, dRes] = await Promise.allSettled([
        userService.getAll({ limit: 100 }),
        roleService.getAll(),
        driverService.getAll({ limit: 100 })
      ]);
      const uData = uRes.status === 'fulfilled' ? uRes.value.data?.data ?? uRes.value.data : null;
      const uItems = uData?.items ?? (Array.isArray(uData) ? uData : []);
      setUsers(uItems);
      const rData = rRes.status === 'fulfilled' ? rRes.value.data?.data ?? rRes.value.data : null;
      setRoles(Array.isArray(rData) ? rData : (rData?.items && Array.isArray(rData.items) ? rData.items : []));
      const dData = dRes.status === 'fulfilled' ? dRes.value.data?.data ?? dRes.value.data : null;
      setDrivers(Array.isArray(dData) ? dData : (dData?.items && Array.isArray(dData.items) ? dData.items : []));
    } catch (err) {
      console.error(err);
      setUsers([]);
      setRoles([]);
      setDrivers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setSelected(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ name: u.name || '', username: u.username || '', email: u.email || '', password: '', mobile: u.mobile || '', roleId: u.roleId || u.role?.id || '', status: u.status || 'ACTIVE' });
    setError('');
    setDialogOpen(true);
  };

  const handleCheckExisting = async () => {
    if (selected) return; // Only check during create mode
    if (!form.email && !form.username) return;
    
    try {
      const searchStr = form.email || form.username;
      const res = await userService.getAll({ search: searchStr });
      const items = res.data?.data?.items || res.data?.items || [];
      const match = items.find(u => 
        (form.email && u.email?.toLowerCase() === form.email.toLowerCase()) || 
        (form.username && u.username?.toLowerCase() === form.username.toLowerCase())
      );
      
      if (match) {
        setSelected(match);
        setForm({
          name: match.name || '',
          username: match.username || '',
          email: match.email || '',
          password: '',
          mobile: match.mobile || '',
          roleId: match.roleId || match.role?.id || '',
          status: match.status || 'ACTIVE'
        });
        setSnack({ open: true, msg: 'Account already exists. Details loaded for editing.', severity: 'info' });
      }
    } catch (err) {
      console.error('Error checking existing user:', err);
    }
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
      <PageHeader 
        subicon={<People/>}
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
                      {(() => {
                        const fullRole = roles.find(r => r.id === u.roleId || r.id === u.role?.id);
                        return fullRole?.rolePermissions?.length || fullRole?.permissions?.length || u.role?.rolePermissions?.length || u.role?.permissions?.length || 0;
                      })()}
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
                        <Tooltip title="View Profile">
                          <IconButton size="small" onClick={() => { setViewUser(u); setViewTab(0); setViewDialog(true); }} sx={{ color: '#10b981' }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
            <TextField label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} onBlur={handleCheckExisting} fullWidth />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={handleCheckExisting} type="email" fullWidth required />
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

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ p: 2, pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                {viewUser?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {viewUser?.name}
                  <StatusChip status={viewUser?.status} />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewUser?.role?.name || 'User'} • @{viewUser?.username || viewUser?.email?.split('@')[0]}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setViewDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={viewTab} onChange={(e, v) => setViewTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="Overview" />
              <Tab label="Account" />
              <Tab label="Access" />
              <Tab label="Profile Links" />
              <Tab label="Activity" />
            </Tabs>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, minHeight: 300 }}>
          {viewUser && (
            <Box sx={{ p: 2 }}>
              {viewTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(124, 111, 247, 0.1)', color: '#7C6FF7' }}>
                        <People fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {(() => {
                            const fullRole = roles.find(r => r.id === viewUser?.roleId || r.id === viewUser?.role?.id);
                            return fullRole?.rolePermissions?.length || fullRole?.permissions?.length || viewUser?.role?.rolePermissions?.length || viewUser?.role?.permissions?.length || 0;
                          })()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Allocated Permissions</Typography>
                      </Box>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <Add fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Scopes</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{viewUser?.scopes?.length || 0}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Data Scopes</Typography>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              )}
              {viewTab === 1 && (
                <Card sx={{ p: 0, bgcolor: 'background.paper', borderRadius: 3, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Personal Information</Typography>
                  </Box>
                  <Grid container spacing={0}>
                    {[
                      { label: 'Full Name', value: viewUser.name },
                      { label: 'Username', value: viewUser.username ? `@${viewUser.username}` : `@${viewUser.email?.split('@')[0]}` },
                      { label: 'Email Address', value: viewUser.email },
                      { label: 'Mobile Number', value: viewUser.mobile || 'Not set' },
                      { label: 'Assigned Role', value: `${viewUser.role?.name || 'User'} (${viewUser.role?.key || 'user'})` },
                      { label: 'Account Status', value: <StatusChip status={viewUser.status} /> },
                      { label: 'Last Login', value: viewUser.lastLogin ? new Date(viewUser.lastLogin).toLocaleString() : 'Never logged in' },
                      { label: 'Date Created', value: viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleString() : 'Unknown' }
                    ].map((item, idx) => (
                      <Grid item xs={12} sm={6} key={idx} sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', borderRight: { sm: idx % 2 === 0 ? '1px solid' : 'none' }, borderRightColor: 'divider' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{item.value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              )}
              {viewTab === 2 && (
                <Card sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>Allocated Permissions</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(() => {
                      const fullRole = roles.find(r => r.id === viewUser?.roleId || r.id === viewUser?.role?.id);
                      const perms = fullRole?.rolePermissions || fullRole?.permissions || viewUser?.role?.rolePermissions || viewUser?.role?.permissions || [];
                      if (perms.length === 0) return <Typography color="text.secondary">No permissions allocated to this role.</Typography>;
                      return perms.map((p, i) => (
                        <Chip key={i} label={p.permission?.description || p.permission?.key || p.name || p} size="small" sx={{ bgcolor: isDark ? 'rgba(124, 111, 247, 0.15)' : '#7C6FF715', color: '#7C6FF7', fontWeight: 600, px: 1, py: 1.5, borderRadius: 1.5 }} />
                      ));
                    })()}
                  </Box>
                </Card>
              )}
              {viewTab === 3 && (
                <Card sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                  <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: 'text.secondary' }}>
                    <Link fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Linked Profile</Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                    {(() => {
                      const linkedDriver = drivers.find(d => d.userId === viewUser.id || d.user_id === viewUser.id || d.email === viewUser.email);
                      if (linkedDriver) {
                        return `An operational driver profile is currently linked. (Driver: ${linkedDriver.name})`;
                      }
                      return 'No operational profile is currently linked to this login account.';
                    })()}
                  </Typography>
                  
                  <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 2, border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, mb: 3, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      <Box component="strong" sx={{ color: 'text.primary', display: 'block', mb: 0.5 }}>How linking works:</Box>
                      The <strong>User</strong> is the login account for dashboard access. The <strong>Driver</strong> is the operational profile used for tracking. Linking them ensures the driver only has access to their own assigned trips, fuel logs, and vehicles.
                    </Typography>
                  </Box>
                  {(() => {
                    const isLinked = drivers.some(d => d.userId === viewUser.id || d.user_id === viewUser.id || d.email === viewUser.email);
                    if (!isLinked) {
                      return <Button variant="contained" startIcon={<Link />} sx={{ px: 4, py: 1, borderRadius: 2 }}>Create Driver Account</Button>;
                    }
                    return null;
                  })()}
                </Card>
              )}
              {viewTab === 4 && (
                <Typography color="text.secondary">No recent activity.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
