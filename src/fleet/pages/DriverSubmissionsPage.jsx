import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, Tabs, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Chip, CircularProgress, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack,
  useTheme
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import { PageHeader } from '../components/Common';
import { driverSubmissionService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export default function DriverSubmissionsPage() {
  const { addNotification } = useNotification();
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [actionModal, setActionModal] = useState({ open: false, type: '', id: '', category: '', title: '' });
  const [reason, setReason] = useState('');
  
  const tabs = [
    { label: 'Fuel', icon: <LocalGasStationIcon />, category: 'fuel' },
    { label: 'Expenses', icon: <AttachMoneyIcon />, category: 'expenses' },
    { label: 'Documents', icon: <DescriptionIcon />, category: 'documents' },
    { label: 'Issues', icon: <ReportProblemIcon />, category: 'issues' },
    { label: 'Inspections', icon: <FactCheckIcon />, category: 'inspections' },
  ];

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const category = tabs[activeTab].category;
      let res;
      switch(category) {
        case 'fuel': res = await driverSubmissionService.getFuel(); break;
        case 'expenses': res = await driverSubmissionService.getExpenses(); break;
        case 'documents': res = await driverSubmissionService.getDocuments(); break;
        case 'issues': res = await driverSubmissionService.getIssues(); break;
        case 'inspections': res = await driverSubmissionService.getInspections(); break;
        default: res = { data: { data: [] } };
      }
      
      const resData = res.data?.data?.items || res.data?.data || res.data || [];
      setData(Array.isArray(resData) ? resData : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleOpenAction = (category, id, actionType, title) => {
    setActionModal({ open: true, category, id, type: actionType, title });
    setReason('');
  };

  const submitAction = async () => {
    try {
      const { category, id, type } = actionModal;
      const payload = reason ? { reason } : {};
      
      switch(category) {
        case 'fuel':
          if (type === 'approve') await driverSubmissionService.approveFuel(id, payload);
          else if (type === 'reject') await driverSubmissionService.rejectFuel(id, payload);
          else if (type === 'request-changes') await driverSubmissionService.requestFuelChanges(id, payload);
          break;
        case 'expenses':
          if (type === 'approve') await driverSubmissionService.approveExpense(id, payload);
          else if (type === 'reject') await driverSubmissionService.rejectExpense(id, payload);
          else if (type === 'request-changes') await driverSubmissionService.requestExpenseChanges(id, payload);
          break;
        case 'documents':
          if (type === 'verify') await driverSubmissionService.verifyDocument(id, payload);
          else if (type === 'reject') await driverSubmissionService.rejectDocument(id, payload);
          else if (type === 'request-changes') await driverSubmissionService.requestDocumentChanges(id, payload);
          break;
        case 'issues':
          if (type === 'acknowledge') await driverSubmissionService.acknowledgeIssue(id, payload);
          else if (type === 'resolve') await driverSubmissionService.resolveIssue(id, payload);
          else if (type === 'reject') await driverSubmissionService.rejectIssue(id, payload);
          break;
        case 'inspections':
          if (type === 'review') await driverSubmissionService.reviewInspection(id, payload);
          else if (type === 'reject') await driverSubmissionService.rejectInspection(id, payload);
          else if (type === 'request-changes') await driverSubmissionService.requestInspectionChanges(id, payload);
          break;
      }
      
      addNotification('Action completed successfully', 'success');
      setActionModal({ open: false, type: '', id: '', category: '', title: '' });
      fetchSubmissions();
    } catch (err) {
      console.error('Error executing action', err);
      addNotification('Failed to execute action', 'error');
    }
  };
  
  const renderStatus = (status) => {
    const colorMap = {
      'APPROVED': 'success',
      'VERIFIED': 'success',
      'RESOLVED': 'success',
      'REJECTED': 'error',
      'SUBMITTED': 'info',
      'DRAFT': 'default',
      'NEEDS_CHANGES': 'warning',
      'ACKNOWLEDGED': 'primary'
    };
    const c = colorMap[status] || 'default';
    return <Chip label={status || 'UNKNOWN'} size="small" color={c} sx={{ fontWeight: 700 }} />;
  };

  const renderActions = (item, category) => {
    const currentStatus = category === 'documents' ? item.verificationStatus : item.status;
    const isPending = currentStatus === 'SUBMITTED' || currentStatus === 'PENDING' || !currentStatus;
    
    const canApprove = category === 'fuel' || category === 'expenses';
    const canVerify = category === 'documents';
    const canAck = category === 'issues';
    const canReview = category === 'inspections';
    
    return (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {isPending && canApprove && (
          <Tooltip title="Approve">
            <IconButton size="small"  onClick={() => handleOpenAction(category, item.id, 'approve', 'Approve Submission')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 17 }}  />
            </IconButton>
          </Tooltip>
        )}
        {isPending && canVerify && (
          <Tooltip title="Verify">
            <IconButton size="small"  onClick={() => handleOpenAction(category, item.id, 'verify', 'Verify Document')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 17 }}  />
            </IconButton>
          </Tooltip>
        )}
        {isPending && canAck && (
          <Tooltip title="Acknowledge">
            <IconButton size="small"  onClick={() => handleOpenAction(category, item.id, 'acknowledge', 'Acknowledge Issue')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 17 }}  />
            </IconButton>
          </Tooltip>
        )}
        {isPending && canReview && (
          <Tooltip title="Review">
            <IconButton size="small"  onClick={() => handleOpenAction(category, item.id, 'review', 'Review Inspection')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 17 }}  />
            </IconButton>
          </Tooltip>
        )}
        {isPending && (category !== 'issues') && (
          <Tooltip title="Request Changes">
            <IconButton size="small"  onClick={() => handleOpenAction(category, item.id, 'request-changes', 'Request Changes')} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}>
              <EditIcon sx={{ fontSize: 17 }}  />
            </IconButton>
          </Tooltip>
        )}
        {item.status === 'ACKNOWLEDGED' && category === 'issues' && (
          <Tooltip title="Resolve">
            <IconButton size="small"  onClick={() => handleOpenAction(category, item.id, 'resolve', 'Resolve Issue')} sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 17 }}  />
            </IconButton>
          </Tooltip>
        )}
        {isPending && (
          <Tooltip title="Reject">
            <IconButton size="small"  onClick={() => handleOpenAction(category, item.id, 'reject', 'Reject Submission')} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}>
              <CancelOutlinedIcon sx={{ fontSize: 17 }}  />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    );
  };
  
  const renderDetails = (row, category) => {
    switch (category) {
      case 'fuel':
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.vehicle?.vehicleNumber || row.vehicleId}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.fuelType} - {row.totalAmount ? `₹${row.totalAmount}` : (row.quantityLiters ? `${row.quantityLiters} L` : 'Unknown')}
            </Typography>
          </Box>
        );
      case 'documents':
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.title || row.documentType}</Typography>
            <Typography variant="caption" color="text.secondary">{row.documentNumber}</Typography>
          </Box>
        );
      case 'expenses':
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.expenseType || 'Expense'}</Typography>
            <Typography variant="caption" color="text.secondary">{row.amount ? `₹${row.amount}` : ''}</Typography>
          </Box>
        );
      default:
        return <Typography variant="body2">{row.id}</Typography>;
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (data.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No submissions found for this category.
        </Box>
      );
    }
    
    const cat = tabs[activeTab].category;

    return (
      <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider' } }}>
              <TableCell>Date</TableCell>
              <TableCell>Submitter / Driver</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.driver?.name || row.driverId || (row.linkedEntityType === 'STAFF_PROFILE' ? `Staff: ${row.uploadedBy?.name || 'Unknown'}` : row.uploadedBy?.name || 'N/A')}
                  </Typography>
                </TableCell>
                <TableCell>{renderDetails(row, cat)}</TableCell>
                <TableCell>{renderStatus(cat === 'documents' ? row.verificationStatus : row.status)}</TableCell>
                <TableCell align="right">{renderActions(row, cat)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      <PageHeader
        subicon={<AssignmentIcon color="primary" sx={{ fontSize: 40 }} />}
      />

      <Card sx={{ borderRadius: 3, boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            {tabs.map((t, idx) => (
              <Tab key={idx} icon={t.icon} label={t.label} iconPosition="start" sx={{ minHeight: 60 }} />
            ))}
          </Tabs>
        </Box>
        {renderTableContent()}
      </Card>
      
      <Dialog open={actionModal.open} onClose={() => setActionModal({ ...actionModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{actionModal.title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to {actionModal.type?.replace('-', ' ')} this submission?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (Required for rejection or changes)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionModal({ ...actionModal, open: false })}>Cancel</Button>
          <Button 
            variant="contained" 
            color={actionModal.type === 'reject' ? 'error' : actionModal.type === 'request-changes' ? 'warning' : 'primary'}
            onClick={submitAction}
            disabled={!reason && (actionModal.type === 'reject' || actionModal.type === 'request-changes')}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
