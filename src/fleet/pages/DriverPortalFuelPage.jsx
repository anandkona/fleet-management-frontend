import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box,
  TableContainer, Chip, useTheme, Card, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, MenuItem, Typography, IconButton
} from '@mui/material';
import { LocalGasStation, Add, Visibility } from '@mui/icons-material';
import { PageHeader } from '../components/Common';
import api, { driverPortalService } from '../../services/api';

export default function DriverPortalFuelPage() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', amount: '', station: '', notes: '' });
  const [vehicles, setVehicles] = useState([]);
  const theme = useTheme();

  const fetchFuel = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/me/driver-fuel', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setFuelLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching driver fuel logs', err);
      setFuelLogs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFuel();
    driverPortalService.getVehicles()
      .then(res => {
        const vData = res.data?.data?.vehicles || res.data?.data?.items || res.data?.data || [];
        setVehicles(Array.isArray(vData) ? vData : []);
      })
      .catch(err => console.error('Failed to fetch vehicles', err));
  }, [fetchFuel]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'SUBMITTED': return 'info';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  const handleRequestSubmit = async () => {
    try {
      await api.post('/me/driver-fuel', {
        vehicleId: form.vehicleId,
        totalAmount: Number(form.amount),
        stationName: form.station,
        notes: form.notes
      });
      setRequestDialog(false);
      setForm({ vehicleId: '', amount: '', station: '', notes: '' });
      fetchFuel();
    } catch (err) {
      console.error(err);
      alert('Failed to submit fuel log');
    }
  };

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<LocalGasStation color="primary" sx={{ fontSize: 40 }}/>}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setRequestDialog(true)} sx={{ borderRadius: 2, px: 3, py: 1 }}>
            Submit Fuel Log
          </Button>
        }
      />

      <Card sx={{ mt: 3, borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Date', 'Vehicle', 'Station', 'Amount', 'Fuel Type', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {fuelLogs.map((log, i) => (
                <TableRow key={log.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>
                    {log.fuelDate ? new Date(log.fuelDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {log.vehicle?.vehicleNumber || log.vehicleId || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {log.stationName || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600, color: 'primary.main' }}>
                    ₹{log.totalAmount ? Number(log.totalAmount).toLocaleString() : '0'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {log.fuelType || '-'}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={log.status || 'DRAFT'} size="small" color={getStatusColor(log.status)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <IconButton size="small"  onClick={() => { setSelectedLog(log); setViewDialog(true);}} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }} >
<Visibility sx={{ fontSize: 17 }}    />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {fuelLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No fuel logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={requestDialog} onClose={() => setRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Fuel Log</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Vehicle *" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
                {vehicles.map((v) => <MenuItem key={v.id || v._id} value={v.id || v._id}>{v.registrationNumber || v.vehicleNumber || v.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Total Amount (₹)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Station Name" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} placeholder="e.g., HP Petrol Bunk" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRequestSubmit} disabled={!form.vehicleId || !form.amount || !form.station}>
            Submit Fuel Log
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Fuel Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedLog.fuelDate || selectedLog.createdAt ? new Date(selectedLog.fuelDate || selectedLog.createdAt).toLocaleDateString() : '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight={500} color="primary.main">₹{selectedLog.totalAmount ? Number(selectedLog.totalAmount).toLocaleString() : '0'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedLog.vehicle?.vehicleNumber || selectedLog.vehicleId || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Fuel Type</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedLog.fuelType || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Quantity (Liters)</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedLog.quantityLiters || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Station Name</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedLog.stationName || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Odometer Reading</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedLog.odometerReading || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box mt={0.5}><Chip label={selectedLog.status || 'DRAFT'} size="small" color={getStatusColor(selectedLog.status)} sx={{ fontWeight: 'bold' }} /></Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Notes / Description</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedLog.notes || '-'}</Typography>
              </Grid>
              {(selectedLog.receiptUrl || selectedLog.receipt) && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Receipt Document</Typography>
                  <Box mt={1}>
                    <Button 
                      variant="outlined" 
                      onClick={() => window.open(selectedLog.receiptUrl || selectedLog.receipt, '_blank')}
                    >
                      View Uploaded Receipt
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}