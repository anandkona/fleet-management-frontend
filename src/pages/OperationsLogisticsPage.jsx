import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Typography, Grid, Chip, Tooltip,
} from '@mui/material';
import { Add, Edit, LocalShipping, Person, Inventory } from '@mui/icons-material';
import { assetService, assetCategoryService } from '../services/api';
import { StatusChip, PageHeader, EmptyState, StatCard } from '../components/Common';
import { PALETTE } from '../theme';

const statuses = ['AVAILABLE', 'ASSIGNED', 'DAMAGED', 'LOST', 'UNDER_REPAIR', 'RETIRED'];
const emptyAssetForm = { assetCode: '', name: '', assetCategoryId: '', serialNumber: '', purchaseDate: '', purchaseAmount: '', currentStatus: 'AVAILABLE', notes: '' };

export default function OperationsLogisticsPage() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyAssetForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [assignments, setAssignments] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (catFilter) params.categoryId = catFilter;
      const [aRes, cRes] = await Promise.allSettled([
        assetService.getAll(params),
        assetCategoryService.getAll(),
      ]);
      const aData = aRes.status === 'fulfilled' ? aRes.value.data?.data ?? aRes.value.data : null;
      const assetItems = aData?.items ?? (Array.isArray(aData) ? aData : []);
      setAssets(assetItems);
      const cData = cRes.status === 'fulfilled' ? cRes.value.data?.data ?? cRes.value.data : null;
      setCategories(Array.isArray(cData) ? cData : cData?.items ?? []);

      const assignedAssets = assetItems.filter((a) => a.currentStatus === 'ASSIGNED');
      if (assignedAssets.length > 0) {
        const assignResults = await Promise.allSettled(
          assignedAssets.map((a) => assetService.getById(a.id))
        );
        const assignMap = {};
        assignResults.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            const detail = res.value.data?.data ?? res.value.data;
            const assignList = detail?.assignments;
            if (assignList?.length > 0) {
              const active = assignList.find((as) => as.status === 'ACTIVE') || assignList[0];
              assignMap[assignedAssets[i].id] = active;
            }
          }
        });
        setAssignments(assignMap);
      }
    } catch {}
    setLoading(false);
  }, [search, statusFilter, catFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setSelected(null); setForm(emptyAssetForm); setError(''); setDialogOpen(true); };
  const openEdit = (a) => {
    setSelected(a);
    setForm({
      assetCode: a.assetCode || '', name: a.name || '', assetCategoryId: a.assetCategoryId || '',
      serialNumber: a.serialNumber || '', purchaseDate: a.purchaseDate ? a.purchaseDate.split('T')[0] : '',
      purchaseAmount: a.purchaseAmount ?? '', currentStatus: a.currentStatus || 'AVAILABLE', notes: a.notes || '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.assetCode || !form.name || !form.assetCategoryId) { setError('Asset Code, Name, and Category are required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, purchaseAmount: form.purchaseAmount !== '' ? Number(form.purchaseAmount) : undefined, purchaseDate: form.purchaseDate || undefined, serialNumber: form.serialNumber || undefined, notes: form.notes || undefined };
      if (selected) { await assetService.update(selected.id, payload); } else { await assetService.create(payload); }
      setDialogOpen(false);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save asset'); }
    setSaving(false);
  };

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—';
  const assignedAssets = assets.filter((a) => a.currentStatus === 'ASSIGNED');

  const summary = {
    total: assets.length,
    available: assets.filter((a) => a.currentStatus === 'AVAILABLE').length,
    assigned: assignedAssets.length,
    damaged: assets.filter((a) => a.currentStatus === 'DAMAGED' || a.currentStatus === 'UNDER_REPAIR').length,
  };

  return (
    <Box>
      <PageHeader
        title="Operations & Logistics"
        subtitle="Track assets assigned to vehicles and drivers"
        action={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Asset</Button>}
      />

      <Grid container spacing={2} mb={3}>
        {[
          { icon: <Inventory />, label: 'Total Assets', value: summary.total, color: PALETTE.teal },
          { icon: <Inventory />, label: 'Available', value: summary.available, color: '#00C2A8' },
          { icon: <LocalShipping />, label: 'Assigned', value: summary.assigned, color: '#7C6FF7' },
          { icon: <Person />, label: 'Damaged / Repair', value: summary.damaged, color: PALETTE.coral },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <StatCard {...s} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
        <TextField placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ minWidth: 200 }} />
        <TextField value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} select size="small" sx={{ minWidth: 150 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField value={catFilter} onChange={(e) => setCatFilter(e.target.value)} select size="small" sx={{ minWidth: 180 }}>
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
      </Stack>

      {categories.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1} mb={2.5}>
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={`${c.name} (${c._count?.assets ?? 0})`}
              onClick={() => setCatFilter(catFilter === c.id ? '' : c.id)}
              variant={catFilter === c.id ? 'filled' : 'outlined'}
              color={catFilter === c.id ? 'primary' : 'default'}
              onDelete={catFilter === c.id ? () => setCatFilter('') : undefined}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {['Code', 'Name', 'Category', 'Assigned To', 'Serial', 'Amount', 'Status', ''].map((h) => <TableCell key={h}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>Loading...</TableCell></TableRow>
            ) : assignedAssets.length === 0 ? (
              <TableRow><TableCell colSpan={8}><EmptyState icon="📦" title="No assigned assets" description="No assets are currently assigned to vehicles or drivers" /></TableCell></TableRow>
            ) : assignedAssets.map((a) => {
              const assign = assignments[a.id];
              return (
                <TableRow key={a.id} hover>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{a.assetCode}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.name}</Typography>
                    {a.notes && <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 180 }}>{a.notes}</Typography>}
                  </TableCell>
                  <TableCell><Chip label={a.assetCategory?.name || getCategoryName(a.assetCategoryId)} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    {assign ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {assign.assignedToType === 'VEHICLE' ? <LocalShipping sx={{ fontSize: 16, color: PALETTE.teal }} /> : <Person sx={{ fontSize: 16, color: '#7C6FF7' }} />}
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>{assign.assignedToLabel}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{assign.assignedToType}</Typography>
                        </Box>
                      </Stack>
                    ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{a.serialNumber || '—'}</TableCell>
                  <TableCell>{a.purchaseAmount != null ? `$${Number(a.purchaseAmount).toLocaleString()}` : '—'}</TableCell>
                  <TableCell><StatusChip status={a.currentStatus} /></TableCell>
                  <TableCell><Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(a)}><Edit fontSize="small" /></IconButton></Tooltip></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Asset Code *" value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })} fullWidth required /></Grid>
              <Grid item xs={6}><TextField label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required /></Grid>
            </Grid>
            <TextField label="Category *" value={form.assetCategoryId} onChange={(e) => setForm({ ...form, assetCategoryId: e.target.value })} select fullWidth required>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} fullWidth />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Purchase Date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Purchase Amount" value={form.purchaseAmount} onChange={(e) => setForm({ ...form, purchaseAmount: e.target.value })} type="number" fullWidth /></Grid>
            </Grid>
            <TextField label="Status" value={form.currentStatus} onChange={(e) => setForm({ ...form, currentStatus: e.target.value })} select fullWidth>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />
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
