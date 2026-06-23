import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Typography, IconButton, Divider, Stack, Box, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StatusChip from './StatusChip';

const DetailRow = ({ label, value }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>
      {value || '—'}
    </Typography>
  </Grid>
);

const handlePrint = (record) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Repair Details - ${record.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #1acda3; padding-bottom: 15px; }
        .header h1 { font-size: 22px; color: #1acda3; }
        .header p { font-size: 12px; color: #888; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        td:first-child { font-weight: 600; color: #555; width: 40%; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        .status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-complete { background: #E1F5EE; color: #0F6E56; }
        .status-pending { background: #F1EFE8; color: #5F5E5A; }
        .status-inprogress { background: #FAEEDA; color: #854F0B; }
        .notes { margin-top: 15px; padding: 12px; background: #f9f9f9; border-radius: 6px; font-size: 13px; line-height: 1.5; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { padding: 15px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Repair Details</h1>
        <p>Repair ID: ${record.id}</p>
      </div>
      <table>
        <tr><td>Repair ID</td><td>${record.id}</td></tr>
        <tr><td>Vehicle Number</td><td>${record.vehicle}</td></tr>
        <tr><td>Model Name</td><td>${record.model || '—'}</td></tr>
        <tr><td>Vehicle Type</td><td>${record.vehicleType}</td></tr>
        <tr><td>Job Type</td><td>${record.type}</td></tr>
        <tr><td>Vendor / Workshop</td><td>${record.vendor}</td></tr>
        <tr><td>Repair Date</td><td>${record.date}</td></tr>
        <tr><td>Cost</td><td>₹ ${Number(record.cost).toLocaleString('en-IN')}</td></tr>
        <tr>
          <td>Status</td>
          <td>
            <span class="status ${
              record.status === 'Complete' ? 'status-complete' :
              record.status === 'Pending' ? 'status-pending' : 'status-inprogress'
            }">${record.status}</span>
          </td>
        </tr>
      </table>
      ${record.notes ? `<div class="notes"><strong>Notes:</strong><br/>${record.notes}</div>` : ''}
      <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export default function RepairViewDialog({ open, onClose, record }) {
  if (!record) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocalShippingOutlinedIcon sx={{ color: '#1acda3', fontSize: 22 }} />
          <span>Repair Details</span>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Print">
            <IconButton size="small" onClick={() => handlePrint(record)}>
              <PrintIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2.5}>
          <DetailRow label="Repair ID" value={record.id} />
          <DetailRow label="Vehicle Number" value={record.vehicle} />
          <DetailRow label="Model Name" value={record.model} />
          <DetailRow label="Vehicle Type" value={record.vehicleType} />
          <DetailRow label="Job Type" value={record.type} />
          <DetailRow label="Vendor / Workshop" value={record.vendor} />
          <DetailRow label="Repair Date" value={record.date} />

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
              Cost
            </Typography>
            <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>
              {record.cost ? `₹ ${Number(record.cost).toLocaleString('en-IN')}` : '—'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
              Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <StatusChip status={record.status} />
            </Box>
          </Grid>

          {record.notes && (
            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                Notes
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {record.notes}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
