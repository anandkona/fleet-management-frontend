import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Stack, IconButton, Button
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { PageHeader } from '../components/Common';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export default function MechanicVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewRecord, setViewRecord] = useState(null);
  const { addNotification } = useNotification();

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles', { params: { limit: 100 } });
      const items = res.data?.data?.items || res.data?.data || [];
      setVehicles(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      addNotification('Error', 'Failed to fetch vehicles', 'error');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'AVAILABLE') return 'success';
    if (s === 'ON_TRIP') return 'primary';
    if (s === 'IN_MAINTENANCE' || s === 'NEEDS_REPAIR') return 'warning';
    if (s === 'OUT_OF_SERVICE') return 'error';
    return 'default';
  };

  return (
    <Box>
      <PageHeader title="My Vehicles" subtitle="View details of assigned fleet vehicles" icon={<LocalShippingIcon />} />
      
      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: '70vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {['Vehicle No', 'Type', 'Brand / Model', 'Year', 'Odometer', 'Status'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : vehicles.map(v => (
                <TableRow 
                  key={v.id || v._id} 
                  hover 
                  onClick={() => setViewRecord(v)}
                  sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider' }}>{v.vehicleNumber}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>{v.vehicleType || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{v.brand || '-'} {v.model ? `/ ${v.model}` : ''}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>{v.year || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{v.currentOdometer ? `${v.currentOdometer} km` : '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={(v.status || 'UNKNOWN').toUpperCase()} size="small" color={getStatusColor(v.status)} sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                  </TableCell>
                </TableRow>
              ))}
              {!loading && vehicles.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No vehicles found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {viewRecord && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 700, height: { xs: '100%', sm: 'auto' }, maxHeight: { xs: '100%', sm: '90vh' }, overflow: 'auto', borderRadius: { xs: 0, sm: 2 }, bgcolor: 'background.paper', backgroundImage: 'none', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DirectionsCarIcon sx={{ color: '#1976d2', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>Vehicle Details</Typography>
              </Stack>
              <IconButton size="small" onClick={() => setViewRecord(null)} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><CloseIcon sx={{ fontSize: 17 }}   /></IconButton>
            </Stack>
            <Box sx={{ pt: 1, px: 3, pb: 3 }}>
              <Grid container spacing={2.5}>
                {[
                  ['Vehicle Number', viewRecord.vehicleNumber || viewRecord.licensePlate],
                  ['Type', viewRecord.vehicleType],
                  ['Brand', viewRecord.brand],
                  ['Model', viewRecord.model],
                  ['Year', viewRecord.year],
                  ['Fuel Type', viewRecord.fuelType],
                  ['Odometer', viewRecord.currentOdometer ? `${Number(viewRecord.currentOdometer).toLocaleString()} km` : '-'],
                  ['Chassis Number', viewRecord.chassisNumber],
                  ['Engine Number', viewRecord.engineNumber],
                  ['RC Number', viewRecord.rcNumber],
                  ['Current Driver', viewRecord.currentDriver?.name || viewRecord.driver || 'Unassigned'],
                  ['Insurance Expiry', viewRecord.insuranceExpiry ? new Date(viewRecord.insuranceExpiry).toLocaleDateString() : '-'],
                  ['Fitness Expiry', viewRecord.fitnessExpiry ? new Date(viewRecord.fitnessExpiry).toLocaleDateString() : '-'],
                  ['Pollution Expiry', viewRecord.pollutionExpiry ? new Date(viewRecord.pollutionExpiry).toLocaleDateString() : '-'],
                  ['Permit Expiry', viewRecord.permitExpiry ? new Date(viewRecord.permitExpiry).toLocaleDateString() : '-'],
                  ['Created', viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString() : '-'],
                  ['Last Updated', viewRecord.updatedAt ? new Date(viewRecord.updatedAt).toLocaleString() : '-'],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', color: 'text.primary' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25, color: 'text.primary' }}>{value || '-'}</Typography>
                  </Grid>
                ))}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', color: 'text.primary' }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={(viewRecord.status || 'UNKNOWN').toUpperCase()} size="small" color={getStatusColor(viewRecord.status)} sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <Button onClick={() => setViewRecord(null)} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: '#3a3a42' }}>Close</Button>
            </Stack>
          </Card>
        </Box>
      )}
    </Box>
  );
}
