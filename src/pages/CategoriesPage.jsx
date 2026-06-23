import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Typography, Tooltip, Chip,
} from '@mui/material';
import { Add, Edit, Category } from '@mui/icons-material';
import { assetCategoryService } from '../services/api';
import { StatusChip, PageHeader, EmptyState } from '../components/Common';
import '@fontsource/nunito'

const emptyForm = { name: '', key: '', description: '', status: 'ACTIVE' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await assetCategoryService.getAll();
      const data = res.data?.data ?? res.data;
      setCategories(Array.isArray(data) ? data : data?.items ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setSelected(null); setForm(emptyForm); setError(''); setDialogOpen(true); };
  const openEdit = (c) => { setSelected(c); setForm({ name: c.name || '', key: c.key || '', description: c.description || '', status: c.status || 'ACTIVE' }); setError(''); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.key) { setError('Name and Key are required'); return; }
    setSaving(true);
    setError('');
    try {
      if (selected) { await assetCategoryService.update(selected.id, form); } else { await assetCategoryService.create(form); }
      setDialogOpen(false);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save category'); }
    setSaving(false);
  };

  return (
    <Box>
      <PageHeader
        title="Categories"
        subtitle="Manage asset categories and groupings"
        icon={Category}
        action={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Category</Button>}
      />

      <TableContainer>
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
              <TableRow><TableCell colSpan={6}><EmptyState icon="📁" title="No categories" description="Create your first asset category" action={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Category</Button>} /></TableCell></TableRow>
            ) : categories.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 500

              
                 }}>{c.name}</Typography></TableCell>
                <TableCell sx={{ fontFamily: 'nunito' }}>{c.key}</TableCell>
                <TableCell><Typography color="text.secondary" noWrap sx={{ maxWidth: 500 }}>{c.description || '—'}</Typography></TableCell>
                <TableCell><Chip label={c._count?.assets ?? 0} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                <TableCell><Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton></Tooltip></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <TextField label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} fullWidth required helperText="Lowercase letters, numbers, underscores only" />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} select fullWidth>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
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
