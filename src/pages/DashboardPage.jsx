import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Stack, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  TableContainer, Alert, Chip, IconButton, Tooltip,
} from '@mui/material';
import {
  DirectionsCar, Person, Build, DirectionsCarFilled,
  LocalShipping, Inventory, Refresh, Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { StatCard, StatusChip, PageHeader } from '../components/Common';
import { StatusPieChart, TypeBarChart, ExpiryAlertCard } from '../components/DashboardCharts';
import { vehicleService, driverService, assetService, documentService } from '../services/api';
import { PALETTE } from '../theme';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [documents, setDocuments] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [vRes, dRes, aRes, docRes] = await Promise.allSettled([
        vehicleService.getAll({ limit: 100 }),
        driverService.getAll({ limit: 100 }),
        assetService.getAll({ limit: 100 }),
        documentService.getAll(),
      ]);

      console.log('[Dashboard] API responses:', {
        vehicles: vRes.status === 'fulfilled' ? vRes.value.data : vRes.reason,
        drivers: dRes.status === 'fulfilled' ? dRes.value.data : dRes.reason,
        assets: aRes.status === 'fulfilled' ? aRes.value.data : aRes.reason,
        documents: docRes.status === 'fulfilled' ? docRes.value.data : docRes.reason,
      });

      const extract = (res, label) => {
        if (res.status === 'rejected') {
          console.warn(`[Dashboard] ${label} fetch failed:`, res.reason?.message || res.reason);
          return [];
        }
        const raw = res.value.data;
        const d = raw?.data ?? raw;
        const items = d?.items ?? (Array.isArray(d) ? d : []);
        console.log(`[Dashboard] ${label}:`, items.length, 'items');
        return items;
      };

      setVehicles(extract(vRes, 'Vehicles'));
      setDrivers(extract(dRes, 'Drivers'));
      setAssets(extract(aRes, 'Assets'));
      setDocuments(extract(docRes, 'Documents'));

      const errors = [vRes, dRes, aRes, docRes]
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.message || 'Unknown error');

      if (errors.length > 0) {
        setError(`Some data failed to load: ${errors.join('; ')}`);
      }
    } catch (err) {
      console.error('[Dashboard] Unexpected error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const vehicleStats = useMemo(() => {
    const counts = {};
    vehicles.forEach((v) => {
      counts[v.status] = (counts[v.status] || 0) + 1;
    });
    return counts;
  }, [vehicles]);

  const vehicleTypes = useMemo(() => {
    const counts = {};
    vehicles.forEach((v) => {
      const t = v.vehicleType || 'Unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [vehicles]);

  const fuelTypes = useMemo(() => {
    const counts = {};
    vehicles.forEach((v) => {
      const f = v.fuelType || 'Unknown';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [vehicles]);

  const driverStats = useMemo(() => {
    const counts = {};
    drivers.forEach((d) => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return counts;
  }, [drivers]);

  const assetStats = useMemo(() => {
    const counts = {};
    assets.forEach((a) => {
      counts[a.currentStatus] = (counts[a.currentStatus] || 0) + 1;
    });
    return counts;
  }, [assets]);

  const categoryBreakdown = useMemo(() => {
    const counts = {};
    assets.forEach((a) => {
      const cat = a.assetCategory?.name || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [assets]);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Your fleet at a glance"
        icon={DashboardIcon}
        action={
          <Tooltip title="Refresh data">
            <span>
              <IconButton onClick={fetchData} disabled={loading} color="primary">
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        }
      />

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={2}>
              <Box sx={{ maxWidth: 700 }}>
                <Typography variant="overline" sx={{ letterSpacing: 1.6, opacity: 0.9 }}>Fleet command center</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>Monitor fleet readiness, maintenance, and asset health instantly.</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.82)' }}>
                  Track vehicle availability, driver status, assets, and compliance signals from your live fleet APIs in one place.
                </Typography>
              </Box>
              <Stack spacing={1} sx={{ minWidth: 260 }}>
                {[
                  'AI-ready insights',
                  'Document expiry checks',
                  'Maintenance watchlist',
                  'Fleet utilization summary',
                ].map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.18)', bgcolor: 'rgba(255,255,255,0.08)' }} />
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2.5}>
          {[
            { icon: <DirectionsCar />, label: 'Total Vehicles', value: vehicles.length, color: PALETTE.teal },
            { icon: <DirectionsCarFilled />, label: 'Active', value: vehicleStats.AVAILABLE || 0, color: '#00C2A8' },
            { icon: <Build />, label: 'In Maintenance', value: (vehicleStats.UNDER_MAINTENANCE || 0) + (vehicleStats.UNDER_REPAIR || 0), color: PALETTE.amber },
            { icon: <Person />, label: 'Active Drivers', value: driverStats.AVAILABLE || 0, color: '#7C6FF7' },
            { icon: <LocalShipping />, label: 'On Trip', value: vehicleStats.ON_TRIP || 0, color: '#45B7D1' },
            { icon: <Inventory />, label: 'Total Assets', value: assets.length, color: PALETTE.coral },
          ].map((s) => (
            <Grid item xs={12} sm={6} lg={3} key={s.label}>
              <StatCard {...s} loading={loading} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>AI Fleet Insights</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Live signals to prioritize fleet action and keep operations responsive.</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Vehicles ready', value: `${vehicles.filter((v) => v.status === 'AVAILABLE').length} available`, tone: PALETTE.teal },
                    { label: 'Maintenance queue', value: `${vehicles.filter((v) => ['UNDER_MAINTENANCE', 'UNDER_REPAIR'].includes(v.status)).length} units`, tone: PALETTE.amber },
                    { label: 'Drivers on duty', value: `${drivers.filter((d) => d.status === 'AVAILABLE').length} active`, tone: '#7C6FF7' },
                    { label: 'Assets flagged', value: `${assets.filter((a) => ['DAMAGED', 'LOST', 'UNDER_REPAIR'].includes(a.currentStatus)).length} items`, tone: PALETTE.coral },
                  ].map((item) => (
                    <Grid item xs={12} sm={6} key={item.label}>
                      <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ py: 1.75 }}>
                          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.1, color: 'text.secondary' }}>{item.label}</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.8, color: item.tone }}>{item.value}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <StatusPieChart data={vehicleStats} title="Vehicle Status" loading={loading} />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <TypeBarChart data={vehicleTypes} title="Vehicles by Type" loading={loading} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TypeBarChart data={fuelTypes} title="Fuel Type Distribution" loading={loading} color={PALETTE.amber} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatusPieChart data={driverStats} title="Driver Status" loading={loading} />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <StatusPieChart data={driverStats} title="Driver Status" loading={loading} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatusPieChart data={assetStats} title="Asset Status" loading={loading} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TypeBarChart data={categoryBreakdown} title="Assets by Category" loading={loading} color="#7C6FF7" />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <ExpiryAlertCard documents={documents} loading={loading} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Recent Vehicles</Typography>
                {loading ? (
                  <Stack spacing={1.5}>{Array(4).fill(0).map((_, i) => <Skeleton key={i} height={48} />)}</Stack>
                ) : vehicles.length > 0 ? (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {['Number', 'Type', 'Brand', 'Fuel', 'Status'].map((h) => (
                            <TableCell key={h}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vehicles.slice(0, 6).map((v) => (
                          <TableRow key={v.id} hover>
                            <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.vehicleNumber}</TableCell>
                            <TableCell>{v.vehicleType || '—'}</TableCell>
                            <TableCell>{v.brand || '—'}</TableCell>
                            <TableCell>{v.fuelType || '—'}</TableCell>
                            <TableCell><StatusChip status={v.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No vehicles found</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Recent Drivers</Typography>
                {loading ? (
                  <Stack spacing={1.5}>{Array(4).fill(0).map((_, i) => <Skeleton key={i} height={48} />)}</Stack>
                ) : drivers.length > 0 ? (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {['Name', 'Mobile', 'License', 'Experience', 'Status'].map((h) => (
                            <TableCell key={h}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {drivers.slice(0, 6).map((d) => (
                          <TableRow key={d.id} hover>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar sx={{ width: 30, height: 30, bgcolor: '#7C6FF718', color: '#7C6FF7', fontSize: '0.7rem' }}>
                                  {(d.name || '?')[0].toUpperCase()}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{d.mobile || '—'}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.licenseNumber || '—'}</TableCell>
                            <TableCell>{d.experienceYears ? `${d.experienceYears} yrs` : '—'}</TableCell>
                            <TableCell><StatusChip status={d.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No drivers found</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Recent Assets</Typography>
                {loading ? (
                  <Stack spacing={1.5}>{Array(4).fill(0).map((_, i) => <Skeleton key={i} height={48} />)}</Stack>
                ) : assets.length > 0 ? (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {['Code', 'Name', 'Category', 'Status'].map((h) => (
                            <TableCell key={h}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assets.slice(0, 6).map((a) => (
                          <TableRow key={a.id} hover>
                            <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{a.assetCode}</TableCell>
                            <TableCell>{a.name}</TableCell>
                            <TableCell>{a.assetCategory?.name || '—'}</TableCell>
                            <TableCell><StatusChip status={a.currentStatus} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No assets found</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
