import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Grid, Card, CardContent,
  TextField, MenuItem, InputAdornment, IconButton, Tooltip,
  Snackbar, Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BuildIcon from '@mui/icons-material/Build';
import LoopIcon from '@mui/icons-material/Loop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';

import StatCard from '../components/StatCard';
import StatusChip from '../components/StatusChip';
import { PageHeader } from '../components/Common';
import RepairFormDialog from '../components/RepairFormDialog';
import RepairViewDialog from '../components/RepairViewDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { MOCK_REPAIRS, REPAIR_TYPES, REPAIR_STATUSES } from '../services/mockData';

export default function RepairsPage() {
  const [rows, setRows]             = useState(MOCK_REPAIRS);
  const [search, setSearch]         = useState('');
  const [filterStatus, setStatus]   = useState('');
  const [filterType, setType]       = useState('');
  const [formOpen, setFormOpen]     = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [snack, setSnack]           = useState({ open: false, msg: '', severity: 'success' });

  // ── Stats ────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     rows.length,
    pending:   rows.filter(r => r.status === 'Pending').length,
    inProgress:rows.filter(r => r.status === 'In Progress').length,
    completed: rows.filter(r => r.status === 'Complete').length,
    totalCost: rows.reduce((s, r) => s + Number(r.cost), 0),
  }), [rows]);

  // ── Filtered rows ────────────────────────────────────
  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.vehicle.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    return matchQ && (!filterStatus || r.status === filterStatus) && (!filterType || r.type === filterType);
  }), [rows, search, filterStatus, filterType]);

  // ── CRUD ─────────────────────────────────────────────
  const handleSave = (data) => {
    if (editRecord) {
      setRows(prev => prev.map(r => r.id === editRecord.id ? { ...data, id: editRecord.id } : r));
      toast('Repair record updated');
    } else {
      const newId = `R-${1000 + rows.length + 1}`;
      setRows(prev => [{ ...data, id: newId }, ...prev]);
      toast('Repair record added');
    }
    setFormOpen(false);
    setEditRecord(null);
  };

  const handleDelete = () => {
    setRows(prev => prev.filter(r => r.id !== deleteId));
    setDeleteId(null);
    toast('Record deleted', 'error');
  };

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const exportToExcel = () => {
    const data = filtered.map(r => ({
      'Repair ID': r.id,
      'Vehicle Number': r.vehicle,
      'Model Name': r.model,
      'Vehicle Type': r.vehicleType,
      'Job Type': r.type,
      'Vendor': r.vendor,
      'Date': r.date,
      'Cost': r.cost,
      'Status': r.status,
      'Notes': r.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Repairs');
    XLSX.writeFile(wb, 'repairs.xlsx');
  };

  // ── Columns ──────────────────────────────────────────
  const columns = [
    {
      field: 'vehicle', headerName: 'Vehicle Number', flex: 1, minWidth: 150,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 17 }} />
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary' }}>{row.vehicle}</Typography>
        </Stack>
      ),
    },
    {
      field: 'type', headerName: 'Job Type', flex: 0.8, minWidth: 110,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value}</Typography>,
    },
    {
      field: 'vendor', headerName: 'Vendor', flex: 1, minWidth: 140,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value}</Typography>,
    },
    {
      field: 'date', headerName: 'Date', flex: 0.8, minWidth: 110,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary' }}>{value}</Typography>,
    },
    {
      field: 'cost', headerName: 'Cost', flex: 0.8, minWidth: 100,
      renderCell: ({ value }) => <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{value ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', flex: 0.85, minWidth: 120,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => setViewRecord(row)}>
              <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditRecord(row); setFormOpen(true); }}>
              <EditOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
              <DeleteOutlineIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', mt: 2 }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Repairs"
        subtitle="Track and manage vehicle repairs."
        icon={BuildIcon}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditRecord(null); setFormOpen(true); }}
            sx={{ borderRadius: 2 }}
          >
            New repair
          </Button>
        }
      />

      {/* ── Stats ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total repairs" value={stats.total} sub="This year" subColor="info.main"
            icon={<BuildIcon sx={{ fontSize: 20 }} />} iconBg="#E6F1FB" iconColor="#185FA5" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Pending" value={stats.pending} sub="Awaiting action" subColor="text.secondary"
            icon={<PendingOutlinedIcon sx={{ fontSize: 20 }} />} iconBg="#F1EFE8" iconColor="#5F5E5A" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="In progress" value={stats.inProgress} sub="Work ongoing" subColor="warning.dark"
            icon={<LoopIcon sx={{ fontSize: 20 }} />} iconBg="#FAEEDA" iconColor="#854F0B" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Completed" value={stats.completed} sub="↑ 12% vs last month" subColor="success.dark"
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 20 }} />} iconBg="#E1F5EE" iconColor="#0F6E56" />
        </Grid>
      </Grid>

      {/* ── Filters ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              placeholder="Search vehicle number, vendor, job type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField select label="Status" value={filterStatus} onChange={(e) => setStatus(e.target.value)} size="small" sx={{ minWidth: 140 }}>
              <MenuItem value="">All statuses</MenuItem>
              {REPAIR_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Job type" value={filterType} onChange={(e) => setType(e.target.value)} size="small" sx={{ minWidth: 140 }}>
              <MenuItem value="">All types</MenuItem>
              {REPAIR_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <Tooltip title="Export to Excel">
              <IconButton size="small" onClick={exportToExcel} sx={{ border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
                <FileDownloadIcon sx={{ fontSize: 18, color: '#1acda3' }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Data Grid ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none', '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider' }, '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } }}
          slots={{
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} py={6}>
                <BuildIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography color="text.secondary" fontSize="0.875rem">No repair records found</Typography>
              </Stack>
            ),
          }}
        />
      </Card>

      {/* ── Dialogs ── */}
      <RepairFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditRecord(null); }} onSave={handleSave} record={editRecord} />

      <RepairViewDialog open={!!viewRecord} onClose={() => setViewRecord(null)} record={viewRecord} />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete repair record"
        message="This action cannot be undone. Are you sure you want to delete this repair record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

    </Box>
  );
}
