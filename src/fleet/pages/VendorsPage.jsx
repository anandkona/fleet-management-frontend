import { Business } from '@mui/icons-material';
﻿import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, TableContainer, Typography, Chip, useTheme, Card, CircularProgress,
  Grid
} from '@mui/material';
import { Add, Edit, Delete as DeleteIcon, Storefront } from '@mui/icons-material';
import { financeService } from '../../services/api';
import { PageHeader, ConfirmDialog } from '../components/Common';

const vendorTypes = ['FUEL_STATION', 'WORKSHOP', 'INSURANCE', 'PERMIT_AGENT', 'RTO_AGENT', 'GPS_VENDOR', 'GENERAL'];

const emptyForm = {
  name: '',
  vendorType: 'GENERAL',
  phone: '',
  email: '',
  gstin: '',
  address: ''
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const theme = useTheme();

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.getVendors({ limit: 100 });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching vendors', err);
      setVendors([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editingId) {
        await financeService.updateVendor(editingId, form);
      } else {
        await financeService.createVendor(form);
      }
      setDialogOpen(false);
      fetchVendors();
    } catch (err) {
      console.error('Error saving vendor', err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await financeService.deleteVendor(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: null });
      fetchVendors();
    } catch (err) {
      console.error('Error deleting vendor', err);
    }
  };

  const handleEdit = (vendor) => {
    setForm({
      name: vendor.name || '',
      vendorType: vendor.vendorType || 'GENERAL',
      phone: vendor.phone || '',
      email: vendor.email || '',
      gstin: vendor.gstin || '',
      address: vendor.address || ''
    });
    setEditingId(vendor.id);
    setDialogOpen(true);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<Business color="primary" sx={{ fontSize: 40 }}/>}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); }} sx={{ borderRadius: 2 }}>
            Add Vendor
          </Button>
        }
      />
      

      <Card sx={{ mt: 3, mb: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.No', 'Name', 'Type', 'Contact', 'GSTIN', 'Address', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((v, i) => (
                <TableRow key={v.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{v.name}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={v.vendorType.replace('_', ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">{v.phone || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{v.email || '-'}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{v.gstin || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{v.address || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleEdit(v)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                        <Edit sx={{ fontSize: 17 }}   />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: v.id })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                        <DeleteIcon sx={{ fontSize: 17 }}   />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {vendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No vendors found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Vendor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Vendor Type" value={form.vendorType} onChange={(e) => setForm({ ...form, vendorType: e.target.value })}>
                {vendorTypes.map(t => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Vendor"
        content="Are you sure you want to delete this vendor? Associated transactions might lose vendor detail linkage."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
}



