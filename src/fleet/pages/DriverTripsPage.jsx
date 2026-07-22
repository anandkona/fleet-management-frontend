import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Typography, Chip, Skeleton, useTheme, Alert, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, TablePagination, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import { PlayArrow, Stop, CloudUpload, Refresh, Search } from '@mui/icons-material';
import { driverPortalService } from '../../services/api';
import { StatusChip, PageHeader } from '../components/Common';

function fmt(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return dt; }
}

export default function DriverTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [actionDialog, setActionDialog] = useState({ open: false, type: '', tripId: '' });
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await driverPortalService.getTrips({ limit: 100 });
      const raw = res.data;
      const data = raw?.data ?? raw;
      setTrips(data?.items ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned trips. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleOpenAction = (type, tripId) => {
    setActionDialog({ open: true, type, tripId });
    setOdometer('');
    setNotes('');
  };

  const handleCloseAction = () => {
    setActionDialog({ open: false, type: '', tripId: '' });
  };

  const handleSubmitAction = async () => {
    setSubmitting(true);
    try {
      const payload = {
        odometer: odometer ? parseInt(odometer, 10) : undefined,
        notes
      };
      if (actionDialog.type === 'start') {
        await driverPortalService.startTrip(actionDialog.tripId, payload);
      } else {
        await driverPortalService.endTrip(actionDialog.tripId, payload);
      }
      fetchTrips();
      handleCloseAction();
    } catch (err) {
      console.error(err);
      alert('Action failed: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPod = async (tripId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await driverPortalService.uploadPod(tripId, formData);
      alert('POD uploaded successfully');
      fetchTrips();
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || (t.tripNumber || t.id || '').toLowerCase().includes(q) || (t.origin || '').toLowerCase().includes(q) || (t.destination || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchQ && matchStatus;
  });
  const paged = filtered.slice(page * 10, (page + 1) * 10);
  const uniqueStatuses = [...new Set(trips.map(t => t.status).filter(Boolean))];

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, minHeight: '80vh' }}>
      <PageHeader 
        actions={
          <Button startIcon={<Refresh/>} variant="outlined" onClick={fetchTrips} size="small">
            Refresh
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ mb: 2, bgcolor: isDark ? '#1E1E1E' : '#FFF', borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ py: 2, pr: 2, pl: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-start', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField placeholder="Search trips…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.primary' }} /></InputAdornment> }}
            sx={{ width: { xs: '100%', sm: 1000 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }} size="small" />
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }}>
            <MenuItem value="">All Statuses</MenuItem>
            {uniqueStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>
        <TableContainer sx={{ maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Trip Ref', 'Route', 'Type', 'Status', 'Planned Departure', 'Planned Arrival', 'Actions'].map((h, i) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {Array.from({ length: 8 }).map((_, cIdx) => (
                      <TableCell key={cIdx} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ py: 4, color: 'text.secondary' }}>No trips assigned to you.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((trip, i) => (
                  <TableRow key={trip.id || trip._id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{page * 10 + i + 1}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {trip.tripNumber || trip.id || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {trip.start || trip.origin || trip.startLocation || trip.pickupLocation || trip.startAddress || 'Start'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{"→"}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {trip.end || trip.destination || trip.endLocation || trip.dropLocation || trip.endAddress || 'Destination'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Chip label={trip.tripType || 'TRANSFER'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <StatusChip status={trip.status} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{fmt(trip.plannedStartAt)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{fmt(trip.plannedEndAt)}</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {(trip.status === 'SCHEDULED' || trip.status === 'DRAFT') && (
                          <Tooltip title="Start Trip">
                            <IconButton size="small" sx={{ color: '#10b981' }} onClick={() => handleOpenAction('start', trip.id || trip._id)}>
                              <PlayArrow fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {trip.status === 'STARTED' && (
                          <Tooltip title="End Trip">
                            <IconButton size="small" sx={{ color: '#f59e0b' }} onClick={() => handleOpenAction('end', trip.id || trip._id)}>
                              <Stop fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {trip.status === 'COMPLETED' && (
                          <Tooltip title="Upload POD">
                            <IconButton size="small" component="label" sx={{ color: '#3b82f6' }}>
                              <CloudUpload fontSize="small" />
                              <input
                                type="file"
                                hidden
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleUploadPod(trip.id || trip._id, e.target.files[0]);
                                  }
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={10} onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[10]}
          sx={{ borderTop: '1px solid', borderColor: 'divider', color: 'text.primary' }} />
      </Card>

      {/* Action Dialog (Start / End Trip) */}
      <Dialog open={actionDialog.open} onClose={handleCloseAction} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textTransform: 'capitalize' }}>
          {actionDialog.type} Trip
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Odometer Reading"
              type="number"
              fullWidth
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder="e.g. 150240"
            />
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any remarks..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAction} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmitAction} variant="contained" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
