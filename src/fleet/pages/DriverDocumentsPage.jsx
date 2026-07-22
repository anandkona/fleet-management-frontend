import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Typography, Chip, Skeleton, useTheme, Alert, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select, TablePagination, InputAdornment, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import { CloudUpload, Refresh, Description, CheckCircle, HourglassEmpty, ErrorOutline, Search, Delete, Download, Visibility } from '@mui/icons-material';
import api, { driverPortalService, documentService } from '../../services/api';
import { PageHeader } from '../components/Common';

function fmt(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dt; }
}

const DOCUMENT_CATEGORIES = ['DRIVER', 'GENERAL', 'COMPLIANCE', 'TRIP'];
const DOCUMENT_TYPES = ['DRIVER_LICENSE', 'AADHAAR_CARD', 'PAN_CARD', 'FITNESS_CERTIFICATE', 'INSURANCE', 'POLUTION_UNDER_CONTROL', 'OTHER'];

export default function DriverDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [uploadDialog, setUploadDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [docCategory, setDocCategory] = useState('DRIVER');
  const [docType, setDocType] = useState('DRIVER_LICENSE');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewDialog, setViewDialog] = useState({ open: false, doc: null, fileUrl: null, contentType: null, isLoading: false });

  const openView = async (doc) => {
    setViewDialog({ open: true, doc, fileUrl: null, contentType: null, isLoading: true });
    try {
      const res = await documentService.view(doc.id || doc._id);
      let url = res.data?.data?.url || res.request?.responseURL || '';
      const cType = res.headers ? res.headers['content-type'] : null;
      setViewDialog({ open: true, doc, fileUrl: url, contentType: cType, isLoading: false });
    } catch (err) {
      console.error(err);
      setViewDialog({ open: true, doc, fileUrl: null, contentType: null, isLoading: false, error: 'Failed to load preview' });
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await documentService.download(doc.id || doc._id);
      let url = res.data?.data?.url || res.request?.responseURL;
      if (url) window.open(url, '_blank');
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await driverPortalService.getDocuments();
      const raw = res.data;
      const data = raw?.data ?? raw;
      setDocuments(data?.items ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      if (err.response?.status !== 403) {
        console.error(err);
      }
      setError('Failed to fetch documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete ${doc.title}?`)) return;
    try {
      await api.delete(`/documents/${doc.id || doc._id}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  const handleOpenUpload = () => {
    setUploadDialog(true);
    setTitle('');
    setDescription('');
    setDocCategory('DRIVER');
    setDocType('DRIVER_LICENSE');
    setSelectedFile(null);
  };

  const handleCloseUpload = () => {
    setUploadDialog(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('documentCategory', docCategory);
      formData.append('documentType', docType);

      await driverPortalService.uploadDocument(formData);
      fetchDocuments();
      handleCloseUpload();
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const getVerificationStatusChip = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <Chip icon={<CheckCircle sx={{ fontSize: '16px !important' }} />} label="Verified" color="success" size="small" variant="outlined" />;
      case 'REJECTED':
        return <Chip icon={<ErrorOutline sx={{ fontSize: '16px !important' }} />} label="Rejected" color="error" size="small" variant="outlined" />;
      default:
        return <Chip icon={<HourglassEmpty sx={{ fontSize: '16px !important' }} />} label="Pending" color="warning" size="small" variant="outlined" />;
    }
  };

  const filtered = documents.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || (d.title || d.name || '').toLowerCase().includes(q) || (d.documentType || '').toLowerCase().includes(q);
    const matchCat = !categoryFilter || d.documentCategory === categoryFilter || d.category === categoryFilter;
    return matchQ && matchCat;
  });
  const paged = filtered.slice(page * 10, (page + 1) * 10);
  const uniqueCategories = [...new Set(documents.map(d => d.documentCategory || d.category).filter(Boolean))];

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, minHeight: '80vh' }}>
      <PageHeader 
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh/>} variant="outlined" onClick={fetchDocuments} size="small">
              Refresh
            </Button>
            <Button startIcon={<CloudUpload />} variant="contained" onClick={handleOpenUpload} size="small">
              Upload Document
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ bgcolor: isDark ? '#1E1E1E' : '#FFF', borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Box sx={{ py: 2, pr: 2, pl: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-start', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField placeholder="Search documents…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.primary' }} /></InputAdornment> }}
            sx={{ width: { xs: '100%', sm: 1000 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }} size="small" />
          <TextField select size="small" label="Category" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }}>
            <MenuItem value="">All Categories</MenuItem>
            {uniqueCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Box>
        <TableContainer sx={{ maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Title', 'Description', 'Type', 'Category', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><Skeleton variant="text" /></TableCell>)}</TableRow>)
              ) : paged.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No documents uploaded yet</TableCell></TableRow>
              ) : paged.map((doc, i) => (
                <TableRow key={doc.id || doc._id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{page * 10 + i + 1}</TableCell>

                  <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{doc.title || doc.name || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{doc.description || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{doc.documentType?.replace(/_/g, ' ') || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{doc.documentCategory || doc.category || '—'}</TableCell>

                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(doc)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
                          <Visibility sx={{ fontSize: 17 }}  />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownload(doc)} sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', '&:hover': { bgcolor: '#8b5cf630' } }}>
                          <Download sx={{ fontSize: 17 }}  />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Upload/Update">
                        <IconButton size="small" onClick={handleOpenUpload} sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', '&:hover': { bgcolor: '#8b5cf630' } }}>
                          <CloudUpload sx={{ fontSize: 17 }}  />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(doc)} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
                          <Delete sx={{ fontSize: 17 }}  />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={10} onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[10]}
          sx={{ borderTop: '1px solid', borderColor: 'divider', color: 'text.primary' }} />
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={handleCloseUpload} fullWidth maxWidth="sm">
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              sx={{ py: 3, borderStyle: 'dashed' }}
            >
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose File (PDF, Images max 10MB)'}
              <input type="file" hidden onChange={handleFileChange} accept="application/pdf,image/*" />
            </Button>

            <TextField
              label="Document Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <TextField
              label="Description (Optional)"
              multiline
              rows={2}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={docCategory}
                  label="Category"
                  onChange={(e) => setDocCategory(e.target.value)}
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={docType}
                  label="Type"
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload} disabled={submitting}>Cancel</Button>
          <Button onClick={handleUploadSubmit} variant="contained" disabled={submitting || !selectedFile}>
            {submitting ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ ...viewDialog, open: false })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Document Preview
          {viewDialog.doc && <Chip label={viewDialog.doc.documentType?.replace(/_/g, ' ') || 'Document'} size="small" color="primary" variant="outlined" />}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 2, overflow: 'hidden' }}>
            {viewDialog.isLoading ? <CircularProgress /> : viewDialog.error ? <Alert severity="error">{viewDialog.error}</Alert> : viewDialog.fileUrl ? (
              viewDialog.contentType?.includes('image') || viewDialog.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img src={viewDialog.fileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : viewDialog.contentType === 'application/pdf' || viewDialog.fileUrl.match(/\.pdf$/i) ? (
                <iframe src={viewDialog.fileUrl} width="100%" height="100%" style={{ border: 'none' }} title="PDF Preview" />
              ) : (
                <Typography>File type cannot be previewed natively. Please download it.</Typography>
              )
            ) : <Typography>No file URL found.</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ ...viewDialog, open: false })}>Close</Button>
          <Button variant="contained" onClick={() => handleDownload(viewDialog.doc)} disabled={viewDialog.isLoading}>Download</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
