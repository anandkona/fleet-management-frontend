import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, useTheme, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Inventory, WarningAmber, AttachMoney, ShoppingCart } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

function extractItems(res) {
  const raw = res?.data;
  if (!raw) return [];
  if (raw?.data?.items && Array.isArray(raw.data.items)) return raw.data.items;
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw)) return raw;
  return [];
}

export default function InventoryManagerDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const inv = await api.get('/inventory', { params: { limit: 200 } }).catch(() => ({ data: [] }));
      setInventory(extractItems(inv));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';

  // ── Computed metrics (fully dynamic) ───────────────────────────────────────
  const totalItems = inventory.length;
  const lowStockThreshold = 10;
  const lowStockCount = inventory.filter(i => Number(i.quantity) <= (Number(i.reorderLevel) || lowStockThreshold)).length;
  const totalStockValue = inventory.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice || i.price || 0)), 0);
  const pendingOrders = inventory.filter(i => i.orderStatus?.toUpperCase() === 'PENDING' || i.status?.toUpperCase() === 'ORDERED').length;

  // ── Inventory value snapshot by category ──────────────────────────────────
  // Groups items by category and plots total value per category as a line
  const catMap = {};
  inventory.forEach(item => {
    const cat = item.category || item.type || 'General';
    if (!catMap[cat]) catMap[cat] = { name: cat, value: 0 };
    catMap[cat].value += Number(item.quantity) * Number(item.unitPrice || item.price || 0);
  });
  const valueTrendData = Object.values(catMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // ── Low stock items ────────────────────────────────────────────────────────
  const lowStockItems = inventory
    .filter(i => Number(i.quantity) <= (Number(i.reorderLevel) || lowStockThreshold))
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  // ── Items needing reorder ──────────────────────────────────────────────────
  const recentItems = [...inventory].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 5);

  const MetricCard = ({ title, val, icon, color, bg }) => (
    <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: bg, color }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
          {loading ? <Skeleton width={80} height={28} /> :
            <Typography variant="h6" fontWeight="bold">{val}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Welcome back, {user?.firstName || 'Inventory Manager'}!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Items" val={totalItems} icon={<Inventory />} color="#1976d2" bg="#e3f2fd" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Low Stock Items" val={lowStockCount} icon={<WarningAmber />} color="#d32f2f" bg="#ffebee" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Stock Value" val={`₹ ${totalStockValue.toLocaleString()}`} icon={<AttachMoney />} color="#4caf50" bg="#e8f5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Items on Order" val={pendingOrders} icon={<ShoppingCart />} color="#ed6c02" bg="#fff3e0" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>Stock Value by Category</Typography>
            {loading ? <Skeleton variant="rectangular" height={250} /> :
              valueTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={valueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} width={80} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`₹ ${v.toLocaleString()}`, 'Value']} />
                    <Line type="monotone" dataKey="value" stroke="#4caf50" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <Typography color="text.secondary">No inventory data available</Typography>
                </Box>
              )}
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, height: 320, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Top Low Stock Items</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Reorder At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>) :
                    lowStockItems.slice(0, 5).map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>{item.quantity}</TableCell>
                        <TableCell align="right">{item.reorderLevel || lowStockThreshold}</TableCell>
                      </TableRow>
                    ))}
                  {!loading && lowStockItems.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center">All stock levels OK</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ bgcolor: cardBg, borderRadius: 2, border: `1px solid ${borderColor}`, p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" mb={2}>Recently Updated Items</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price (₹)</TableCell>
                <TableCell align="right">Total Value (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [0, 1, 2].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton /></TableCell></TableRow>) :
                recentItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category || item.type || '—'}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{Number(item.unitPrice || item.price || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{(Number(item.quantity) * Number(item.unitPrice || item.price || 0)).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              {!loading && inventory.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No inventory items found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
