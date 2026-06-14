import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Avatar, Typography,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { userService, roleService } from '../services/api';
import { StatusChip, PageHeader, EmptyState } from '../components/Common';
import { useAuth } from '../context/AuthContext';

const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const emptyForm = { name: '', email: '', password: '', mobile: '', roleId: '', status: 'ACTIVE' };

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.allSettled([
        userService.getAll({ limit: 100 }),
        roleService.getAll(),
      ]);
      const uData = uRes.status === 'fulfilled' ? uRes.value.data?.data ?? uRes.value.data : null;
      setUsers(uData?.items ?? (Array.isArray(uData) ? uData : []));
      const rData = rRes.status === 'fulfilled' ? rRes.value.data?.data ?? rRes.value.data : null;
      setRoles(Array.isArray(rData) ? rData : rData?.items ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setSelected(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (u) => {
    setSelected(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      mobile: u.mobile || '',
      roleId: u.roleId || u.role?.id || '',
      status: u.status || 'ACTIVE',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.roleId) {
      setError('Name, Email, and Role are required');
      return;
    }
    if (!selected && !form.password) {
      setError('Password is required for new users');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (selected && !payload.password) delete payload.password;
      if (!payload.mobile) delete payload.mobile;
      if (selected) {
        await userService.update(selected.id, payload);
      } else {
        await userService.create(payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
    setSaving(false);
  };

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage system users"
        action={hasPermission('user_create') ? (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add User</Button>
        ) : null}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {['Name', 'Email', 'Mobile', 'Role', 'Status', ''].map((h) => <TableCell key={h}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6}><EmptyState icon="👤" title="No users" description="Add your first user" action={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add User</Button>} /></TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#00C2A818', color: '#00C2A8', fontSize: '0.75rem' }}>
                      {(u.name || '?')[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{u.email || '—'}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.mobile || '—'}</TableCell>
                <TableCell>{u.role?.name || '—'}</TableCell>
                <TableCell><StatusChip status={u.status} /></TableCell>
                <TableCell>
                  {hasPermission('user_update') && (
                    <IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" fullWidth required />
            <TextField label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} fullWidth />
            {!selected && <TextField label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" fullWidth required />}
            <TextField label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} select fullWidth required>
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
            <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} select fullWidth>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
