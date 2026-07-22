import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, Tooltip, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Grid, Divider, InputAdornment, TablePagination, TableContainer
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArchiveIcon from '@mui/icons-material/Archive';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import api, { documentService } from '../../services/api';
import { ConfirmDialog, PageHeader } from '../components/Common';
import { useNotification } from '../../contexts/NotificationContext';

const DOC_CATEGORIES = [
  "VEHICLE", "DRIVER", "TRIP", "COMPLIANCE", "FINANCE", "MAINTENANCE",
  "REPAIR", "VENDOR", "CUSTOMER", "GENERAL"
];

const TABS = [
  { label: 'All', id: 'all' },
  { label: 'Vehicles', id: 'VEHICLE' },
  { label: 'Drivers', id: 'DRIVER' },
  { label: 'Trips', id: 'TRIP' },
  { label: 'Compliance', id: 'COMPLIANCE' },
  { label: 'Finance', id: 'FINANCE' },
  { label: 'Fuel Bills', id: 'FUEL_BILLS' },
  { label: 'Expiring Soon', id: 'EXPIRING_SOON' },
  { label: 'Archived', id: 'ARCHIVED' }
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifyFilter, setVerifyFilter] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState({ open: false, doc: null, fileUrl: null, contentType: null, isLoading: false });
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: '', category: 'GENERAL', documentType: '', notes: '', issueDate: '', expiryDate: '', tags: '',
    vehicleId: '', driverId: '', tripId: '', customerId: '', vendorId: '', fuelEntryId: '', linkedEntityType: '', linkedEntityId: ''
  });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, doc: null });
  const { addNotification } = useNotification();

  // Mock global stats
  const [stats, setStats] = useState({ total: 0, pending: 0, expiring: 0, archived: 0 });

  const fetchGlobalStats = async () => {
    try {
      // Fetch a large limit to calculate global stats since there's no stats endpoint
      const res = await documentService.getAll({ page: 1, limit: 1000 });
      const allItems = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      if (allItems.length > 0) {
        setStats({
          total: res.data?.data?.total || allItems.length,
          pending: allItems.filter(d => d.verificationStatus === 'PENDING').length,
          expiring: allItems.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
          archived: allItems.filter(d => d.status === 'ARCHIVED').length
        });
      }
    } catch (err) {
      console.error('Failed to fetch global stats:', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let finalCategory = categoryFilter;
      let finalStatus = statusFilter;
      let finalType = typeFilter;

      if (activeTab === 'VEHICLE' || activeTab === 'DRIVER' || activeTab === 'TRIP' || activeTab === 'COMPLIANCE' || activeTab === 'FINANCE') {
        finalCategory = activeTab;
      } else if (activeTab === 'FUEL_BILLS') {
        finalCategory = 'FINANCE';
        finalType = 'Fuel Bill'; // assuming this string match
      } else if (activeTab === 'ARCHIVED') {
        finalStatus = 'ARCHIVED';
      }

      const params = {
        page: page + 1,
        limit,
        search: search || undefined,
        documentCategory: finalCategory || undefined,
        status: finalStatus || undefined,
        verificationStatus: verifyFilter || undefined
      };

      const res = await documentService.getAll(params);
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setDocuments(items || []);
      setTotalCount(res.data?.data?.total || items.length);
    } catch (err) {
      console.error(err);
      setDocuments([]);
    }
    finally { setLoading(false); }
  }, [page, limit, search, categoryFilter, statusFilter, verifyFilter, activeTab, typeFilter]);

  useEffect(() => { fetchData(); fetchGlobalStats(); }, [fetchData]);

  // Derived unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(documents.map(d => d.documentType).filter(Boolean));
    return [...types];
  }, [documents]);

  const handleUpload = async () => {
    if (!file) { toast('Please select a file to upload', 'warning'); return; }
    if (!form.title || !form.category || !form.documentType) {
      toast('Title, Category, and Document Type are required', 'warning'); return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.title);
      formData.append('documentCategory', form.category);
      formData.append('documentType', form.documentType);
      if (form.notes) formData.append('description', form.notes);
      if (form.issueDate) formData.append('issueDate', new Date(form.issueDate).toISOString());
      if (form.expiryDate) formData.append('expiryDate', new Date(form.expiryDate).toISOString());
      if (form.tags) formData.append('tags', form.tags);
      if (form.vehicleId) formData.append('vehicleId', form.vehicleId);
      if (form.driverId) formData.append('driverId', form.driverId);
      if (form.tripId) formData.append('tripId', form.tripId);
      if (form.customerId) formData.append('customerId', form.customerId);
      if (form.vendorId) formData.append('vendorId', form.vendorId);
      if (form.fuelEntryId) formData.append('fuelEntryId', form.fuelEntryId);
      if (form.linkedEntityType) formData.append('linkedEntityType', form.linkedEntityType);
      if (form.linkedEntityId) formData.append('linkedEntityId', form.linkedEntityId);

      await documentService.upload(formData);
      fetchData();
      toast('Document uploaded successfully');
      addNotification('Document Uploaded', `Successfully uploaded ${form.title || file.name}`, 'success');
      setOpenDialog(false); setFile(null);
      setForm({ title: '', category: 'GENERAL', documentType: '', notes: '', issueDate: '', expiryDate: '', tags: '', vehicleId: '', driverId: '', tripId: '', customerId: '', vendorId: '', fuelEntryId: '', linkedEntityType: '', linkedEntityId: '' });
    } catch (err) {
      console.error(err);
      toast('Failed to upload document', 'error');
    }
  };

  const confirmDelete = async () => {
    const doc = deleteDialog.doc;
    if (!doc) return;
    try {
      await documentService.delete(doc.id || doc._id);
      fetchData();
      toast('Document deleted successfully');
      addNotification('Document Deleted', `Deleted document ${doc.title || doc.name}`, 'warning');
    } catch (err) {
      console.error(err);
      toast('Failed to delete document', 'error');
    }
    setDeleteDialog({ open: false, doc: null });
  };

  const handleVerify = async (id, status) => {
    try {
      await documentService.verify(id, { verificationStatus: status });
      toast(`Document ${status} successfully`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast(`Failed to ${status.toLowerCase()} document`, 'error');
    }
  };

  const handleArchive = async (id) => {
    try {
      await documentService.archive(id);
      toast('Document archived successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast('Failed to archive document', 'error');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const id = doc.id || doc._id;
      const res = await documentService.getDownloadUrl(id);
      const url = res.data?.data?.url || res.data?.url;
      if (!url) throw new Error("No download URL returned");

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('target', '_blank');
      link.setAttribute('download', doc.originalFileName || doc.title || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { console.error(err); toast('Download failed', 'error'); }
  };

  const openView = async (doc) => {
    setViewDialog({ open: true, doc, fileUrl: null, contentType: null, isLoading: true });
    try {
      const id = doc.id || doc._id;
      const res = await documentService.getViewUrl(id);
      const url = res.data?.data?.url || res.data?.url;
      if (!url) throw new Error("No view URL returned");

      const filename = doc.originalFileName || doc.filename || doc.title || '';
      let contentType = doc.mimeType || 'application/pdf';

      if (filename.match(/\.(jpg|jpeg)$/i)) contentType = 'image/jpeg';
      else if (filename.match(/\.png$/i)) contentType = 'image/png';
      else if (filename.match(/\.pdf$/i)) contentType = 'application/pdf';

      setViewDialog(prev => ({ ...prev, fileUrl: url, contentType, isLoading: false }));
    } catch (err) {
      console.error(err);
      setViewDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const statusColor = (s) => {
    if (!s) return 'default';
    const up = s.toUpperCase();
    if (up === 'VERIFIED' || up === 'ACTIVE') return 'success';
    if (up === 'PENDING' || up === 'PENDING_VERIFICATION') return 'warning';
    if (up === 'REJECTED' || up === 'ARCHIVED' || up === 'EXPIRED') return 'error';
    return 'default';
  };

  const formatLinkedTo = (doc) => {
    if (doc.vehicleId) return doc.vehicleId;
    if (doc.driverId) return doc.driverId;
    if (doc.tripId) return doc.tripId;
    if (doc.customerId) return doc.customerId;
    if (doc.vendorId) return doc.vendorId;
    return '--';
  };

  const formatExpiry = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(d - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    let daysLeft = '';

    if (d > now && diffDays <= 30) {
      daysLeft = `${diffDays}d left`;
    }

    return { label, daysLeft };
  };



  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader />

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card sx={{ p: 2, bgcolor: '#f8fafc', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>Total Documents</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>{stats.total}</Typography>
        </Card>
        <Card sx={{ p: 2, bgcolor: '#fffbeb', boxShadow: 'none', border: '1px solid #fef3c7' }}>
          <Typography sx={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>Pending Verification</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706' }}>{stats.pending}</Typography>
        </Card>
        <Card sx={{ p: 2, bgcolor: '#fef2f2', boxShadow: 'none', border: '1px solid #fee2e2' }}>
          <Typography sx={{ color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>Expiring Soon</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>{stats.expiring}</Typography>
        </Card>
        <Card sx={{ p: 2, bgcolor: '#f8fafc', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>Archived</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>{stats.archived}</Typography>
        </Card>
      </Box>

      {/* Main Content Area */}
      <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>

        {/* Quick Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, overflowX: 'auto', display: 'flex', gap: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
          {TABS.map(tab => (
            <Box
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(0); }}
              sx={{
                py: 1.5,
                px: 1,
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'primary.main' : 'text.secondary',
                borderBottom: activeTab === tab.id ? '2px solid' : '2px solid transparent',
                borderColor: activeTab === tab.id ? 'primary.main' : 'transparent',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </Box>
          ))}
        </Box>

        {/* Filter Bar */}
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search documents..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 250, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: 1.5, '& fieldset': { borderColor: 'divider' } } }}
            size="small"
          />

          <TextField select size="small" label="All Categories" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: 1.5 } }}>
            <MenuItem value="">All Categories</MenuItem>
            {DOC_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>

          <TextField select size="small" label="All Types" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: 1.5 } }}>
            <MenuItem value="">All Types</MenuItem>
            {uniqueTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          <TextField select size="small" label="All Statuses" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: 1.5 } }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
            <MenuItem value="ARCHIVED">ARCHIVED</MenuItem>
          </TextField>

          <TextField select size="small" label="All Verification" value={verifyFilter} onChange={(e) => { setVerifyFilter(e.target.value); setPage(0); }} sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: 1.5 } }}>
            <MenuItem value="">All Verification</MenuItem>
            <MenuItem value="PENDING">PENDING</MenuItem>
            <MenuItem value="VERIFIED">VERIFIED</MenuItem>
            <MenuItem value="REJECTED">REJECTED</MenuItem>
          </TextField>

          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              borderRadius: 1.5,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: 'rgba(10, 114, 179, 0.87)',
              '&:hover': { bgcolor: '#188be9ff' }
            }}
          >
            Upload
          </Button>
        </Box>

        {/* Table */}
        <TableContainer sx={{ width: '100%', overflowX: 'auto', minHeight: 300, maxHeight: 300, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
          <Table size="medium" stickyHeader sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>S.No</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Linked To</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Verification</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Expiry</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Uploaded</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress size={32} thickness={4} sx={{ color: 'text.secondary' }} /></TableCell></TableRow>
              ) : documents.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>No documents found matching the filters.</TableCell></TableRow>
              ) : (
                documents.map((row, index) => {
                  const expiryData = formatExpiry(row.expiryDate);
                  return (
                    <TableRow key={row.id || row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{page * limit + index + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{row.title || row.name || 'Untitled Document'}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>DOC-{String(row.id || row._id).substring(0, 8).toUpperCase()}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: 'text.primary' }}>{row.documentType || 'General'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: 'text.primary' }}>{row.documentCategory || row.category || 'N/A'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{formatLinkedTo(row)}</Typography></TableCell>
                      <TableCell>
                        {row.verificationStatus === 'VERIFIED' ? (
                          <Typography variant="body2" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                            <VerifiedUserIcon sx={{ fontSize: 16 }} /> Verified
                          </Typography>
                        ) : row.verificationStatus === 'PENDING' ? (
                          <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 500 }}>Pending</Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500 }}>{row.verificationStatus || '--'}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{expiryData.label}</Typography>
                        {expiryData.daysLeft && <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>{expiryData.daysLeft}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View"><IconButton size="small" onClick={() => openView(row)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}><VisibilityIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                          <Tooltip title="Download"><IconButton size="small" onClick={() => handleDownload(row)} sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', '&:hover': { bgcolor: '#8b5cf630' } }}><DownloadIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                          {(row.verificationStatus !== 'VERIFIED') && (
                            <Tooltip title="Verify"><IconButton size="small" onClick={() => handleVerify(row.id || row._id, 'VERIFIED')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}><VerifiedUserIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                          )}
                          {(row.verificationStatus !== 'REJECTED') && (
                            <Tooltip title="Reject"><IconButton size="small" onClick={() => handleVerify(row.id || row._id, 'REJECTED')} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><ThumbDownIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                          )}

                          <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, doc: row })} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><DeleteIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={totalCount} rowsPerPage={limit} page={page} onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
        />
      </Card>

      {/* Upload Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Upload Document</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, p: 4, textAlign: 'center', bgcolor: '#f8fafc', transition: 'all 0.2s', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' } }}>
              <Button variant="outlined" component="label" startIcon={<AddIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#0f172a', borderColor: '#cbd5e1' }}>
                Choose File <input type="file" hidden onChange={e => setFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.webp" />
              </Button>
              <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
                {file ? file.name : "PDF, JPEG, PNG up to 10MB"}
              </Typography>
            </Box>

            <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} fullWidth size="medium" required />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth size="medium" required>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={e => setForm({ ...form, category: e.target.value })}>
                  {DOC_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Document Type" placeholder="e.g. License, Insurance" value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })} fullWidth size="medium" required />
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a', mt: 1 }}>Linkages (Optional)</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Vehicle ID" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} size="small" />
              <TextField label="Driver ID" value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })} size="small" />
              <TextField label="Trip ID" value={form.tripId} onChange={e => setForm({ ...form, tripId: e.target.value })} size="small" />
              <TextField label="Fuel Entry ID" value={form.fuelEntryId} onChange={e => setForm({ ...form, fuelEntryId: e.target.value })} size="small" />
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a', mt: 1 }}>Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Issue Date" type="date" InputLabelProps={{ shrink: true }} value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} size="small" />
              <TextField label="Expiry Date" type="date" InputLabelProps={{ shrink: true }} value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} size="small" />
            </Box>
            <TextField label="Notes/Description" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} sx={{ bgcolor: '#0f172a', fontWeight: 600, textTransform: 'none', px: 3, borderRadius: 1.5, '&:hover': { bgcolor: '#1e293b' } }}>Upload Document</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDialog.doc?.title || deleteDialog.doc?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, doc: null })}
      />

      {/* View Details Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, doc: null })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Document Details</DialogTitle>
        <DialogContent dividers>
          {viewDialog.doc && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Title</Typography>
                <Typography variant="body1" fontWeight="bold" color="#0f172a">{viewDialog.doc.title || viewDialog.doc.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Document Type</Typography>
                <Typography variant="body1">{viewDialog.doc.documentType || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Category</Typography>
                <Typography variant="body1">{viewDialog.doc.documentCategory || viewDialog.doc.category || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Status</Typography>
                <Typography variant="body1">
                  <Chip label={viewDialog.doc.verificationStatus || viewDialog.doc.documentStatus || viewDialog.doc.status || 'UPLOADED'} size="small" />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Uploaded</Typography>
                <Typography variant="body1">{viewDialog.doc.createdAt ? new Date(viewDialog.doc.createdAt).toLocaleString() : 'N/A'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Issue Date</Typography>
                <Typography variant="body1">{viewDialog.doc.issueDate ? new Date(viewDialog.doc.issueDate).toLocaleDateString() : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Expiry Date</Typography>
                <Typography variant="body1">{viewDialog.doc.expiryDate ? new Date(viewDialog.doc.expiryDate).toLocaleDateString() : 'N/A'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Description</Typography>
                <Typography variant="body2" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, mt: 0.5, border: '1px solid', borderColor: '#e2e8f0', color: '#334155' }}>
                  {viewDialog.doc.description || viewDialog.doc.notes || 'No notes provided.'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Document Preview</Typography>
                <Box sx={{ width: '100%', height: '400px', bgcolor: '#f8fafc', border: '1px solid', borderColor: '#e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {viewDialog.isLoading ? (
                    <CircularProgress size={32} thickness={4} sx={{ color: '#94a3b8' }} />
                  ) : viewDialog.fileUrl ? (
                    viewDialog.contentType?.startsWith('image/') ? (
                      <img src={viewDialog.fileUrl} alt="Document Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <iframe src={viewDialog.fileUrl} width="100%" height="100%" style={{ border: 'none' }} title="Document Preview" />
                    )
                  ) : (
                    <Typography color="text.secondary">Preview not available</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setViewDialog({ open: false, doc: null, fileUrl: null, contentType: null, isLoading: false })} sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none' }}>Close</Button>
          <Button variant="contained" onClick={() => { handleDownload(viewDialog.doc); setViewDialog({ open: false, doc: null, fileUrl: null, contentType: null, isLoading: false }); }} sx={{ bgcolor: '#0f172a', fontWeight: 600, textTransform: 'none', px: 3, borderRadius: 1.5, '&:hover': { bgcolor: '#1e293b' } }}>Download</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
