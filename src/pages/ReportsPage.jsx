import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Assessment as ReportsIcon,
  DirectionsCar,
  Person,
  Inventory,
  Build,
} from '@mui/icons-material';
import { PageHeader } from '../components/Common';
import { ExpiryAlertCard } from '../components/DashboardCharts';
import { assetService, documentService, driverService, vehicleService } from '../services/api';
import { PALETTE } from '../theme';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [documents, setDocuments] = useState([]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [vehicleRes, driverRes, assetRes, documentRes] = await Promise.allSettled([
        vehicleService.getAll({ limit: 100 }),
        driverService.getAll({ limit: 100 }),
        assetService.getAll({ limit: 100 }),
        documentService.getAll({ limit: 100 }),
      ]);

      const extract = (result, label) => {
        if (result.status === 'rejected') {
          console.warn(`[Reports] ${label} failed`, result.reason?.message || result.reason);
          return [];
        }

        const raw = result.value?.data ?? result.value;
        return raw?.data?.items ?? (Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
      };

      setVehicles(extract(vehicleRes, 'Vehicles'));
      setDrivers(extract(driverRes, 'Drivers'));
      setAssets(extract(assetRes, 'Assets'));
      setDocuments(extract(documentRes, 'Documents'));

      const failed = [vehicleRes, driverRes, assetRes, documentRes]
        .filter((item) => item.status === 'rejected')
        .map((item) => item.reason?.message || 'Unknown error');

      if (failed.length) {
        setError(`Some report data could not be loaded: ${failed.join('; ')}`);
      }
    } catch (err) {
      console.error('[Reports] Unexpected error', err);
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const vehicleStats = useMemo(() => {
    const counts = {};
    vehicles.forEach((vehicle) => {
      counts[vehicle.status] = (counts[vehicle.status] || 0) + 1;
    });
    return counts;
  }, [vehicles]);

  const driverStats = useMemo(() => {
    const counts = {};
    drivers.forEach((driver) => {
      counts[driver.status] = (counts[driver.status] || 0) + 1;
    });
    return counts;
  }, [drivers]);

  const assetStats = useMemo(() => {
    const counts = {};
    assets.forEach((asset) => {
      counts[asset.currentStatus] = (counts[asset.currentStatus] || 0) + 1;
    });
    return counts;
  }, [assets]);


  const reportStats = [
    { label: 'Fleet Size', value: vehicles.length, tone: 'teal' },
    { label: 'Available Drivers', value: driverStats.AVAILABLE || 0, tone: 'violet' },
    { label: 'Assets Assigned', value: assetStats.ASSIGNED || 0, tone: 'amber' },
    { label: 'Documents Expiring', value: documents.filter((doc) => doc.expiryDate).length, tone: 'coral' },
  ];

  const vehicleWatchlist = vehicles.slice(0, 6);
  const driverWatchlist = drivers.slice(0, 6);
  const assetWatchlist = assets.slice(0, 6);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Fleet Reports"
        subtitle="Operational summaries pulled from the documented fleet management APIs."
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
            <ReportsIcon sx={{ fontSize: 22 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>API-backed reporting</Typography>
          </Box>
        }
      />

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="overline" sx={{ letterSpacing: 1.6, opacity: 0.9 }}>Operational report</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>A concise view of fleet health, readiness, and compliance.</Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.82)' }}>
              This page focuses on reporting snapshots instead of dashboard-style charts, so the sections stay distinct and easier to scan.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              {['Vehicle readiness', 'Driver availability', 'Asset compliance', 'Document expiry'].map((tag) => (
                <Chip key={tag} label={tag} sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.18)' }} variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2.5}>
          {reportStats.map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item.label}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.2, color: 'text.secondary' }}>{item.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: item.tone === 'teal' ? PALETTE.teal : item.tone === 'violet' ? '#7C6FF7' : item.tone === 'amber' ? PALETTE.amber : PALETTE.coral }}>{item.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Click a report to open details</Typography>
                <Stack spacing={1.5}>
                  <ReportTile label="Document expiry" value={`${documents.filter((item) => item.expiryDate).length} documents tracked`} note="Open document expiry details" onClick={() => setSelectedReport('document-expiry')} />
                  <ReportTile label="Asset compliance" value={`${assets.filter((item) => ['DAMAGED', 'LOST', 'UNDER_REPAIR'].includes(item.currentStatus)).length} items need attention`} note="Open asset compliance issues" onClick={() => setSelectedReport('asset-compliance')} />
                  <ReportTile label="Driver availability" value={`${drivers.filter((item) => item.status === 'AVAILABLE').length} drivers available`} note="Open driver availability list" onClick={() => setSelectedReport('driver-availability')} />
                  <ReportTile label="Vehicle readiness" value={`${vehicles.filter((item) => item.status === 'AVAILABLE').length} vehicles ready`} note="Open vehicle readiness details" onClick={() => setSelectedReport('vehicle-readiness')} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <ExpiryAlertCard documents={documents} loading={loading} />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Vehicle watchlist</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehicleWatchlist.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{item.vehicleNumber}</TableCell>
                          <TableCell>{item.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Driver availability</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {driverWatchlist.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                          <TableCell>{item.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Asset condition</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assetWatchlist.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                          <TableCell>{item.currentStatus}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedReport === 'document-expiry' && 'Document Expiry'}
          {selectedReport === 'asset-compliance' && 'Asset Compliance'}
          {selectedReport === 'driver-availability' && 'Driver Availability'}
          {selectedReport === 'vehicle-readiness' && 'Vehicle Readiness'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport === 'document-expiry' && renderReportDialogContent('document-expiry', { documents, vehicles, drivers, assets })}
          {selectedReport === 'asset-compliance' && renderReportDialogContent('asset-compliance', { documents, vehicles, drivers, assets })}
          {selectedReport === 'driver-availability' && renderReportDialogContent('driver-availability', { documents, vehicles, drivers, assets })}
          {selectedReport === 'vehicle-readiness' && renderReportDialogContent('vehicle-readiness', { documents, vehicles, drivers, assets })}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ReportTile({ label, value, note, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.8,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        bgcolor: 'rgba(15, 23, 42, 0.03)',
        transition: 'all 0.2s ease',
        '&:hover': { bgcolor: 'rgba(124, 111, 247, 0.08)', transform: 'translateY(-1px)' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{value}</Typography>
        </Box>
        <Chip label="Open" size="small" color="primary" variant="outlined" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{note}</Typography>
    </Box>
  );
}

function renderReportDialogContent(type, data) {
  const { documents = [], vehicles = [], drivers = [], assets = [] } = data;

  if (type === 'document-expiry') {
    const items = documents.filter((item) => item.expiryDate).slice(0, 8);
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">Documents with expiry dates that should be reviewed in the next reporting cycle.</Typography>
        {items.length === 0 ? <Typography variant="body2">No document expiry data available.</Typography> : items.map((item) => (
          <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.03)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.documentType || 'Document'}</Typography>
            <Typography variant="body2" color="text.secondary">{item.entityType || 'Entity'} · {item.documentNumber || 'No number'}</Typography>
            <Typography variant="caption" color="text.secondary">Expiry: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Not set'}</Typography>
          </Box>
        ))}
      </Stack>
    );
  }

  if (type === 'asset-compliance') {
    const items = assets.filter((item) => ['DAMAGED', 'LOST', 'UNDER_REPAIR'].includes(item.currentStatus)).slice(0, 8);
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">Assets flagged for compliance or maintenance follow-up.</Typography>
        {items.length === 0 ? <Typography variant="body2">No compliance issues found.</Typography> : items.map((item) => (
          <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.03)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
            <Typography variant="body2" color="text.secondary">Category: {item.assetCategory?.name || 'Uncategorized'}</Typography>
            <Typography variant="caption" color="text.secondary">Status: {item.currentStatus}</Typography>
          </Box>
        ))}
      </Stack>
    );
  }

  if (type === 'driver-availability') {
    const items = drivers.filter((item) => item.status === 'AVAILABLE').slice(0, 8);
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">Drivers ready for dispatch and active assignments.</Typography>
        {items.length === 0 ? <Typography variant="body2">No available drivers found.</Typography> : items.map((item) => (
          <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.03)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
            <Typography variant="body2" color="text.secondary">Mobile: {item.mobile || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">Status: {item.status}</Typography>
          </Box>
        ))}
      </Stack>
    );
  }

  const items = vehicles.filter((item) => item.status === 'AVAILABLE').slice(0, 8);
  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">Vehicles currently ready for dispatch.</Typography>
      {items.length === 0 ? <Typography variant="body2">No ready vehicles found.</Typography> : items.map((item) => (
        <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.03)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.vehicleNumber}</Typography>
          <Typography variant="body2" color="text.secondary">Type: {item.vehicleType || '—'} · Fuel: {item.fuelType || '—'}</Typography>
          <Typography variant="caption" color="text.secondary">Status: {item.status}</Typography>
        </Box>
      ))}
    </Stack>
  );
}