import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box,
  TableContainer, Typography, Chip, useTheme, Card, CircularProgress
} from '@mui/material';
import { Money } from '@mui/icons-material';
import { PageHeader } from '../components/Common';
import api from '../../services/api';

export default function DriverPortalAdvancesPage() {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchAdvances = useCallback(async () => {
    setLoading(true);
    try {
      // Driver portal endpoint
      const res = await api.get('/me/driver-advances', { params: { limit: 100 } });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setAdvances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching driver advances', err);
      setAdvances([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdvances();
  }, [fetchAdvances]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'SUBMITTED': return 'info';
      case 'ISSUED': return 'primary';
      default: return 'default';
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ pt: 1, px: 3, pb: 3, maxWidth: '100%' }}>
      <PageHeader 
        subicon={<Money color="primary" sx={{ fontSize: 40 }}/>}
      />

      <Card sx={{ mt: 3, borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.No', 'Vehicle ID', 'Amount', 'Purpose', 'Status'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {advances.map((a, i) => (
                <TableRow key={a.id || i} hover>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{a.vehicleId || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>₹{a.amount?.toLocaleString()}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{a.purpose || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={a.status || 'DRAFT'} size="small" color={getStatusColor(a.status)} sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                </TableRow>
              ))}
              {advances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No advances found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
