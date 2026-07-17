import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, LinearProgress, useTheme, useMediaQuery, Tabs, Tab
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import HistoryIcon from '@mui/icons-material/History';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningIcon from '@mui/icons-material/Warning';
import { Menu, ListItemIcon, ListItemText, Snackbar, Alert, List, ListItem, Divider, Stack, Tooltip } from '@mui/material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function InventoryPage() {
  const { addNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(() => {
    return new URLSearchParams(location.search).get('tab') === 'categories' ? 1 : 0;
  });

  useEffect(() => {
    if (new URLSearchParams(location.search).get('tab') === 'categories') {
      setTabValue(1);
    } else {
      setTabValue(0);
    }
  }, [location.search]);

  const handleTabChange = (e, nv) => {
    setTabValue(nv);
    if (nv === 1) {
      navigate('/inventory?tab=categories', { replace: true });
    } else {
      navigate('/inventory', { replace: true });
    }
  };

  const [assets, setAssets] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  const [loading, setLoading] = useState(true);

  // Asset UI States
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ assetCode: '', name: '', assetCategoryId: '', serialNumber: '', purchaseDate: '', purchaseAmount: 0, currentStatus: 'AVAILABLE', notes: '' });

  // Category UI States
  const [catOpenDialog, setCatOpenDialog] = useState(false);
  const [editCatItem, setEditCatItem] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', key: '', description: '', status: 'ACTIVE' });

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
      const [assetsRes, catsRes] = await Promise.allSettled([
        api.get('/assets', { params: { limit: 100 } }),
        api.get('/assets/categories')
      ]);

      if (assetsRes.status === 'fulfilled') {
        const items = assetsRes.value.data?.data?.items ?? (Array.isArray(assetsRes.value.data?.data) ? assetsRes.value.data.data : []);
        setAssets(items);
      } else {
        setAssets([]);
      }

      if (catsRes.status === 'fulfilled') {
        const cats = catsRes.value.data?.data ?? [];
        setCategoriesList(cats);
      } else {
        setCategoriesList([]);
      }
    } catch (err) {
      console.error(err);
      setAssets([]);
      setCategoriesList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Asset Actions
  const handleSave = async () => {
    try {
      if (editItem) { await api.patch(`/assets/${editItem.id || editItem._id}`, form); }
      else { await api.post('/assets', form); }
      toast('Asset saved successfully');
      addNotification('Success', `Asset ${editItem ? 'updated' : 'created'} successfully`, 'success');
      setOpenDialog(false); setEditItem(null); fetchData();
    } catch (err) {
      console.error(err);
      toast('Failed to save asset', 'error');
      addNotification('Error', 'Failed to save asset', 'error');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await api.delete(`/assets/${item.id || item._id}`);
      addNotification('Deleted', `Asset deleted successfully`, 'warning');
      fetchData();
    } catch (err) {
      console.error(err);
      toast('Failed to delete asset', 'error');
    }
  };

  // Category Actions
  const handleCatSave = async () => {
    try {
      if (editCatItem) { await api.patch(`/assets/categories/${editCatItem.id || editCatItem._id}`, catForm); }
      else { await api.post('/assets/categories', catForm); }
      toast('Category saved successfully');
      addNotification('Success', `Category ${editCatItem ? 'updated' : 'created'} successfully`, 'success');
      setCatOpenDialog(false); setEditCatItem(null); fetchData();
    } catch (err) {
      console.error(err);
      toast('Failed to save category', 'error');
      addNotification('Error', 'Failed to save category', 'error');
    }
  };

  const handleCatDelete = async (cat) => {
    if (!window.confirm(`Delete category ${cat.name}?`)) return;
    try {
      await api.delete(`/assets/categories/${cat.id || cat._id}`);
      addNotification('Deleted', `Category deleted successfully`, 'warning');
      fetchData();
    } catch (err) {
      console.error(err);
      toast('Failed to delete category', 'error');
    }
  };

  const handleAction = async (actionPath, payload) => {
    try {
      await api.post(actionPath, payload);
      toast('Action successful');
      addNotification('Success', 'Inventory action successful', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      toast(`Failed: ${err.response?.data?.message || err.message}`, 'error');
      addNotification('Error', 'Failed to perform inventory action', 'error');
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

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          {tabValue === 0 && hasPermission('asset_create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setForm({ assetCode: '', name: '', assetCategoryId: categoriesList[0]?.id || '', serialNumber: '', purchaseDate: new Date().toISOString().split('T')[0], purchaseAmount: 0, currentStatus: 'AVAILABLE', notes: '' }); setOpenDialog(true); }}
              sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Add Asset</Button>
          )}
          {tabValue === 1 && hasPermission('asset_create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditCatItem(null); setCatForm({ name: '', key: '', description: '', status: 'ACTIVE' }); setCatOpenDialog(true); }}
              sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Add Category</Button>
          )}
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 600 } }}>
          <Tab label="Assets" />
          <Tab label="Categories" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          {/* Category Cards */}
          {/* <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
            {categoriesList.map((cat) => (
              <Card key={cat.id || cat._id} sx={{ p: 2 }}>
                <Typography sx={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 700 }}>{cat.name.toUpperCase()}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{cat._count?.assets || 0}</Typography>
                <Typography sx={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>Total items</Typography>
                <LinearProgress variant="determinate" value={100}
                  sx={{ mt: 1, height: 4, borderRadius: 2, backgroundColor: '#2e2e38', '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' } }} />
              </Card>
            ))}
            {categoriesList.length === 0 && !loading && (
              <Card sx={{ p: 3, gridColumn: '1 / -1', textAlign: 'center' }}>
                <Typography sx={{ color: 'text.primary' }}>No categories found from backend.</Typography>
              </Card>
            )}
          </Box> */}

          {/* Table */}
          <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
            {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['S.NO', 'Code', 'Name', 'Category', 'Serial', 'Purchased Amount', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((a, i) => (
                    <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{i + 1}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.assetCode || '—'}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.name}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.assetCategory?.name || '—'}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.serialNumber || '—'}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{a.purchaseAmount != null ? `$${a.purchaseAmount}` : '—'}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Chip label={(a.currentStatus || 'AVAILABLE').toUpperCase()} size="small"
                          color={a.currentStatus === 'AVAILABLE' ? 'success' : a.currentStatus === 'ASSIGNED' ? 'info' : a.currentStatus === 'UNDER_REPAIR' || a.currentStatus === 'DAMAGED' ? 'warning' : 'error'}
                          sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, a)} sx={{ color: 'text.primary' }}><MoreVertIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {assets.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.primary' }}>No assets found</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </Card>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
            {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Name', 'Key', 'Description', 'Assets', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoriesList.map((c, i) => (
                    <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider' }}>{c.name}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider' }}>{c.key}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider' }}>{c.description || '—'}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{c._count?.assets || 0}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Chip label={(c.status || 'ACTIVE').toUpperCase()} size="small"
                          color={c.status === 'ACTIVE' ? 'success' : 'default'}
                          sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" spacing={0.5}>
                          {hasPermission('asset_update') && (
                            <Tooltip title="EditOutlined Category">
                              <IconButton size="small" onClick={() => { setEditCatItem(c); setCatForm({ name: c.name, key: c.key, description: c.description || '', status: c.status || 'ACTIVE' }); setCatOpenDialog(true); }}>
                                <EditOutlinedIcon fontSize="small" sx={{ color: '#60a5fa' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {hasPermission('asset_delete') && (
                            <Tooltip title="Delete Category">
                              <IconButton size="small" onClick={() => handleCatDelete(c)}>
                                <DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categoriesList.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.primary' }}>No categories found</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </Card>
        </Box>
      )}

      {/* Asset Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{editItem ? 'EditOutlined Asset' : 'Add Asset'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField label="Asset Code" value={form.assetCode} onChange={e => setForm({ ...form, assetCode: e.target.value })} fullWidth size="small" />
            <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
            <FormControl fullWidth size="small"><InputLabel>Category</InputLabel>
              <Select value={form.assetCategoryId} label="Category" onChange={e => setForm({ ...form, assetCategoryId: e.target.value })}>
                {categoriesList.map(cat => (
                  <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Serial Number" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} fullWidth size="small" />
            <TextField label="Purchase Date" type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Purchase Amount" type="number" value={form.purchaseAmount} onChange={e => setForm({ ...form, purchaseAmount: Number(e.target.value) })} fullWidth size="small" />
            <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
              <Select value={form.currentStatus} label="Status" onChange={e => setForm({ ...form, currentStatus: e.target.value })}>
                <MenuItem value="AVAILABLE">AVAILABLE</MenuItem>
                <MenuItem value="ASSIGNED">ASSIGNED</MenuItem>
                <MenuItem value="DAMAGED">DAMAGED</MenuItem>
                <MenuItem value="UNDER_REPAIR">UNDER_REPAIR</MenuItem>
                <MenuItem value="RETIRED">RETIRED</MenuItem>
                <MenuItem value="LOST">LOST</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2' }}>{editItem ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catOpenDialog} onClose={() => setCatOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>{editCatItem ? 'EditOutlined Category' : 'Add Category'}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField label="Name" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} fullWidth size="small" />
            <TextField label="Key (e.g. tools_equipment)" value={catForm.key} onChange={e => setCatForm({ ...catForm, key: e.target.value })} fullWidth size="small" />
            <TextField label="Description" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} fullWidth size="small" multiline rows={2} />
            <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
              <Select value={catForm.status} label="Status" onChange={e => setCatForm({ ...catForm, status: e.target.value })}>
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setCatOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCatSave} sx={{ backgroundColor: '#1976d2' }}>{editCatItem ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { bgcolor: 'background.paper', width: 200 } }}>
        {hasPermission('asset_update') && <MenuItem onClick={() => { setEditItem(menuAsset); setForm({ assetCode: menuAsset?.assetCode || '', name: menuAsset?.name || '', assetCategoryId: menuAsset?.assetCategoryId || '', serialNumber: menuAsset?.serialNumber || '', purchaseDate: menuAsset?.purchaseDate ? new Date(menuAsset.purchaseDate).toISOString().split('T')[0] : '', purchaseAmount: menuAsset?.purchaseAmount || 0, currentStatus: menuAsset?.currentStatus || 'AVAILABLE', notes: menuAsset?.notes || '' }); setOpenDialog(true); handleMenuClose(); }}>
          <ListItemIcon><EditOutlinedIcon fontSize="small" sx={{ color: '#60a5fa' }} /></ListItemIcon><ListItemText>EditOutlined Info</ListItemText>
        </MenuItem>}
        {hasPermission('asset_assign') && <MenuItem onClick={() => { setAssignDialog({ open: true, asset: menuAsset, form: { assignedToType: 'DRIVER', assignedToId: '', notes: '' } }); handleMenuClose(); }}>
          <ListItemIcon><AssignmentIndIcon fontSize="small" sx={{ color: '#10b981' }} /></ListItemIcon><ListItemText>Assign</ListItemText>
        </MenuItem>}
        {hasPermission('asset_assign') && <MenuItem onClick={() => { setReturnDialog({ open: true, asset: menuAsset, form: { notes: '', proofUrl: '' } }); handleMenuClose(); }}>
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
          <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon><ListItemText sx={{ color: '#ef4444' }}>Delete</ListItemText>
        </MenuItem>}
      </Menu>

      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, asset: null, form: {} })} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Assign {assignDialog.asset?.name}</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small"><InputLabel>Assign To Type</InputLabel>
              <Select value={assignDialog.form.assignedToType || 'DRIVER'} label="Assign To Type" onChange={e => setAssignDialog(p => ({ ...p, form: { ...p.form, assignedToType: e.target.value } }))}>
                <MenuItem value="VEHICLE">VEHICLE</MenuItem>
                <MenuItem value="DRIVER">DRIVER</MenuItem>
                <MenuItem value="USER">USER</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Assigned To ID" value={assignDialog.form.assignedToId || ''} onChange={e => setAssignDialog(p => ({ ...p, form: { ...p.form, assignedToId: e.target.value } }))} fullWidth size="small" />
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
            <TextField label="Notes" value={returnDialog.form.notes || ''} onChange={e => setReturnDialog(p => ({ ...p, form: { ...p.form, notes: e.target.value } }))} fullWidth size="small" multiline rows={2} />
            <TextField label="Proof URL (Optional)" value={returnDialog.form.proofUrl || ''} onChange={e => setReturnDialog(p => ({ ...p, form: { ...p.form, proofUrl: e.target.value } }))} fullWidth size="small" />
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
