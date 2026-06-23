import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Chip, Typography, Checkbox, FormGroup, FormControlLabel,
} from '@mui/material';
import { Add, Edit, VpnKey, Shield } from '@mui/icons-material';
import { roleService, permissionService } from '../services/api';
import { StatusChip, PageHeader, EmptyState } from '../components/Common';
import { useAuth } from '../context/AuthContext';

const statuses = ['ACTIVE', 'INACTIVE'];
const emptyForm = { name: '', key: '', description: '', status: 'ACTIVE', permissionKeys: [], isMaster: false };

function extractList(res) {
  const body = res.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  if (body?.data?.items) return body.data.items;
  if (body?.data?.data) return body.data.data;
  return [];
}

function getPermKeys(role) {
  if (role.rolePermissions) return role.rolePermissions.map((rp) => rp.permission?.key ?? rp.key);
  if (role.permissionKeys) return role.permissionKeys;
  return [];
}

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.allSettled([
        roleService.getAll(),
        permissionService.getAll(),
      ]);
      const rData = rRes.status === 'fulfilled' ? extractList(rRes.value) : [];
      const pData = pRes.status === 'fulfilled' ? extractList(pRes.value) : [];
      setRoles(rData);
      setPermissions(pData);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const groupedPermissions = permissions.reduce((acc, p) => {
    const mod = p.module || 'general';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setSelected(role);
    setForm({
      name: role.name || '',
      key: role.key || '',
      description: role.description || '',
      status: role.status || 'ACTIVE',
      permissionKeys: getPermKeys(role),
      isMaster: role.isMaster || false,
    });
    setError('');
    setDialogOpen(true);
  };

  function togglePerm(key) {
    setForm((prev) => {
      const keys = [...prev.permissionKeys];
      const idx = keys.indexOf(key);
      if (idx >= 0) keys.splice(idx, 1); else keys.push(key);
      return { ...prev, permissionKeys: keys };
    });
  }

  function selectAllInModule(module) {
    const modKeys = (groupedPermissions[module] || []).map((p) => p.key);
    setForm((prev) => ({ ...prev, permissionKeys: [...new Set([...prev.permissionKeys, ...modKeys])] }));
  }

  function clearModule(module) {
    const modKeys = new Set((groupedPermissions[module] || []).map((p) => p.key));
    setForm((prev) => ({ ...prev, permissionKeys: prev.permissionKeys.filter((k) => !modKeys.has(k)) }));
  }

  const handleSave = async () => {
    if (!form.name || !form.key) {
      setError('Name and Key are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const permKeys = form.isMaster ? permissions.map((p) => p.key) : form.permissionKeys;
      if (selected) {
        await roleService.update(selected.id, { name: form.name, key: form.key, description: form.description, status: form.status, isMaster: form.isMaster });
        await roleService.assignPermissions(selected.id, permKeys);
      } else {
        const res = await roleService.create({ name: form.name, key: form.key, description: form.description, status: form.status, isMaster: form.isMaster });
        const created = res.data?.data ?? res.data;
        if (created?.id) {
          await roleService.assignPermissions(created.id, permKeys);
        }
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role');
    }
    setSaving(false);
  };

  return (
    <Box>
      <PageHeader title="Roles & Permissions" subtitle="Manage system roles and their permission coverage" icon={Shield} action={
        hasPermission('role_create') ? <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Role</Button> : null
      } />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>Loading...</TableCell></TableRow>
            ) : roles.length === 0 ? (
              <TableRow><TableCell colSpan={6}><EmptyState icon={<Add />} title="No roles" description="Create the first role to start assigning permissions." action={hasPermission('role_create') ? <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create Role</Button> : null} /></TableCell></TableRow>
            ) : roles.map((role) => {
              const permCount = getPermKeys(role).length;
              return (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{role.name}</Typography>
                      {role.isMaster && <Chip label="Master" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#FFE5CC', color: '#FF6B35', fontWeight: 600 }} />}
                      {role.isSystem && <Chip label="System" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#EEF0FF', color: '#7C6FF7' }} />}
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary',textTransform:'capitalize' }}>{role.key}</Typography></TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 250 }}>{role.description || '—'}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Shield sx={{ fontSize: 16, color: '#00C2A8' }} />
                      <Chip label={`${permCount} permissions`} size="small" sx={{ fontWeight: 500 }} />
                    </Stack>
                  </TableCell>
                  <TableCell><StatusChip status={role.status} /></TableCell>
                  <TableCell>
                    {hasPermission('role_update') && (
                      <IconButton size="small" onClick={() => openEdit(role)}><Edit fontSize="small" /></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selected ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
              <TextField label="Key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} fullWidth required helperText="Lowercase, numbers, underscores" disabled={selected?.isSystem} />
            </Stack>
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} select fullWidth>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <FormControlLabel
              control={<Checkbox checked={form.isMaster} onChange={(e) => setForm({ ...form, isMaster: e.target.checked })} />}
              label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Master Role (Super Admin - Auto-assigns all permissions)</Typography>}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Permissions {form.isMaster && <Chip label="All permissions" size="small" sx={{ ml: 1, fontSize: '0.7rem', bgcolor: '#FFE5CC', color: '#FF6B35' }} />}</Typography>
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <Box key={module} mb={1.5} sx={{ opacity: form.isMaster ? 0.5 : 1, pointerEvents: form.isMaster ? 'none' : 'auto' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Chip label={module} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
                    <Button size="small" onClick={() => selectAllInModule(module)} disabled={form.isMaster}>Select All</Button>
                    <Button size="small" onClick={() => clearModule(module)} disabled={form.isMaster}>Clear</Button>
                    <Typography variant="caption" color="text.secondary">
                      ({perms.filter((p) => form.permissionKeys.includes(p.key)).length}/{perms.length})
                    </Typography>
                  </Stack>
                  <FormGroup row>
                    {perms.map((perm) => (
                      <FormControlLabel
                        key={perm.id}
                        control={<Checkbox size="small" checked={form.isMaster || form.permissionKeys.includes(perm.key)} onChange={() => togglePerm(perm.key)} disabled={form.isMaster} />}
                        label={<Typography variant="body2" sx={{ fontSize: '0.8rem', fontFamily: '"Nunito", sans-serif' }}>{perm.key}</Typography>}
                        sx={{ width: '25%', minWidth: 180 }}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : selected ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}