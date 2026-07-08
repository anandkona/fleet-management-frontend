import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, TextField, InputAdornment, useTheme
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

const fallbackTracking = [
  { id: 1, licensePlate: 'AP05-T123', make: 'Tata Prima', status: 'moving', lat: 17.6868, lng: 83.2185, speed: 45, driver: 'Rajesh Kumar', route: 'Vizag Port → APSEZ' },
  { id: 2, licensePlate: 'AP05-T087', make: 'Ashok Leyland', status: 'moving', lat: 17.7210, lng: 83.3015, speed: 38, driver: 'Suresh Babu', route: 'Gajuwaka → Pendurthi' },
  { id: 3, licensePlate: 'AP05-T201', make: 'Eicher Pro', status: 'stopped', lat: 17.7500, lng: 83.2800, speed: 0, driver: 'Mohan Reddy', route: 'BHPV Gate → Simhachalam' },
  { id: 4, licensePlate: 'AP05-T043', make: 'Mahindra Blazo', status: 'idle', lat: 17.7100, lng: 83.2500, speed: 0, driver: 'Venkat Rao', route: 'Dwaraka Nagar → Rushikonda' },
  { id: 5, licensePlate: 'AP05-T089', make: 'Tata Ace', status: 'moving', lat: 17.7650, lng: 83.3100, speed: 52, driver: 'Prasad Nair', route: 'MVP Colony → Madhurawada' },
  { id: 6, licensePlate: 'AP05-T112', make: 'Force Traveller', status: 'stopped', lat: 17.6900, lng: 83.2200, speed: 0, driver: '—', route: 'Depot' },
];

const getStatusColor = (s) => {
  if (s === 'active' || s === 'AVAILABLE' || s === 'ON_TRIP') return '#4ade80';
  if (s === 'UNDER_MAINTENANCE' || s === 'UNDER_REPAIR') return '#fb923c';
  return '#6b7280';
};

const getMarkerStatus = (s) => {
  const status = (s || '').toLowerCase();
  if (status === 'active' || status === 'on_trip' || status === 'moving') return 'moving';
  if (status === 'available' || status === 'idle') return 'idle';
  return 'stopped';
};

const getCustomIcon = (status) => {
  const color = status === 'moving' ? '#4ade80' : status === 'idle' ? '#fb923c' : '#ef4444';
  const animation = status === 'moving' ? 'pulse-moving 2s infinite' : 'none';
  
  const html = `
    <div style="
      width: 16px; 
      height: 16px; 
      background-color: ${color}; 
      border-radius: 50%; 
      border: 3px solid #fff; 
      box-shadow: 0 0 10px ${color};
      animation: ${animation};
    "></div>
  `;
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    tooltipAnchor: [12, 0]
  });
};

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [livePositions, setLivePositions] = useState({});
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const q = search.toLowerCase();
      const plate = (v.licensePlate || v.vehicleNumber || '').toLowerCase();
      const make = (v.make || v.brand || '').toLowerCase();
      return plate.includes(q) || make.includes(q);
    });
  }, [vehicles, search]);

  useEffect(() => {
    // Real-time GPS physics simulation
    const interval = setInterval(() => {
      setLivePositions(prev => {
        const next = { ...prev };
        filtered.forEach((v, i) => {
          const id = v.licensePlate || v.vehicleNumber || `V${i}`;
          const status = getMarkerStatus(v.status);
          
          if (!next[id]) {
            next[id] = {
              lat: v.lat || (17.7 + (Math.random() - 0.5) * 0.1),
              lng: v.lng || (83.2 + (Math.random() - 0.5) * 0.1),
              vLat: (Math.random() - 0.5) * 0.0004,
              vLng: (Math.random() - 0.5) * 0.0004,
            };
          }
          
          if (status === 'moving') {
            let { lat, lng, vLat, vLng } = next[id];
            
            // Introduce gradual steering
            vLat += (Math.random() - 0.5) * 0.0001;
            vLng += (Math.random() - 0.5) * 0.0001;
            
            // Normalize speed to ~0.001 degrees per tick for highly visible map movement
            const speed = Math.sqrt(vLat*vLat + vLng*vLng);
            if (speed > 0) {
              vLat = (vLat / speed) * 0.001;
              vLng = (vLng / speed) * 0.001;
            }
            
            let newLat = lat + vLat;
            let newLng = lng + vLng;
            
            // Soft bounding box around Visakhapatnam to keep them on map
            if (newLat < 17.65 || newLat > 17.8) { vLat = -vLat; newLat = lat + vLat; }
            if (newLng < 83.15 || newLng > 83.35) { vLng = -vLng; newLng = lng + vLng; }
            
            next[id] = { ...next[id], lat: newLat, lng: newLng, vLat, vLng };
          }
        });
        return next;
      });
    }, 2000); // 2 second ticks
    return () => clearInterval(interval);
  }, [filtered]);

  const mapCenter = [17.72, 83.25]; // Visakhapatnam, India
  const initialZoom = 14;

  return (
    <Box>
      <style>{`
        @keyframes pulse-moving {
          0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
        
        /* Smooth leaflet marker transitions */
        .leaflet-marker-icon, .leaflet-marker-shadow {
          transition: transform 2.1s linear;
        }

        /* Optional Map CSS Filter for dark aesthetic if using standard OpenStreetMap */
        /* But CARTO dark_all is already dark, so no filter needed. */
        
        .leaflet-container {
          background-color: ${isDark ? '#0b1121' : '#f8fafc'};
          font-family: inherit;
        }
        
        .custom-leaflet-tooltip {
          background-color: ${isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'};
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          color: ${isDark ? 'white' : 'black'};
          font-weight: 600;
          backdrop-filter: blur(4px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .leaflet-tooltip-left::before { border-left-color: ${isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'}; }
        .leaflet-tooltip-right::before { border-right-color: ${isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'}; }
      `}</style>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ flex: 1, width: { xs: '100%', sm: 200 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }}
          />
          </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: 3 }}>
        {/* Map */}
        <Card sx={{ p: 0, height: 500, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', position: 'relative' }}>
          <MapContainer center={mapCenter} zoom={initialZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <ZoomControl position="topright" />
            {/* CARTO Tile Layer conditionally adapting to Light/Dark Mode */}
            <TileLayer
              key={isDark ? 'dark' : 'light'}
              url={isDark 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {filtered.map((v, i) => {
              const id = v.licensePlate || v.vehicleNumber || `V${i}`;
              const status = getMarkerStatus(v.status);
              const pos = livePositions[id];
              
              if (!pos) return null; // Wait for physics initialization
              
              return (
                <Marker 
                  key={id} 
                  position={[pos.lat, pos.lng]} 
                  icon={getCustomIcon(status)}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-leaflet-tooltip">
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 800 }}>{id}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: status === 'moving' ? '#4ade80' : '#fb923c' }}>
                        {status.toUpperCase()}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
          
          <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: isDark ? 'rgba(15,25,35,0.85)' : 'rgba(255,255,255,0.85)', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, backdropFilter: 'blur(8px)', zIndex: 1000 }}>
            {[{ l: 'Moving', c: '#4ade80' }, { l: 'Idle', c: '#fb923c' }, { l: 'Stopped', c: '#ef4444' }].map(i => (
              <Box key={i.l} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i.c, boxShadow: `0 0 5px ${i.c}` }} />
                <Typography sx={{ fontSize: '0.7rem', color: isDark ? '#fff' : '#000', fontWeight: 600 }}>{i.l}</Typography>
              </Box>
            ))}
          </Box>
        </Card>

        {/* Vehicle List */}
        <Card sx={{ p: 2, overflowY: 'auto', overflowX: 'auto', maxHeight: 500, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>All Vehicles ({filtered.length})</Typography>
          {loading ? <CircularProgress size={30} /> : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Plate', 'Model', 'Status', 'Fuel'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
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
                      <Typography sx={{ fontSize: '0.8rem', color: (v.fuelLevel || 0) < 20 ? '#ef4444' : 'text.primary', fontWeight: 600 }}>{v.fuelLevel || 0}%</Typography>
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
