import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Grid, Card, CardContent,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip,
  Snackbar, Alert, Chip, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, TablePagination, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import * as XLSX from 'xlsx';

import { StatCard, ConfirmDialog, PageHeader } from '../components/Common';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const EXPENSE_CATEGORIES = ['Tolls', 'Food & Meals', 'Lodging', 'Maintenance', 'Supplies', 'Fines', 'Other'];



const EMPTY = { vehicleId: '', tripId: '', driverId: '', category: 'Tolls', amount: '', expenseDate: '', vendor: '', receiptNumber: '', notes: '' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ExpensesPage() {
  const { addNotification } = useNotification();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [processingId, setProcessingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setRows(items || []);
    } catch (err) { console.error(err); setRows([]); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    const totalCost = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const avgCost = rows.length ? (totalCost / rows.length).toFixed(2) : 0;
    const maxCost = rows.length ? Math.max(...rows.map(r => Number(r.amount || 0))) : 0;
    return { totalCost, avgCost, maxCost };
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.vehicle?.vehicleNumber || r.vehicleId || r.vehicle || '').toLowerCase().includes(q) || (r.vendor || '').toLowerCase().includes(q) || (r.receiptNumber || '').toLowerCase().includes(q);
    const matchCat = !filterCategory || r.category === filterCategory;
    const matchStart = !startDate || (r.expenseDate || r.date) >= startDate;
    const matchEnd = !endDate || (r.expenseDate || r.date) <= endDate;
    return matchQ && matchCat && matchStart && matchEnd;
  }), [rows, search, filterCategory, startDate, endDate]);

  const openAdd = () => { setEditRecord(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (r) => { 
    setEditRecord(r); 
    setForm({ 
      ...EMPTY, 
      vehicleId: r.vehicleId || r.vehicle || '', 
      tripId: r.tripId || '',
      driverId: r.driverId || '',
      category: r.category || 'Tolls',
      amount: r.amount || '',
      expenseDate: r.expenseDate ? r.expenseDate.split('T')[0] : (r.date || ''),
      vendor: r.vendor || '',
      receiptNumber: r.receiptNumber || '',
      notes: r.notes || ''
    }); 
    setErrors({}); setFormOpen(true); 
  };
  const closeForm = () => { setFormOpen(false); setEditRecord(null); };

  const handleFormChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
  };

  const validate = () => {
    const e = {};
    if (!form.vehicleId) e.vehicleId = 'Vehicle is required';
    if (!form.amount) e.amount = 'Amount is required';
    if (!form.expenseDate) e.expenseDate = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = {
        vehicleId: form.vehicleId,
        tripId: form.tripId || undefined,
        driverId: form.driverId || undefined,
        category: form.category,
        amount: parseFloat(form.amount) || 0,
        expenseDate: form.expenseDate ? new Date(form.expenseDate).toISOString() : new Date().toISOString(),
        vendor: form.vendor || undefined,
        receiptNumber: form.receiptNumber || undefined,
        notes: form.notes || undefined,
      };

      if (editRecord) { await api.patch(`/expenses/${editRecord.id || editRecord._id}`, payload); toast('Expense updated'); addNotification('Success', 'Expense updated successfully', 'success'); }
      else { await api.post('/expenses', payload); toast('Expense added'); addNotification('Success', 'Expense added successfully', 'success'); }
      closeForm(); fetchData();
    } catch (err) { 
      console.error(err); 
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error saving';
      toast(msg, 'error'); 
      addNotification('Error', msg, 'error');
    }
  };

  const handleDelete = async () => {
    try { 
        await api.delete(`/expenses/${deleteId}`); 
        setRows(prev => prev.filter(r => String(r.id || r._id) !== String(deleteId)));
        toast('Record deleted'); 
        addNotification('Deleted', 'Expense deleted successfully', 'warning');
        fetchData(); 
      setDeleteId(null); 
    }
    catch (err) { 
      console.error(err); 
      const errMsg = err.response?.data?.message || err.message;
      if (errMsg?.includes('Cannot transition')) {
        setRows(prev => prev.filter(r => String(r.id || r._id) !== String(deleteId)));
        toast('Record removed');
      } else {
        toast(errMsg || 'Error deleting', 'error'); 
        addNotification('Error', errMsg || 'Error deleting expense', 'error');
      }
      setDeleteId(null);
    }
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleWorkflow = async (id, action) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await api.post(`/expenses/${id}/${action}`);
      toast(`Expense ${action}d successfully`);
      addNotification('Success', `Expense ${action}d successfully`, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message?.includes('Cannot transition')) {
        toast(`Record is already in the requested state.`);
        await fetchData();
      } else {
        toast(`Error: ${err.response?.data?.message || err.message}`, 'error');
        addNotification('Error', `Failed to ${action} expense`, 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const exportToExcel = () => {
    const data = filtered.map(r => ({ Vehicle: r.vehicle?.vehicleNumber || r.vehicleId || r.vehicle, Category: r.category, Amount: r.amount, Date: r.expenseDate ? r.expenseDate.split('T')[0] : r.date, Vendor: r.vendor, 'Receipt No': r.receiptNumber, Notes: r.notes }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'expenses.xlsx');
  };

  const handlePrint = (record) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Expense ${record.id}</title><style>body{font-family:Arial;padding:30px;color:#333}table{width:100%;border-collapse:collapse}td{padding:10px;border-bottom:1px solid #eee}td:first-child{font-weight:600;width:40%;text-transform:uppercase;font-size:11px}.footer{margin-top:30px;text-align:center;font-size:11px;color:#aaa}</style></head><body><h2 style="color:#1acda3">Expense Details</h2><table><tr><td>Vehicle</td><td>${record.vehicle?.vehicleNumber || record.vehicleId || record.vehicle}</td></tr><tr><td>Category</td><td>${record.category}</td></tr><tr><td>Amount</td><td>₹${Number(record.amount).toLocaleString()}</td></tr><tr><td>Date</td><td>${fmtDate(record.expenseDate || record.date)}</td></tr><tr><td>Vendor</td><td>${record.vendor || '—'}</td></tr><tr><td>Receipt No</td><td>${record.receiptNumber || '—'}</td></tr></table>${record.notes ? `<p style="margin-top:15px;background:#f9f9f9;padding:12px;border-radius:6px"><b>Notes:</b> ${record.notes}</p>` : ''}<div class="footer">Printed on ${new Date().toLocaleDateString('en-IN')}</div></body></html>`);
    printWindow.document.close(); printWindow.focus(); printWindow.print();
  };

  const [page, setPage] = useState(0);

  const paged = filtered.slice(page * 10, (page + 1) * 10);

  return (
    <Box>
      <PageHeader 
        subicon={<ReceiptIcon/>}
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Export to Excel"><IconButton onClick={exportToExcel} sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}><FileDownloadIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 2 }}>Add Expense</Button>
          </Stack>
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="Total Spent" value={`₹${stats.totalCost.toLocaleString()}`} sub="All expenses" subColor="#ef4444" icon={<AttachMoneyIcon />} iconBg="#ef444420" iconColor="#ef4444" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Avg Expense" value={`₹${stats.avgCost}`} sub="Per record" subColor="#60a5fa" icon={<AccountBalanceWalletIcon />} iconBg="#1976d220" iconColor="#1976d2" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Highest Exp." value={`₹${stats.maxCost.toLocaleString()}`} sub="Max recorded" subColor="#f59e0b" icon={<SpeedIcon />} iconBg="#f59e0b20" iconColor="#f59e0b" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Total Records" value={rows.length} sub="All time" subColor="#10b981" icon={<ReceiptIcon />} iconBg="#10b98120" iconColor="#10b981" /></Grid>
      </Grid>

      <Card elevation={0} sx={{ mb: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField placeholder="Search vehicle, vendor…" value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.primary' }} /></InputAdornment> }} />
            <TextField select label="Category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} size="small" sx={{ minWidth: 140 }}>
              <MenuItem value="">All categories</MenuItem>
              {EXPENSE_CATEGORIES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Start date" type="date" size="small" sx={{ minWidth: 150 }} value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="End date" type="date" size="small" sx={{ minWidth: 150 }} value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['S.NO', 'Date', 'Vehicle', 'Category', 'Amount', 'Vendor', 'Receipt No', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r, i) => {
                const s = r.status || 'DRAFT';
                const c = s === 'APPROVED' ? 'success' : s === 'REJECTED' || s === 'CANCELLED' ? 'error' : s === 'SUBMITTED' ? 'warning' : 'default';
                const id = r.id || r._id;
                return (
                  <TableRow key={id} hover sx={{ '&:hover': { backgroundColor: '#1e1e2420' } }}>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{page * 10 + i + 1}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{fmtDate(r.expenseDate || r.date)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Stack direction="row" alignItems="center" spacing={1.2}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#1976d220', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2', flexShrink: 0 }}><ReceiptIcon sx={{ fontSize: 17 }} /></Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>{r.vehicle?.vehicleNumber || r.vehicleId || r.vehicle}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Chip label={r.category} size="small" sx={{ bgcolor: '#1976d220', color: '#60a5fa', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.amount ? `₹${Number(r.amount).toLocaleString()}` : '—'}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.vendor || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.receiptNumber || '—'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Chip label={s} size="small" color={c} sx={{ fontSize: '0.65rem', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View"><IconButton disabled={processingId === id} size="small" onClick={() => setViewRecord(r)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}><VisibilityOutlinedIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                        {s === 'DRAFT' && <Tooltip title="EditOutlined"><IconButton disabled={processingId === id} size="small" onClick={() => openEdit(r)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}><EditOutlinedIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>}
                        {s === 'DRAFT' && <Tooltip title="Submit"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'submit')} sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}><SendIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>}
                        {s === 'SUBMITTED' && <Tooltip title="Approve"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'approve')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}><CheckCircleOutlineIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>}
                        {s === 'SUBMITTED' && <Tooltip title="Reject"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'reject')} sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}><HighlightOffIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>}
                        {(s === 'DRAFT' || s === 'SUBMITTED') && <Tooltip title="Cancel"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'cancel')} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><CancelOutlinedIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>}
                        <Tooltip title="Delete"><IconButton disabled={processingId === id} size="small" onClick={() => setDeleteId(id)} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><DeleteOutlineIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paged.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No expenses found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
        {!loading && filtered.length > 10 && (
          <TablePagination
            component="div"
            count={filtered.length}
            rowsPerPage={10}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPageOptions={[10]}
            sx={{ color: 'text.primary', borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Card>

      {formOpen && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 600, height: { xs: '100%', sm: 'auto' }, maxHeight: { xs: '100%', sm: '90vh' }, overflow: 'auto', borderRadius: { xs: 0, sm: 2 }, bgcolor: 'background.paper', backgroundImage: 'none', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>{editRecord ? 'EditOutlined expense' : 'Add expense'}</Typography>
              <IconButton size="small" onClick={closeForm} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><CloseIcon sx={{ fontSize: 17 }}   /></IconButton>
            </Stack>
            <Box sx={{ pt: 1, px: 3, pb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Vehicle ID" name="vehicleId" value={form.vehicleId} onChange={handleFormChange} error={!!errors.vehicleId} helperText={errors.vehicleId} /></Grid>
                <Grid item xs={12} sm={6}><TextField select fullWidth label="Category" name="category" value={form.category} onChange={handleFormChange}>{EXPENSE_CATEGORIES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={handleFormChange} error={!!errors.amount} helperText={errors.amount} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Date" name="expenseDate" type="date" value={form.expenseDate} onChange={handleFormChange} InputLabelProps={{ shrink: true }} error={!!errors.expenseDate} helperText={errors.expenseDate} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Vendor" name="vendor" value={form.vendor} onChange={handleFormChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Receipt No" name="receiptNumber" value={form.receiptNumber} onChange={handleFormChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Trip ID" name="tripId" value={form.tripId} onChange={handleFormChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Driver ID" name="driverId" value={form.driverId} onChange={handleFormChange} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" name="notes" value={form.notes} onChange={handleFormChange} /></Grid>
              </Grid>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <Button onClick={closeForm} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: '#3a3a42' }}>Cancel</Button>
              <Button onClick={handleSave} variant="contained" size="small">{editRecord ? 'Update' : 'Add expense'}</Button>
            </Stack>
          </Card>
        </Box>
      )}

      {viewRecord && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 500, height: { xs: '100%', sm: 'auto' }, maxHeight: { xs: '100%', sm: '90vh' }, overflow: 'auto', borderRadius: { xs: 0, sm: 2 }, bgcolor: 'background.paper', backgroundImage: 'none', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReceiptIcon sx={{ color: '#10b981', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>Expense Details</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Print"><IconButton size="small" onClick={() => handlePrint(viewRecord)} sx={{ bgcolor: '#64748b15', color: '#64748b', '&:hover': { bgcolor: '#64748b30' } }}><PrintIcon sx={{ fontSize: 17 }}  /></IconButton></Tooltip>
                <IconButton size="small" onClick={() => setViewRecord(null)} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><CloseIcon sx={{ fontSize: 17 }}   /></IconButton>
              </Stack>
            </Stack>
            <Box sx={{ pt: 1, px: 3, pb: 3 }}>
              <Grid container spacing={2.5}>
                {[['Vehicle', viewRecord.vehicle?.vehicleNumber || viewRecord.vehicleId || viewRecord.vehicle], ['Category', viewRecord.category], ['Amount', viewRecord.amount ? `₹${Number(viewRecord.amount).toLocaleString()}` : '—'], ['Date', fmtDate(viewRecord.expenseDate || viewRecord.date)], ['Vendor', viewRecord.vendor || '—'], ['Receipt No', viewRecord.receiptNumber || '—'], ['Trip ID', viewRecord.tripId || '—'], ['Driver ID', viewRecord.driverId || '—'], ['Status', viewRecord.status || 'DRAFT']].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', color: 'text.primary' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25, color: 'text.primary' }}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end" sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <Button onClick={() => setViewRecord(null)} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: '#3a3a42' }}>Close</Button>
            </Stack>
          </Card>
        </Box>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete expense" message="This action cannot be undone. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
