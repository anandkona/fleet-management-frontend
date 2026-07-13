import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TablePagination, CircularProgress, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, Snackbar, Alert, Grid, Checkbox, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ConfirmDialog } from '../components/Common';
import api, { roleService, permissionService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const ALL_PERMISSIONS = [
  "user_view", "user_create", "user_update", "user_delete", "user_deactivate",
  "role_view", "role_create", "role_update", "role_delete",
  "permission_view", "permission_assign",
  "vehicle_view", "vehicle_create", "vehicle_update", "vehicle_delete",
  "driver_view", "driver_create", "driver_update", "driver_delete",
  "asset_view", "asset_create", "asset_update", "asset_delete", "asset_assign", "asset_return", "asset_transfer", "asset_mark_damaged", "asset_mark_lost",
  "trip_view", "trip_create", "trip_update", "trip_start", "trip_end", "trip_cancel",
  "dispatch_view", "dispatch_assign",
  "fuel_view", "fuel_create", "fuel_update", "fuel_delete", "fuel_submit", "fuel_approve",
  "expense_view", "expense_create", "expense_update", "expense_delete", "expense_submit", "expense_approve",
  "repair_view", "repair_create", "repair_update", "repair_close",
  "maintenance_view", "maintenance_create", "maintenance_update", "maintenance_submit", "maintenance_approve",
  "finance_view", "finance_create", "finance_update", "finance_delete", "finance_approve", "finance_history_view",
  "report_view", "report_export",
  "settings_view", "settings_update",
  "vehicle_compliance_view", "vehicle_compliance_create", "vehicle_compliance_update", "vehicle_compliance_delete", "vehicle_compliance_verify", "vehicle_compliance_renew",
  "document_metadata_view", "document_metadata_create", "document_metadata_update", "document_metadata_delete", "document_metadata_verify",
  "compliance_alerts_view", "compliance_history_view",
  "finance_transactions_view", "finance_transactions_create", "finance_transactions_update", "finance_transactions_delete",
  "trip_billing_view", "trip_billing_create", "trip_billing_update", "trip_billing_delete", "trip_billing_mark_paid",
  "payments_view", "payments_create", "payments_update", "payments_delete",
  "vendors_view", "vendors_create", "vendors_update", "vendors_delete",
  "customers_view", "customers_create", "customers_update", "customers_delete",
  "pnl_view"
];

const toRolePerms = (keys) => keys.map(k => ({ permission: { key: k } }));

export const DEFAULT_ROLES = [
  { id: 'cmqqj0ryb0000u8ywkhvlwg2d', name: 'Super Admin', key: 'super_admin', status: 'ACTIVE', rolePermissions: toRolePerms(ALL_PERMISSIONS) },
  { id: 'role_admin', name: 'Admin', key: 'admin', status: 'ACTIVE', rolePermissions: toRolePerms(ALL_PERMISSIONS.filter(p => !p.includes('finance_history') && !p.includes('pnl'))) },
  { id: 'role_opsadmin', name: 'Ops Admin', key: 'ops_admin', status: 'ACTIVE', rolePermissions: toRolePerms(ALL_PERMISSIONS.filter(p => p.startsWith('trip') || p.startsWith('vehicle') || p.startsWith('driver') || p.startsWith('asset') || p.startsWith('fuel') || p.startsWith('expense') || p.startsWith('report'))) },
  { id: 'role_supervisor', name: 'Supervisor', key: 'supervisor', status: 'ACTIVE', rolePermissions: toRolePerms(ALL_PERMISSIONS.filter(p => p.includes('view') || p.includes('approve') || p.includes('verify'))) },
  { id: 'role_mechanic', name: 'Mechanic', key: 'mechanic', status: 'ACTIVE', rolePermissions: toRolePerms(ALL_PERMISSIONS.filter(p => p.startsWith('repair') || p.startsWith('maintenance') || p === 'vehicle_view')) },
  { id: 'role_finance', name: 'Finance', key: 'finance', status: 'ACTIVE', rolePermissions: toRolePerms(ALL_PERMISSIONS.filter(p => p.startsWith('finance') || p.startsWith('payment') || p.startsWith('trip_billing') || p.startsWith('vendor') || p.startsWith('customer') || p.startsWith('pnl') || p.startsWith('expense') || p.startsWith('fuel'))) },
  { id: 'role_manager', name: 'Manager', key: 'manager', status: 'ACTIVE', rolePermissions: toRolePerms(ALL_PERMISSIONS.filter(p => p.startsWith('trip') || p.startsWith('vehicle') || p.startsWith('driver') || p.startsWith('asset') || p.startsWith('fuel') || p.startsWith('expense') || p.startsWith('report') || p.startsWith('user_view'))) },
  { id: 'role_driver', name: 'Driver', key: 'driver', status: 'ACTIVE', rolePermissions: toRolePerms(['trip_view', 'trip_update', 'trip_start', 'trip_end', 'expense_submit', 'fuel_submit', 'vehicle_view']) },
  { id: 'role_assistant_driver', name: 'Assistant Driver', key: 'assistant_driver', status: 'ACTIVE', rolePermissions: toRolePerms(['trip_view', 'vehicle_view']) }
];

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', key: '', status: 'ACTIVE', permissions: [] });
  const [editId, setEditId] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getAll().catch(() => ({ items: DEFAULT_ROLES })),
        api.get('/permissions').catch(() => ({
          data: { data: ALL_PERMISSIONS.map(k => ({ key: k, module: k.split('_')[0].toUpperCase(), name: k })) }
        }))
      ]);

      setRoles(Array.isArray(rolesRes) ? rolesRes : rolesRes?.items ?? DEFAULT_ROLES);

      const perms = permsRes.data?.data ?? (Array.isArray(permsRes) ? permsRes : []);
      setAvailablePermissions(perms);

      const grouped = perms.reduce((acc, p) => {
        const mod = p.module || p.key.split('_')[0].toUpperCase();
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(p);
        return acc;
      }, {});
      setGroupedPermissions(grouped);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      if (editId) {
        // Mocking API call for role updates and assigning permissions
        // await roleService.update(editId, { name: form.name, key: form.key, status: form.status });
        // await roleService.assignPermissions(editId, form.permissions);
        setRoles(prev => prev.map(r => r.id === editId ? { ...r, ...form, rolePermissions: toRolePerms(form.permissions) } : r));
        setSnack({ open: true, msg: 'Role updated successfully', severity: 'success' });
      } else {
        // const newRoleRes = await roleService.create({ name: form.name, key: form.key, status: form.status });
        // await roleService.assignPermissions(newRoleRes.id || newRoleRes.data?.id, form.permissions);
        const newRole = { id: Date.now().toString(), ...form, rolePermissions: toRolePerms(form.permissions) };
        setRoles(prev => [newRole, ...prev]);
        setSnack({ open: true, msg: 'Role created successfully', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: 'Error saving role', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      // await roleService.delete(deleteConfirm.item.id);
      setRoles(prev => prev.filter(r => r.id !== deleteConfirm.item.id));
      setSnack({ open: true, msg: 'Role deleted successfully', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: 'Error deleting role', severity: 'error' });
    } finally {
      setDeleteConfirm({ open: false, item: null });
    }
  };

  const handleTogglePermission = (permKey) => {
    setForm(prev => {
      const perms = prev.permissions.includes(permKey)
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey];
      return { ...prev, permissions: perms };
    });
  };

  const handleToggleGroup = (groupMod) => {
    const groupPermKeys = groupedPermissions[groupMod].map(p => p.key);
    const allSelected = groupPermKeys.every(k => form.permissions.includes(k));
    setForm(prev => {
      let newPerms = [...prev.permissions];
      if (allSelected) {
        newPerms = newPerms.filter(k => !groupPermKeys.includes(k));
      } else {
        groupPermKeys.forEach(k => {
          if (!newPerms.includes(k)) newPerms.push(k);
        });
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const paged = roles.slice(page * 10, (page + 1) * 10);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {hasPermission('role_create') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ name: '', key: '', status: 'ACTIVE', permissions: [] }); setEditId(null); setDialogOpen(true); }} sx={{ flex: { xs: 1, sm: 'none' }, bgcolor: '#1976d2' }}>Create Role</Button>}
        </Stack>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Role Name', 'Key', 'Status', 'Permissions', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r, i) => {
                const permsCount = r.rolePermissions?.length || r.permissions?.length || 0;
                return (
                  <TableRow key={r.id || i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{page * 10 + i + 1}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.key}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Chip label={r.status} size="small" color={r.status === 'ACTIVE' ? 'success' : 'default'} sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      {permsCount >= availablePermissions.length && availablePermissions.length > 0 ? 'Full Access' : `${permsCount} permissions`}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={0.5}>
                        {r.key !== 'super_admin' && (
                          <>
                            {hasPermission('role_update') && <Tooltip title="Edit Role">
                              <IconButton size="small" onClick={() => {
                                const keys = r.rolePermissions ? r.rolePermissions.map(rp => rp.permission?.key) : (r.permissions || []);
                                setForm({ name: r.name, key: r.key, status: r.status, permissions: keys });
                                setEditId(r.id);
                                setDialogOpen(true);
                              }}>
                                <EditIcon sx={{ fontSize: 17, color: '#60a5fa' }} />
                              </IconButton>
                            </Tooltip>}
                            {hasPermission('role_delete') && <Tooltip title="Delete Role">
                              <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, item: r })}>
                                <DeleteIcon sx={{ fontSize: 17, color: '#ef4444' }} />
                              </IconButton>
                            </Tooltip>}
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paged.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No roles found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
        {!loading && roles.length > 10 && (
          <TablePagination
            component="div"
            count={roles.length}
            rowsPerPage={10}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPageOptions={[10]}
            sx={{ color: 'text.primary', borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{editId ? 'EditOutlined Role' : 'Create Role'}</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Role Name" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Role Key" fullWidth size="small" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} disabled={editId !== null} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Permissions</Typography>
            <Button size="small" onClick={() => setForm(f => ({ ...f, permissions: f.permissions.length === availablePermissions.length ? [] : availablePermissions.map(p => p.key) }))}>
              {form.permissions.length === availablePermissions.length ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {Object.entries(groupedPermissions).map(([group, perms]) => {
              const allSelected = perms.every(p => form.permissions.includes(p.key));
              const someSelected = perms.some(p => form.permissions.includes(p.key)) && !allSelected;

              return (
                <Accordion key={group} disableGutters variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider', boxShadow: 'none' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <FormControlLabel
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      control={<Checkbox checked={allSelected} indeterminate={someSelected} onChange={() => handleToggleGroup(group)} size="small" />}
                      label={<Typography sx={{ fontWeight: 600 }}>{group} ({perms.length})</Typography>}
                    />
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    <Grid container spacing={1}>
                      {perms.map(p => (
                        <Grid item xs={6} key={p.key}>
                          <FormControlLabel
                            control={<Checkbox checked={form.permissions.includes(p.key)} onChange={() => handleTogglePermission(p.key)} size="small" />}
                            label={<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{p.description || p.key}</Typography>}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.key} sx={{ bgcolor: '#1976d2' }}>Save Role</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Confirm Delete"
        message={`Are you sure you want to delete role ${deleteConfirm.item?.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, item: null })}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
