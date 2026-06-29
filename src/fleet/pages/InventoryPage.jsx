import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, LinearProgress, useTheme, useMediaQuery
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import HistoryIcon from '@mui/icons-material/History';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningIcon from '@mui/icons-material/Warning';
import { Menu, ListItemIcon, ListItemText, Snackbar, Alert, List, ListItem, Divider } from '@mui/material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const fallbackAssets = [
  { id: 1, name: 'Brake Pads (Front)', category: 'Spare Part', quantity: 12, status: 'In Stock' },
  { id: 2, name: 'Oil Filter - 5W30', category: 'Consumable', quantity: 34, status: 'In Stock' },
  { id: 3, name: 'Spare Tyre 10R20', category: 'Spare Part', quantity: 8, status: 'In Stock' },
  { id: 4, name: 'Hydraulic Jack 3T', category: 'Tool', quantity: 4, status: 'In Stock' },
  { id: 5, name: 'LED Headlamp Assembly', category: 'Spare Part', quantity: 6, status: 'In Stock' },
  { id: 6, name: 'Air Filter Element', category: 'Consumable', quantity: 22, status: 'In Stock' },
  { id: 7, name: 'Battery 12V 100Ah', category: 'Spare Part', quantity: 5, status: 'Low Stock' },
  { id: 8, name: 'Wheel Spanner Set', category: 'Tool', quantity: 3, status: 'In Stock' },
];

export default function InventoryPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Spare Part', quantity: 0, status: 'In Stock' });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAsset, setMenuAsset] = useState(null);

  const [assignDialog, setAssignDialog] = useState({ open: false, asset: null, form: { assignedTo: '', assignmentDate: '', notes: '' } });
  const [returnDialog, setReturnDialog] = useState({ open: false, asset: null, form: { returnDate: '', conditionOnReturn: 'Good', notes: '' } });
  const [historyDialog, setHistoryDialog] = useState({ open: false, asset: null, records: [], loading: false });
  const { hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuOpen = (event, asset) => { setAnchorEl(event.currentTarget); setMenuAsset(asset); };
  const handleMenuClose = () => { setAnchorEl(null); setMenuAsset(null); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setAssets(items.length > 0 ? items : fallbackAssets);
    } catch (err) { console.error(err); setAssets(fallbackAssets); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      if (editItem) { await api.patch(`/assets/${editItem.id || editItem._id}`, form); }
      else { await api.post('/assets', form); }
      setOpenDialog(false); setEditItem(null); fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try { await api.delete(`/assets/${item.id || item._id}`); fetchData(); } catch (err) { console.error(err); }
  };

  const handleAction = async (actionPath, payload) => {
    try {
      await api.post(actionPath, payload);
      toast('Action successful');
      fetchData();
    } catch (err) {
      console.error(err);
      toast(`Failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const submitAssign = async () => {
    await handleAction(`/assets/${assignDialog.asset.id || assignDialog.asset._id}/assign`, assignDialog.form);
    setAssignDialog({ open: false, asset: null, form: {} });
  };

  const submitReturn = async () => {
    await handleAction(`/assets/${returnDialog.asset.id || returnDialog.asset._id}/return`, returnDialog.form);
    setReturnDialog({ open: false, asset: null, form: {} });
  };

  const openHistory = async (asset) => {
    setHistoryDialog({ open: true, asset, records: [], loading: true });
    try {
      const res = await api.get(`/assets/${asset.id || asset._id}/history`);
      setHistoryDialog({ open: true, asset, records: res.data?.data || [], loading: false });
    } catch (err) {
      console.error(err);
      setHistoryDialog({ open: true, asset, records: [], loading: false });
      toast('Failed to load history', 'error');
    }
  };

  const categories = {};
  assets.forEach(a => {
    const cat = a.category || 'Other';
    if (!categories[cat]) categories[cat] = { count: 0, available: 0 };
    categories[cat].count += a.quantity || 1;
    if (a.status === 'In Stock' || a.status === 'available') categories[cat].available += a.quantity || 1;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon sx={{ color: '#1976d2' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Asset Inventory</Typography>
          <Chip label={assets.length} size="small" sx={{ ml: 1, backgroundColor: '#1976d2', color: '#fff', borderRadius: '12px', height: '22px', fontSize: '0.7rem', fontWeight: 600 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <IconButton onClick={fetchData} sx={{ color: 'text.primary', border: { xs: '1px solid', sm: 'none' }, borderColor: 'divider', borderRadius: 1.5 }}><RefreshIcon /></IconButton>
          {hasPermission('asset_create') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setForm({ name: '', category: 'Spare Part', quantity: 0, status: 'In Stock' }); setOpenDialog(true); }}
            sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Add Item</Button>}
        </Box>
      </Box>

      {/* Category Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        {Object.entries(categories).map(([cat, data]) => (
          <Card key={cat} sx={{ p: 2 }}>
            <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>{cat.toUpperCase()}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{data.count}</Typography>
            <Typography sx={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>{data.available} available</Typography>
            <LinearProgress variant="determinate" value={data.count > 0 ? (data.available / data.count) * 100 : 0}
              sx={{ mt: 1, height: 4, borderRadius: 2, backgroundColor: '#2e2e38', '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' } }} />
          </Card>
        ))}
        {Object.keys(categories).length === 0 && !loading && (
          <Card sx={{ p: 3, gridColumn: '1 / -1', textAlign: 'center' }}>
            <Typography sx={{ color: 'text.primary' }}>No inventory items found. Add items or check backend.</Typography>
          </Card>
        )}
      </Box>

      {/* Table */}
      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 390, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Name', 'Category', 'Quantity', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((a, i) => (
                <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.name}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.category || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.quantity || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip label={(a.status || 'In Stock').toUpperCase()} size="small"
                      color={a.status === 'In Stock' || a.status === 'available' ? 'success' : a.status === 'Low Stock' ? 'warning' : 'default'}
                      sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, a)} sx={{ color: 'text.primary' }}><MoreVertIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{editItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
            <FormControl fullWidth size="small"><InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={e => setForm({ ...form, category: e.target.value })}>
                <MenuItem value="Spare Part">Spare Part</MenuItem><MenuItem value="Tool">Tool</MenuItem><MenuItem value="Consumable">Consumable</MenuItem><MenuItem value="Equipment">Equipment</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} fullWidth size="small" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2' }}>{editItem ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { bgcolor: 'background.paper', width: 200 } }}>
        {hasPermission('asset_update') && <MenuItem onClick={() => { setEditItem(menuAsset); setForm({ name: menuAsset?.name, category: menuAsset?.category || 'Spare Part', quantity: menuAsset?.quantity || 0, status: menuAsset?.status || 'In Stock' }); setOpenDialog(true); handleMenuClose(); }}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#60a5fa' }} /></ListItemIcon><ListItemText>Edit Info</ListItemText>
        </MenuItem>}
        {hasPermission('asset_assign') && <MenuItem onClick={() => { setAssignDialog({ open: true, asset: menuAsset, form: { assignedTo: '', assignmentDate: new Date().toISOString().split('T')[0], notes: '' } }); handleMenuClose(); }}>
          <ListItemIcon><AssignmentIndIcon fontSize="small" sx={{ color: '#10b981' }} /></ListItemIcon><ListItemText>Assign</ListItemText>
        </MenuItem>}
        {hasPermission('asset_assign') && <MenuItem onClick={() => { setReturnDialog({ open: true, asset: menuAsset, form: { returnDate: new Date().toISOString().split('T')[0], conditionOnReturn: 'Good', notes: '' } }); handleMenuClose(); }}>
          <ListItemIcon><KeyboardReturnIcon fontSize="small" sx={{ color: '#3b82f6' }} /></ListItemIcon><ListItemText>Return</ListItemText>
        </MenuItem>}
        {hasPermission('asset_history_view') && <MenuItem onClick={() => { openHistory(menuAsset); handleMenuClose(); }}>
          <ListItemIcon><HistoryIcon fontSize="small" sx={{ color: '#a855f7' }} /></ListItemIcon><ListItemText>History</ListItemText>
        </MenuItem>}
        <Divider sx={{ my: 0.5, borderColor: 'divider' }} />
        {hasPermission('asset_update') && <MenuItem onClick={() => { handleAction(`/assets/${menuAsset?.id || menuAsset?._id}/mark-damaged`, { damageDate: new Date().toISOString(), description: 'Marked damaged from UI' }); handleMenuClose(); }}>
          <ListItemIcon><ReportProblemIcon fontSize="small" sx={{ color: '#f59e0b' }} /></ListItemIcon><ListItemText>Mark Damaged</ListItemText>
        </MenuItem>}
        {hasPermission('asset_update') && <MenuItem onClick={() => { handleAction(`/assets/${menuAsset?.id || menuAsset?._id}/mark-lost`, { lossDate: new Date().toISOString(), description: 'Marked lost from UI' }); handleMenuClose(); }}>
          <ListItemIcon><WarningIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon><ListItemText>Mark Lost</ListItemText>
        </MenuItem>}
        <Divider sx={{ my: 0.5, borderColor: 'divider' }} />
        {hasPermission('asset_delete') && <MenuItem onClick={() => { handleDelete(menuAsset); handleMenuClose(); }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon><ListItemText sx={{ color: '#ef4444' }}>Delete</ListItemText>
        </MenuItem>}
      </Menu>

      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, asset: null, form: {} })} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Assign {assignDialog.asset?.name}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Assigned To (ID/Name)" value={assignDialog.form.assignedTo || ''} onChange={e => setAssignDialog(p => ({ ...p, form: { ...p.form, assignedTo: e.target.value } }))} fullWidth size="small" />
            <TextField label="Date" type="date" value={assignDialog.form.assignmentDate || ''} onChange={e => setAssignDialog(p => ({ ...p, form: { ...p.form, assignmentDate: e.target.value } }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={assignDialog.form.notes || ''} onChange={e => setAssignDialog(p => ({ ...p, form: { ...p.form, notes: e.target.value } }))} fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setAssignDialog({ open: false, asset: null, form: {} })} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={submitAssign} sx={{ backgroundColor: '#10b981' }}>Assign</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={returnDialog.open} onClose={() => setReturnDialog({ open: false, asset: null, form: {} })} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Return {returnDialog.asset?.name}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Date" type="date" value={returnDialog.form.returnDate || ''} onChange={e => setReturnDialog(p => ({ ...p, form: { ...p.form, returnDate: e.target.value } }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth size="small"><InputLabel>Condition</InputLabel>
              <Select value={returnDialog.form.conditionOnReturn || 'Good'} label="Condition" onChange={e => setReturnDialog(p => ({ ...p, form: { ...p.form, conditionOnReturn: e.target.value } }))}>
                <MenuItem value="Good">Good</MenuItem><MenuItem value="Fair">Fair</MenuItem><MenuItem value="Damaged">Damaged</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Notes" value={returnDialog.form.notes || ''} onChange={e => setReturnDialog(p => ({ ...p, form: { ...p.form, notes: e.target.value } }))} fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setReturnDialog({ open: false, asset: null, form: {} })} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={submitReturn} sx={{ backgroundColor: '#3b82f6' }}>Return</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, asset: null, records: [], loading: false })} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{historyDialog.asset?.name} - History</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 1, minHeight: 200 }}>
          {historyDialog.loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
            historyDialog.records.length > 0 ? (
              <List>
                {historyDialog.records.map((r, i) => (
                  <ListItem key={i} divider sx={{ borderColor: 'divider', px: 0 }}>
                    <ListItemText primary={r.action || r.type} secondary={<span style={{ color: '#a1a1aa' }}>{r.date ? new Date(r.date).toLocaleString() : '—'} • {r.notes || 'No notes'}</span>} sx={{ '& .MuiListItemText-primary': { color: 'text.primary', fontWeight: 600 } }} />
                  </ListItem>
                ))}
              </List>
            ) : <Typography sx={{ color: 'text.primary', mt: 2, textAlign: 'center' }}>No history records found.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setHistoryDialog({ open: false, asset: null, records: [], loading: false })} sx={{ color: 'text.primary' }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
