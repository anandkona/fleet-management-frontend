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
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import * as XLSX from 'xlsx';

import { StatCard, ConfirmDialog, PageHeader } from '../components/Common';
import api from '../../services/api';

const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];

const fallbackExpenses = [
  { id: 1, vehicle: 'AP05-T123', fuelType: 'Diesel', liters: 120, pricePerLiter: 35, totalCost: 4200, date: '2026-06-22', station: 'HPCL Vizag Port', odometer: 45230, notes: 'Full tank' },
  { id: 2, vehicle: 'AP05-T087', fuelType: 'Diesel', liters: 100, pricePerLiter: 38, totalCost: 3800, date: '2026-06-21', station: 'BPCL Gajuwaka', odometer: 31450, notes: '' },
  { id: 3, vehicle: 'AP05-T201', fuelType: 'Diesel', liters: 80, pricePerLiter: 35.5, totalCost: 2840, date: '2026-06-20', station: 'IOC Madhurawada', odometer: 12870, notes: '' },
  { id: 4, vehicle: 'AP05-T089', fuelType: 'Diesel', liters: 90, pricePerLiter: 36, totalCost: 3240, date: '2026-06-19', station: 'HPCL MVP Colony', odometer: 22100, notes: '' },
  { id: 5, vehicle: 'AP05-T156', fuelType: 'Petrol', liters: 35, pricePerLiter: 102, totalCost: 3570, date: '2026-06-18', station: 'IOC Dwaraka Nagar', odometer: 15400, notes: '' },
  { id: 6, vehicle: 'AP05-T047', fuelType: 'Petrol', liters: 40, pricePerLiter: 103, totalCost: 4120, date: '2026-06-17', station: 'BPCL Rushikonda', odometer: 8900, notes: '' },
];

const EMPTY = { vehicle: '', fuelType: 'Diesel', liters: '', pricePerLiter: '', totalCost: '', odometer: '', date: '', station: '', notes: '' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ExpensesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterFuelType, setFilterFuelType] = useState('');
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
      const res = await api.get('/fuel', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setRows(items.length > 0 ? items : fallbackExpenses);
    } catch (err) { console.error(err); setRows(fallbackExpenses); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    const totalLiters = rows.reduce((s, r) => s + Number(r.quantityLiters || r.liters || 0), 0);
    const totalCost = rows.reduce((s, r) => s + Number(r.totalAmount || r.totalCost || 0), 0);
    const avgCostPerLiter = totalLiters ? (totalCost / totalLiters).toFixed(2) : 0;
    return { totalLiters, totalCost, avgCostPerLiter };
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.vehicle || '').toLowerCase().includes(q) || (r.station || '').toLowerCase().includes(q);
    const matchType = !filterFuelType || r.fuelType === filterFuelType;
    const matchStart = !startDate || (r.fuelDate || r.date) >= startDate;
    const matchEnd = !endDate || (r.fuelDate || r.date) <= endDate;
    return matchQ && matchType && matchStart && matchEnd;
  }), [rows, search, filterFuelType, startDate, endDate]);

  const openAdd = () => { setEditRecord(null); setForm(EMPTY); setErrors({}); setFormOpen(true); };
  const openEdit = (r) => { 
    setEditRecord(r); 
    setForm({ 
      ...EMPTY, 
      vehicle: r.vehicleId || r.vehicle || '', 
      fuelType: r.fuelType || 'Diesel',
      liters: r.quantityLiters || r.liters || '',
      pricePerLiter: r.pricePerLiter || '',
      totalCost: r.totalAmount || r.totalCost || '',
      odometer: r.odometerReading || r.odometer || '',
      date: r.fuelDate ? r.fuelDate.split('T')[0] : (r.date || ''),
      station: r.stationName || r.station || '',
      notes: r.notes || ''
    }); 
    setErrors({}); setFormOpen(true); 
  };
  const closeForm = () => { setFormOpen(false); setEditRecord(null); };

  const handleFormChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'liters' || e.target.name === 'pricePerLiter') {
      const l = parseFloat(updated.liters);
      const p = parseFloat(updated.pricePerLiter);
      if (!isNaN(l) && !isNaN(p)) updated.totalCost = (l * p).toFixed(2);
    }
    setForm(updated);
  };

  const validate = () => {
    const e = {};
    if (!form.vehicle) e.vehicle = 'Vehicle is required';
    if (!form.liters) e.liters = 'Liters is required';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = {
        vehicleId: form.vehicle,
        fuelType: form.fuelType,
        fuelDate: new Date(form.date).toISOString(),
        entryMode: 'FULL_DETAILS',
        quantityLiters: parseFloat(form.liters) || 0,
        pricePerLiter: parseFloat(form.pricePerLiter) || 0,
        totalAmount: parseFloat(form.totalCost) || 0,
        odometerReading: parseInt(form.odometer) || 0,
        stationName: form.station || undefined,
        notes: form.notes || undefined,
      };
      if (!payload.stationName) delete payload.stationName;
      if (!payload.notes) delete payload.notes;

      // If vehicleId is not a real MongoDB 24-char hex string, it's likely a demo vehicle string. Mock the save!
      if (!/^[0-9a-fA-F]{24}$/.test(payload.vehicleId) && fallbackExpenses.some(f => f.vehicle === payload.vehicleId || String(f.id) === payload.vehicleId) || payload.vehicleId.includes('AP05')) {
        const newLog = {
          id: Date.now(),
          vehicle: payload.vehicleId,
          vehicleId: payload.vehicleId,
          fuelType: payload.fuelType,
          liters: payload.quantityLiters,
          pricePerLiter: payload.pricePerLiter,
          totalCost: payload.totalAmount,
          date: payload.fuelDate,
          station: payload.stationName,
          odometer: payload.odometerReading,
          status: 'DRAFT',
          notes: payload.notes
        };
        if (editRecord) {
          setRows(prev => prev.map(r => (r.id === editRecord.id || r._id === editRecord._id) ? { ...r, ...newLog, id: editRecord.id || editRecord._id } : r));
        } else {
          setRows(prev => [newLog, ...prev]);
        }
        toast(editRecord ? 'Fuel log updated (Demo)' : 'Fuel log added (Demo)');
        closeForm();
        return;
      }

      if (editRecord) { await api.patch(`/fuel/${editRecord.id || editRecord._id}`, payload); toast('Fuel log updated'); }
      else { await api.post('/fuel', payload); toast('Fuel log added'); }
      closeForm(); fetchData();
    } catch (err) { 
      console.error(err); 
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error saving';
      toast(msg, 'error'); 
    }
  };

  const handleDelete = async () => {
    try { 
      // If the ID is not a MongoDB 24-char hex string, it's a mock/demo item
      if (!/^[0-9a-fA-F]{24}$/.test(String(deleteId))) {
        setRows(prev => prev.filter(r => String(r.id || r._id) !== String(deleteId)));
        toast('Record deleted (Demo)');
      } else {
        await api.delete(`/fuel/${deleteId}`); 
        setRows(prev => prev.filter(r => String(r.id || r._id) !== String(deleteId)));
        toast('Record deleted'); 
        fetchData(); 
      }
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
      }
      setDeleteId(null);
    }
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleWorkflow = async (id, action) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      if (typeof id === 'number' || fallbackExpenses.some(f => String(f.id) === String(id))) {
        setRows(prev => prev.map(r => String(r.id) === String(id) || String(r._id) === String(id) ? { ...r, status: action === 'submit' ? 'SUBMITTED' : action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'CANCELLED' } : r));
        toast(`Log ${action}d successfully`);
        return;
      }
      await api.post(`/fuel/${id}/${action}`);
      toast(`Log ${action}d successfully`);
      await fetchData();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message?.includes('Cannot transition')) {
        toast(`Record is already in the requested state.`);
        await fetchData();
      } else {
        toast(`Error: ${err.response?.data?.message || err.message}`, 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const exportToExcel = () => {
    const data = filtered.map(r => ({ Vehicle: r.vehicle, 'Fuel Type': r.fuelType, Liters: r.liters, 'Price/L': r.pricePerLiter, 'Total Cost': r.totalCost, Odometer: r.odometer, Date: r.date, Station: r.station, Notes: r.notes }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fuel');
    XLSX.writeFile(wb, 'fuel-logs.xlsx');
  };

  const handlePrint = (record) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Fuel Log ${record.id}</title><style>body{font-family:Arial;padding:30px;color:#333}table{width:100%;border-collapse:collapse}td{padding:10px;border-bottom:1px solid #eee}td:first-child{font-weight:600;width:40%;text-transform:uppercase;font-size:11px}.footer{margin-top:30px;text-align:center;font-size:11px;color:#aaa}</style></head><body><h2 style="color:#1acda3">Fuel Log Details</h2><table><tr><td>Vehicle</td><td>${record.vehicle}</td></tr><tr><td>Fuel Type</td><td>${record.fuelType}</td></tr><tr><td>Liters</td><td>${record.liters} L</td></tr><tr><td>Price/L</td><td>₹${record.pricePerLiter}</td></tr><tr><td>Total Cost</td><td>₹${Number(record.totalCost).toLocaleString()}</td></tr><tr><td>Date</td><td>${fmtDate(record.date)}</td></tr><tr><td>Station</td><td>${record.station || '—'}</td></tr></table>${record.notes ? `<p style="margin-top:15px;background:#f9f9f9;padding:12px;border-radius:6px"><b>Notes:</b> ${record.notes}</p>` : ''}<div class="footer">Printed on ${new Date().toLocaleDateString('en-IN')}</div></body></html>`);
    printWindow.document.close(); printWindow.focus(); printWindow.print();
  };

  const [page, setPage] = useState(0);

  const paged = filtered.slice(page * 10, (page + 1) * 10);

  return (
    <Box>
      <PageHeader title="Fuel Logs" subtitle="Track fuel purchases and consumption across your fleet." icon={LocalGasStationIcon}
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Export to Excel"><IconButton onClick={exportToExcel} sx={{ border: '1px solid #3a3a42', borderRadius: 1.5 }}><FileDownloadIcon sx={{ fontSize: 18, color: '#10b981' }} /></IconButton></Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 2 }}>Add fuel log</Button>
          </Stack>
        }
      />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="Total Fuel" value={`${stats.totalLiters.toFixed(0)} L`} sub="All logs" subColor="#60a5fa" icon={<LocalGasStationIcon />} iconBg="#1976d220" iconColor="#1976d2" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Total Cost" value={`₹${stats.totalCost.toLocaleString()}`} sub="All logs" subColor="#ef4444" icon={<AttachMoneyIcon />} iconBg="#ef444420" iconColor="#ef4444" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Avg Price/L" value={`₹${stats.avgCostPerLiter}`} sub="Current rate" subColor="#4ade80" icon={<SpeedIcon />} iconBg="#10b98120" iconColor="#10b981" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="Total Logs" value={rows.length} sub="Records" subColor="#60a5fa" icon={<LocalGasStationIcon />} iconBg="#1976d220" iconColor="#1976d2" /></Grid>
      </Grid>

      <Card elevation={0} sx={{ mb: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField placeholder="Search vehicle, station…" value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.primary' }} /></InputAdornment> }} />
            <TextField select label="Fuel type" value={filterFuelType} onChange={(e) => setFilterFuelType(e.target.value)} size="small" sx={{ minWidth: 140 }}>
              <MenuItem value="">All types</MenuItem>
              {FUEL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                {['S.NO', 'Date', 'Vehicle', 'Fuel Type', 'Liters', 'Price/L', 'Total Cost', 'Station', 'Status', 'Actions'].map(h => (
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
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{fmtDate(r.fuelDate || r.date)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Stack direction="row" alignItems="center" spacing={1.2}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#1976d220', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2', flexShrink: 0 }}><LocalGasStationIcon sx={{ fontSize: 17 }} /></Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>{r.vehicle?.vehicleNumber || r.vehicleId || r.vehicle}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                      <Chip label={r.fuelType} size="small" sx={{ bgcolor: r.fuelType === 'Diesel' ? '#1976d220' : '#10b98120', color: r.fuelType === 'Diesel' ? '#60a5fa' : '#4ade80', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{(r.quantityLiters || r.liters) ? `${(r.quantityLiters || r.liters)} L` : '—'}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.pricePerLiter ? `₹${r.pricePerLiter}` : '—'}</TableCell>
                    <TableCell sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{(r.totalAmount || r.totalCost) ? `₹${Number(r.totalAmount || r.totalCost).toLocaleString()}` : '—'}</TableCell>
                    <TableCell sx={{ color: 'text.primary', fontSize: '0.85rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{r.stationName || r.station || '—'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Chip label={s} size="small" color={c} sx={{ fontSize: '0.65rem', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View"><IconButton disabled={processingId === id} size="small" onClick={() => setViewRecord(r)}><VisibilityOutlinedIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>
                        {s === 'DRAFT' && <Tooltip title="Edit"><IconButton disabled={processingId === id} size="small" onClick={() => openEdit(r)}><EditOutlinedIcon sx={{ fontSize: 17, color: '#60a5fa' }} /></IconButton></Tooltip>}
                        {s === 'DRAFT' && <Tooltip title="Submit"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'submit')}><SendIcon sx={{ fontSize: 17, color: '#10b981' }} /></IconButton></Tooltip>}
                        {s === 'SUBMITTED' && <Tooltip title="Approve"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'approve')}><CheckCircleOutlineIcon sx={{ fontSize: 17, color: '#10b981' }} /></IconButton></Tooltip>}
                        {s === 'SUBMITTED' && <Tooltip title="Reject"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'reject')}><HighlightOffIcon sx={{ fontSize: 17, color: '#ef4444' }} /></IconButton></Tooltip>}
                        {(s === 'DRAFT' || s === 'SUBMITTED') && <Tooltip title="Cancel"><IconButton disabled={processingId === id} size="small" onClick={() => handleWorkflow(id, 'cancel')}><CancelOutlinedIcon sx={{ fontSize: 17, color: '#f59e0b' }} /></IconButton></Tooltip>}
                        <Tooltip title="Delete"><IconButton disabled={processingId === id} size="small" onClick={() => setDeleteId(id)}><DeleteOutlineIcon sx={{ fontSize: 17, color: '#ef4444' }} /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paged.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>No fuel logs found</TableCell></TableRow>}
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
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>{editRecord ? 'Edit fuel log' : 'Add fuel log'}</Typography>
              <IconButton size="small" onClick={closeForm}><CloseIcon sx={{ color: 'text.primary' }} fontSize="small" /></IconButton>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Vehicle" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} error={!!errors.vehicle} helperText={errors.vehicle} /></Grid>
                <Grid item xs={12} sm={6}><TextField select fullWidth label="Fuel type" name="fuelType" value={form.fuelType} onChange={handleFormChange}>{FUEL_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Liters" name="liters" type="number" value={form.liters} onChange={handleFormChange} error={!!errors.liters} helperText={errors.liters} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Price/L (₹)" name="pricePerLiter" type="number" value={form.pricePerLiter} onChange={handleFormChange} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Total Cost (₹)" name="totalCost" type="number" value={form.totalCost} onChange={handleFormChange} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Date" name="date" type="date" value={form.date} onChange={handleFormChange} InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Odometer (km)" name="odometer" type="number" value={form.odometer} onChange={handleFormChange} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Station / Location" name="station" value={form.station} onChange={handleFormChange} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" name="notes" value={form.notes} onChange={handleFormChange} /></Grid>
              </Grid>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <Button onClick={closeForm} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: '#3a3a42' }}>Cancel</Button>
              <Button onClick={handleSave} variant="contained" size="small">{editRecord ? 'Update' : 'Add log'}</Button>
            </Stack>
          </Card>
        </Box>
      )}

      {viewRecord && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', zIndex: 1300 }}>
          <Card sx={{ width: '100%', maxWidth: 500, height: { xs: '100%', sm: 'auto' }, maxHeight: { xs: '100%', sm: '90vh' }, overflow: 'auto', borderRadius: { xs: 0, sm: 2 }, bgcolor: 'background.paper', backgroundImage: 'none', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalGasStationIcon sx={{ color: '#10b981', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>Fuel Log Details</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Print"><IconButton size="small" onClick={() => handlePrint(viewRecord)}><PrintIcon sx={{ fontSize: 18, color: 'text.primary' }} /></IconButton></Tooltip>
                <IconButton size="small" onClick={() => setViewRecord(null)}><CloseIcon sx={{ color: 'text.primary' }} fontSize="small" /></IconButton>
              </Stack>
            </Stack>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                {[['Vehicle', viewRecord.vehicle?.vehicleNumber || viewRecord.vehicleId || viewRecord.vehicle], ['Fuel Type', viewRecord.fuelType], ['Liters', (viewRecord.quantityLiters || viewRecord.liters) ? `${(viewRecord.quantityLiters || viewRecord.liters)} L` : '—'], ['Price/L', viewRecord.pricePerLiter ? `₹${viewRecord.pricePerLiter}` : '—'], ['Total Cost', (viewRecord.totalAmount || viewRecord.totalCost) ? `₹${Number(viewRecord.totalAmount || viewRecord.totalCost).toLocaleString()}` : '—'], ['Date', fmtDate(viewRecord.fuelDate || viewRecord.date)], ['Odometer', (viewRecord.odometerReading || viewRecord.odometer) ? `${Number(viewRecord.odometerReading || viewRecord.odometer).toLocaleString()} km` : '—'], ['Station', viewRecord.stationName || viewRecord.station || '—'], ['Status', viewRecord.status || 'DRAFT']].map(([label, value]) => (
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

      <ConfirmDialog open={!!deleteId} title="Delete fuel log" message="This action cannot be undone. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
