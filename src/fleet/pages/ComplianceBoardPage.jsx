import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box,
  TableContainer, Chip, useTheme, Card, CircularProgress,
  Typography
} from '@mui/material';
import { FactCheck } from '@mui/icons-material';
import { financeService } from '../../services/api';
import { PageHeader } from '../components/Common';

export default function ComplianceBoardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchCompliance = useCallback(async () => {
    setLoading(true);
    try {
      // For now we map this to transactions where sourceModule = COMPLIANCE
      const res = await financeService.getTransactions({ limit: 100, sourceModule: 'COMPLIANCE' });
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching compliance data', err);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ p: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0 }}>
        <PageHeader 
        subicon={<FactCheck color="primary" sx={{ fontSize: 40 }}/>}
        />
      </Box>

      <Card sx={{ mt: 1, mb: 2, borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { backgroundColor: '#1976d2', color: '#fff', fontWeight: 600 } }}>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Expense Amount</TableCell>
                <TableCell>Payment Mode</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{new Date(item.transactionDate).toLocaleDateString()}</TableCell>
                  <TableCell>{item.referenceNumber || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>₹{item.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={item.paymentMode?.replace('_', ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{item.description || '-'}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No compliance expenses found.
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
