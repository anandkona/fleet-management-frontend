import React from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const MyLocationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8a93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

export default function LiveTracking({ trackingData }) {
  const getMarkerColor = (status) => {
    switch (status) {
      case 'moving': return '#1976d2';
      case 'idle': return '#fb923c';
      case 'alert': return '#ef4444';
      case 'stopped': default: return '#6b7280';
    }
  };

  const getTripStatusColor = (status) => {
    if (status.includes('Active')) return '#4ade80';
    if (status.includes('Idle')) return '#fb923c';
    if (status.includes('Done')) return '#8a8a93';
    return '#fff';
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MyLocationIcon />
          <Typography variant="body1" sx={{ fontWeight: 700 }}>Live vehicle tracking</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiberManualRecordIcon sx={{ color: '#4ade80', fontSize: '10px' }} />
          <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 600, fontSize: '0.78rem' }}>{trackingData.status}</Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', width: '100%', height: '220px', bgcolor: 'background.paper', borderRadius: '8px', border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <rect x="5%" y="10%" width="22%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="32%" y="10%" width="32%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="69%" y="10%" width="26%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="5%" y="38%" width="22%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="32%" y="38%" width="32%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="69%" y="38%" width="26%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="5%" y="66%" width="22%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="32%" y="66%" width="32%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          <rect x="69%" y="66%" width="26%" height="22%" rx="4" fill="#2b2d35" opacity="0.6" />
          {trackingData.markers.map((marker) => {
            const color = getMarkerColor(marker.status);
            const isAlert = marker.status === 'alert';
            return (
              <g key={marker.id} transform={`translate(${marker.x * 2.8 + 20}, ${marker.y * 1.5 + 20})`}>
                {isAlert ? (
                  <>
                    <circle r="14" fill="#ef4444" opacity="0.2">
                      <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle r="10" fill="#ef4444" />
                    <text y="3" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="Arial">!</text>
                  </>
                ) : (
                  <>
                    <circle r="11" fill={color} />
                    <text y="3.5" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="Arial">{marker.label}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
        <Box sx={{ position: 'absolute', bottom: '10px', right: '10px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.95 }}>
          {[{ label: 'Moving', color: '#1976d2' }, { label: 'Idle', color: '#fb923c' }, { label: 'Alert', color: '#ef4444' }, { label: 'Stopped', color: '#6b7280' }].map((leg) => (
            <Box key={leg.label} sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: leg.color }} />
              <Typography variant="body2" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary' }}>{leg.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>Recent trips</Typography>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Table size="small" sx={{ '& td': { borderBottom: '1px solid #232329', py: '10px', px: 0 } }}>
          <TableBody>
            {trackingData.recentTrips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{trip.vehicle}</Typography></TableCell>
                <TableCell><Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>{trip.route}</Typography></TableCell>
                <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{trip.distance}</Typography></TableCell>
                <TableCell align="right" sx={{ width: '80px' }}><Typography variant="body2" sx={{ fontWeight: 700, color: getTripStatusColor(trip.status), fontSize: '0.8rem' }}>{trip.status}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}
