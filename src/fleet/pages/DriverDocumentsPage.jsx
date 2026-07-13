import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Typography, Chip, Skeleton, useTheme, Alert, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { CloudUpload, Refresh, Description, CheckCircle, HourglassEmpty, ErrorOutline } from '@mui/icons-material';
import { driverPortalService } from '../../services/api';
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

  const [uploadDialog, setUploadDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [docCategory, setDocCategory] = useState('DRIVER');
  const [docType, setDocType] = useState('DRIVER_LICENSE');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await driverPortalService.getDocuments();
      const raw = res.data;
      const data = raw?.data ?? raw;
      setDocuments(data?.items ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

  return (
    <Box sx={{ p: 3, minHeight: '80vh' }}>
      <PageHeader
        title="My Documents"
        subtitle="Manage and upload your critical driver documents (e.g. License, Identification card) for compliance verification."
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<Refresh />} variant="outlined" onClick={fetchDocuments} size="small">
              Refresh
            </Button>
            <Button startIcon={<CloudUpload />} variant="contained" onClick={handleOpenUpload} size="small">
              Upload Document
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ bgcolor: isDark ? '#1E1E1E' : '#FFF', borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uploaded On</TableCell>
                <TableCell align="right">File Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {Array.from({ length: 6 }).map((_, cIdx) => (
                      <TableCell key={cIdx}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography sx={{ py: 4, color: 'text.secondary' }}>No documents uploaded.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id || doc._id}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Description color="action" />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {doc.title}
                          </Typography>
                          {doc.description && (
                            <Typography variant="caption" color="text.secondary">
                              {doc.description}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={doc.documentCategory || 'DRIVER'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{doc.documentType?.replace(/_/g, ' ') || 'OTHER'}</Typography>
                    </TableCell>
                    <TableCell>
                      {getVerificationStatusChip(doc.verificationStatus)}
                    </TableCell>
                    <TableCell>{fmt(doc.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {doc.originalFileName || '—'}
                      </Typography>
                      {doc.fileSizeBytes && (
                        <Typography variant="caption" color="text.secondary">
                          {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
    </Box>
  );
}
