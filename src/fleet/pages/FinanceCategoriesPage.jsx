import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, CircularProgress,
  useTheme
} from '@mui/material';
import { Add, EditOutlined, DeleteOutline, Category } from '@mui/icons-material';
import api from '../../services/api';
import { PageHeader, ConfirmDialog } from '../components/Common';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_CATEGORY = { name: '', type: 'EXPENSE', module: 'GENERAL' };

export default function FinanceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();
  const { hasPermission } = useAuth();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/categories', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching categories', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;
    try {
      if (categoryForm.id) {
        await api.put(`/finance/categories/${categoryForm.id}`, categoryForm);
      } else {
        await api.post('/finance/categories', categoryForm);
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category', err);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await api.delete(`/finance/categories/${deleteConfirm.id}`);
      setDeleteConfirm({ open: false, id: null });
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category', err);
    }
  };

  const handleEdit = (r) => {
    setCategoryForm({ ...r });
    setDialogOpen(true);
  };

  if (loading && categories.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  );

  return (
    <Box sx={{ p: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0 }}>
        <PageHeader 
        subicon={<Category color="primary" sx={{ fontSize: 40 }}/>}
        action={
          hasPermission('finance_create') && (
              <Button variant="contained" startIcon={<Add />} onClick={() => { setCategoryForm(EMPTY_CATEGORY); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
                Add Category
              </Button>
            )
        }
      />
        
      </Box>

      <Card sx={{ mt: 1, mb: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['#', 'Category Name', 'Type', 'Module', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((r, i) => (
                <TableRow key={r.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{r.name || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{r.type || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{r.module || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handleEdit(r)}>
                        <EditOutlined fontSize="small" sx={{ color: '#3b82f6' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: r.id })}>
                        <DeleteOutline fontSize="small" sx={{ color: '#ef4444' }} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No categories found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{categoryForm.id ? 'Edit Category' : 'New Category'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Category Name" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} fullWidth size="small" required />
            <TextField select label="Type" value={categoryForm.type} onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value })} fullWidth size="small">
              <MenuItem value="INCOME">Income</MenuItem>
              <MenuItem value="EXPENSE">Expense</MenuItem>
            </TextField>
            <TextField select label="Module" value={categoryForm.module} onChange={e => setCategoryForm({ ...categoryForm, module: e.target.value })} fullWidth size="small">
              <MenuItem value="GENERAL">General</MenuItem>
              <MenuItem value="TRIP">Trip</MenuItem>
              <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
            {categoryForm.id ? 'Update Category' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Category"
        content="Are you sure you want to delete this category?"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



