import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, TextField, InputAdornment
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';

const fallbackTracking = [
  { id: 1, licensePlate: 'AP05-T123', make: 'Tata Prima', status: 'moving', lat: 17.6868, lng: 83.2185, speed: 45, driver: 'Rajesh Kumar', route: 'Vizag Port → APSEZ' },
  { id: 2, licensePlate: 'AP05-T087', make: 'Ashok Leyland', status: 'moving', lat: 17.7210, lng: 83.3015, speed: 38, driver: 'Suresh Babu', route: 'Gajuwaka → Pendurthi' },
  { id: 3, licensePlate: 'AP05-T201', make: 'Eicher Pro', status: 'stopped', lat: 17.7500, lng: 83.2800, speed: 0, driver: 'Mohan Reddy', route: 'BHPV Gate → Simhachalam' },
  { id: 4, licensePlate: 'AP05-T043', make: 'Mahindra Blazo', status: 'idle', lat: 17.7100, lng: 83.2500, speed: 0, driver: 'Venkat Rao', route: 'Dwaraka Nagar → Rushikonda' },
  { id: 5, licensePlate: 'AP05-T089', make: 'Tata Ace', status: 'moving', lat: 17.7650, lng: 83.3100, speed: 52, driver: 'Prasad Nair', route: 'MVP Colony → Madhurawada' },
  { id: 6, licensePlate: 'AP05-T112', make: 'Force Traveller', status: 'stopped', lat: 17.6900, lng: 83.2200, speed: 0, driver: '—', route: 'Depot' },
];

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setVehicles(items.length > 0 ? items : fallbackTracking);
    } catch (err) {
      console.error(err);
      setVehicles(fallbackTracking);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    const plate = (v.licensePlate || v.vehicleNumber || '').toLowerCase();
    const make = (v.make || v.brand || '').toLowerCase();
    return plate.includes(q) || make.includes(q);
  });

  const getStatusColor = (s) => {
    if (s === 'active' || s === 'AVAILABLE' || s === 'ON_TRIP') return '#4ade80';
    if (s === 'UNDER_MAINTENANCE' || s === 'UNDER_REPAIR') return '#fb923c';
    return '#6b7280';
  };

  const getMarkerStatus = (s) => {
    if (s === 'active' || s === 'ON_TRIP') return 'moving';
    if (s === 'AVAILABLE') return 'idle';
    if (s === 'UNDER_MAINTENANCE' || s === 'UNDER_REPAIR') return 'stopped';
    return 'idle';
  };

  const markers = filtered.map((v, i) => ({
    id: v.licensePlate || v.vehicleNumber || `V${i}`,
    x: 15 + ((i * 17) % 70),
    y: 15 + ((i * 23) % 70),
    status: getMarkerStatus(v.status)
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MyLocationIcon sx={{ color: '#1976d2' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Live Vehicle Tracking</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ flex: 1, width: { xs: '100%', sm: 200 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }}
          />
          <IconButton onClick={fetchData} sx={{ color: 'text.primary', border: { xs: '1px solid', sm: 'none' }, borderColor: 'divider', borderRadius: 1.5 }}><RefreshIcon /></IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: 3 }}>
        {/* Map */}
        <Card sx={{ p: 2, height: 450 }}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <svg width="100%" height="100%">
              {[5, 32, 69].map(x => [10, 38, 66].map(y => (
                <rect key={`${x}-${y}`} x={`${x}%`} y={`${y}%`} width="22%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
              )))}
              {markers.map((m) => {
                const color = m.status === 'moving' ? '#1976d2' : m.status === 'idle' ? '#fb923c' : '#6b7280';
                return (
                  <g key={m.id} transform={`translate(${m.x * 3.5 + 10}, ${m.y * 2.8 + 10})`}>
                    <circle r="12" fill={color} />
                    <text y="3" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Arial">{m.id.slice(-3)}</text>
                  </g>
                );
              })}
            </svg>
            <Box sx={{ position: 'absolute', bottom: 10, right: 10, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: '6px 10px', display: 'flex', gap: 2 }}>
              {[{ l: 'Moving', c: '#1976d2' }, { l: 'Idle', c: '#fb923c' }, { l: 'Stopped', c: '#6b7280' }].map(i => (
                <Box key={i.l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: i.c }} />
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.primary' }}>{i.l}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>

        {/* Vehicle List */}
        <Card sx={{ p: 2, overflowY: 'auto', overflowX: 'auto', maxHeight: 450 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>All Vehicles ({filtered.length})</Typography>
          {loading ? <CircularProgress size={30} /> : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.7rem' }}>PLATE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.7rem' }}>MODEL</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.7rem' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.7rem' }}>FUEL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((v, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{v.licensePlate || v.vehicleNumber}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.primary' }}>{v.make || v.brand}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: getStatusColor(v.status) }} />
                        <Typography sx={{ fontSize: '0.75rem', color: getStatusColor(v.status), fontWeight: 600 }}>{(v.status || '').toUpperCase()}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', color: (v.fuelLevel || 0) < 20 ? '#ef4444' : '#fff', fontWeight: 600 }}>{v.fuelLevel || 0}%</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Box>
    </Box>
  );
}
