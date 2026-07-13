import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Typography, Chip, Skeleton, useTheme, Alert, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { PlayArrow, Stop, CloudUpload, Refresh, LocationOn, Flag } from '@mui/icons-material';
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

  return (
    <Box sx={{ p: 3, minHeight: '80vh' }}>
      <PageHeader
        title="My Trips"
        subtitle="View and manage your assigned trips, start/stop trips, and upload Proof of Delivery (POD)."
        actions={
          <Button startIcon={<Refresh />} variant="outlined" onClick={fetchTrips} size="small">
            Refresh
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ bgcolor: isDark ? '#1E1E1E' : '#FFF', borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Trip Ref</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Planned Departure</TableCell>
                <TableCell>Planned Arrival</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {Array.from({ length: 7 }).map((_, cIdx) => (
                      <TableCell key={cIdx}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography sx={{ py: 4, color: 'text.secondary' }}>No trips assigned to you.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => (
                  <TableRow key={trip.id || trip._id}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {trip.tripNumber || trip.id || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOn fontSize="small" color="primary" />
                        <Typography variant="body2">{trip.origin || trip.startLocation || '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">{"→"}</Typography>
                        <Flag fontSize="small" color="secondary" />
                        <Typography variant="body2">{trip.destination || trip.endLocation || '—'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={trip.tripType || 'TRANSFER'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={trip.status} />
                    </TableCell>
                    <TableCell>{fmt(trip.plannedStartAt)}</TableCell>
                    <TableCell>{fmt(trip.plannedEndAt)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {(trip.status === 'SCHEDULED' || trip.status === 'DRAFT') && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrow />}
                            onClick={() => handleOpenAction('start', trip.id || trip._id)}
                          >
                            Start
                          </Button>
                        )}
                        {trip.status === 'STARTED' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={<Stop />}
                              onClick={() => handleOpenAction('end', trip.id || trip._id)}
                            >
                              End
                            </Button>
                          </>
                        )}
                        {trip.status === 'COMPLETED' && (
                          <Button
                            component="label"
                            size="small"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                          >
                            Upload POD
                            <input
                              type="file"
                              hidden
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleUploadPod(trip.id || trip._id, e.target.files[0]);
                                }
                              }}
                            />
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
