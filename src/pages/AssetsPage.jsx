import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Typography, Grid, Chip, Tooltip,
  Tab, Tabs,
} from '@mui/material';
import { Add, Edit, Category, LocalShipping, Person, People, Inventory } from '@mui/icons-material';
import { assetService, assetCategoryService } from '../services/api';
import { StatusChip, PageHeader, EmptyState, StatCard } from '../components/Common';
import { PALETTE } from '../theme';
import { useAuth } from '../context/AuthContext';

const statuses = ['AVAILABLE', 'ASSIGNED', 'DAMAGED', 'LOST', 'UNDER_REPAIR', 'RETIRED'];
const emptyAssetForm = { assetCode: '', name: '', assetCategoryId: '', serialNumber: '', purchaseDate: '', purchaseAmount: '', currentStatus: 'AVAILABLE', notes: '' };
const emptyCategoryForm = { name: '', key: '', description: '', status: 'ACTIVE' };

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function AssetsPage() {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => {
    const t = searchParams.get('tab');
    return t !== null ? Number(t) : 0;
  });
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [catForm, setCatForm] = useState(emptyCategoryForm);
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
            const assignments = detail?.assignments;
            if (assignments?.length > 0) {
              const active = assignments.find((as) => as.status === 'ACTIVE') || assignments[0];
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

  const openCreateAsset = () => { setSelectedAsset(null); setAssetForm(emptyAssetForm); setError(''); setAssetDialogOpen(true); };
  const openEditAsset = (a) => {
    setSelectedAsset(a);
    setAssetForm({
      assetCode: a.assetCode || '',
      name: a.name || '',
      assetCategoryId: a.assetCategoryId || '',
      serialNumber: a.serialNumber || '',
      purchaseDate: a.purchaseDate ? a.purchaseDate.split('T')[0] : '',
      purchaseAmount: a.purchaseAmount ?? '',
      currentStatus: a.currentStatus || 'AVAILABLE',
      notes: a.notes || '',
    });
    setError('');
    setAssetDialogOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!assetForm.assetCode || !assetForm.name || !assetForm.assetCategoryId) {
      setError('Asset Code, Name, and Category are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...assetForm,
        purchaseAmount: assetForm.purchaseAmount !== '' ? Number(assetForm.purchaseAmount) : undefined,
        purchaseDate: assetForm.purchaseDate || undefined,
        serialNumber: assetForm.serialNumber || undefined,
        notes: assetForm.notes || undefined,
      };
      if (selectedAsset) {
        await assetService.update(selectedAsset.id, payload);
      } else {
        await assetService.create(payload);
      }
      setAssetDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save asset');
    }
    setSaving(false);
  };

  const openCreateCat = () => { setSelectedCat(null); setCatForm(emptyCategoryForm); setError(''); setCatDialogOpen(true); };
  const openEditCat = (c) => { setSelectedCat(c); setCatForm({ name: c.name || '', key: c.key || '', description: c.description || '', status: c.status || 'ACTIVE' }); setError(''); setCatDialogOpen(true); };

  const handleSaveCat = async () => {
    if (!catForm.name || !catForm.key) {
      setError('Name and Key are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (selectedCat) {
        await assetCategoryService.update(selectedCat.id, catForm);
      } else {
        await assetCategoryService.create(catForm);
      }
      setCatDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
    setSaving(false);
  };

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—';

  const assetSummary = {
    total: assets.length,
    available: assets.filter((a) => a.currentStatus === 'AVAILABLE').length,
    assigned: assets.filter((a) => a.currentStatus === 'ASSIGNED').length,
    damaged: assets.filter((a) => a.currentStatus === 'DAMAGED' || a.currentStatus === 'UNDER_REPAIR').length,
  };

  return (
    <Box>
      <PageHeader
        title="Assets"
        subtitle="Manage fleet assets, equipment & categories"
        icon={Inventory}
        action={
          tab === 0 ? (
            hasPermission('asset_create') ? (
              <Button variant="contained" startIcon={<Add />} onClick={openCreateAsset}>Add Asset</Button>
            ) : null
          ) : (
            hasPermission('asset_create') ? (
              <Button variant="contained" startIcon={<Add />} onClick={openCreateCat}>Add Category</Button>
            ) : null
          )
        }
      />

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setSearchParams({ tab: v }); }}
        sx={{
          borderBottom: '1px solid', borderColor: 'divider',
          mb: 0,
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minHeight: 48 },
        }}
      >
        <Tab icon={<Inventory />} iconPosition="start" label="Operations & Logistics" />
        <Tab icon={<Category />} iconPosition="start" label="Categories" />
      </Tabs>

      {/* Tab 0: Operations & Logistics (Assigned Assets) */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={2} mb={3} mt={0.5}>
          {[
            { icon: <Inventory />, label: 'Total Assets', value: assetSummary.total, color: PALETTE.teal },
            { icon: <Inventory />, label: 'Available', value: assetSummary.available, color: '#00C2A8' },
            { icon: <LocalShipping />, label: 'Assigned', value: assetSummary.assigned, color: '#7C6FF7' },
            { icon: <People />, label: 'Damaged / Repair', value: assetSummary.damaged, color: PALETTE.coral },
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
              ) : (() => {
                const assignedAssets = assets.filter((a) => a.currentStatus === 'ASSIGNED');
                if (assignedAssets.length === 0) {
                  return <TableRow><TableCell colSpan={8}><EmptyState icon="📦" title="No assigned assets" description="No assets are currently assigned to vehicles or drivers" /></TableCell></TableRow>;
                }
                return assignedAssets.map((a) => {
                  const assign = assignments[a.id];
                  return (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{a.assetCode}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.name}</Typography>
                        {a.notes && <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 180 }}>{a.notes}</Typography>}
                      </TableCell>
                      <TableCell><Chip label={a.assetCategory?.name || getCategoryName(a.assetCategoryId)} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        {assign ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {assign.assignedToType === 'VEHICLE' ? (
                              <LocalShipping sx={{ fontSize: 16, color: PALETTE.teal }} />
                            ) : (
                              <Person sx={{ fontSize: 16, color: '#7C6FF7' }} />
                            )}
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>{assign.assignedToLabel}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{assign.assignedToType}</Typography>
                            </Box>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{a.serialNumber || '—'}</TableCell>
                      <TableCell>{a.purchaseAmount != null ? `$${Number(a.purchaseAmount).toLocaleString()}` : '—'}</TableCell>
                      <TableCell><StatusChip status={a.currentStatus} /></TableCell>
                      <TableCell>
                        {hasPermission('asset_update') && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditAsset(a)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab 1: Categories */}
      <TabPanel value={tab} index={1}>
        <TableContainer sx={{ mt: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                {['Name', 'Key', 'Description', 'Assets', 'Status', ''].map((h) => <TableCell key={h}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>Loading...</TableCell></TableRow>
              ) : categories.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState icon="📁" title="No categories" description="Create your first asset category" action={<Button variant="contained" startIcon={<Add />} onClick={openCreateCat}>Add Category</Button>} /></TableCell></TableRow>
              ) : categories.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{c.key}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>{c.description || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={c._count?.assets ?? 0} size="small" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell><StatusChip status={c.status} /></TableCell>
                  <TableCell>
                    {hasPermission('asset_update') && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditCat(c)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Asset Dialog */}
      <Dialog open={assetDialogOpen} onClose={() => setAssetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Asset Code *" value={assetForm.assetCode} onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })} fullWidth required />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Name *" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} fullWidth required />
              </Grid>
            </Grid>
            <TextField label="Category *" value={assetForm.assetCategoryId} onChange={(e) => setAssetForm({ ...assetForm, assetCategoryId: e.target.value })} select fullWidth required>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Serial Number" value={assetForm.serialNumber} onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })} fullWidth />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Purchase Date" value={assetForm.purchaseDate} onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Purchase Amount" value={assetForm.purchaseAmount} onChange={(e) => setAssetForm({ ...assetForm, purchaseAmount: e.target.value })} type="number" fullWidth />
              </Grid>
            </Grid>
            <TextField label="Status" value={assetForm.currentStatus} onChange={(e) => setAssetForm({ ...assetForm, currentStatus: e.target.value })} select fullWidth>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Notes" value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} fullWidth multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssetDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAsset} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onClose={() => setCatDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <TextField label="Category Name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} fullWidth required />
            <TextField label="Key" value={catForm.key} onChange={(e) => setCatForm({ ...catForm, key: e.target.value })} fullWidth required helperText="Lowercase letters, numbers, underscores only" />
            <TextField label="Description" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Status" value={catForm.status} onChange={(e) => setCatForm({ ...catForm, status: e.target.value })} select fullWidth>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCatDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCat} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
