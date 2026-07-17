import React from 'react';
import { Box, Card, Typography, Grid, TextField, Stack, Chip, useTheme } from '@mui/material';
import { FactCheck } from '@mui/icons-material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { PageHeader } from '../components/Common';

export default function PODBillingChainPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const statCards = [
    { label: 'PODs pending', val: 0, col: '#f59e0b', lightBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', darkBg: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)' },
    { label: 'PODs verified', val: 3, col: '#10b981', lightBg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', darkBg: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)' },
    { label: 'Billing approvals', val: 0, col: '#3b82f6', lightBg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', darkBg: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)' },
    { label: 'PODs rejected', val: 1, col: '#ef4444', lightBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', darkBg: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)' }
  ];

  const historyItems = [
    { s: 'VERIFIED', t: 'TR-MR92BV3D-9M30', m: 'POD verified', c: '#10b981', lightBg: '#d1fae5', darkBg: 'rgba(16,185,129,0.2)' },
    { s: 'VERIFIED', t: 'TR-MR26AIJL-YFP3', m: 'Verified for billing rejection test', c: '#10b981', lightBg: '#d1fae5', darkBg: 'rgba(16,185,129,0.2)' },
    { s: 'VERIFIED', t: 'TR-MR5Y26ZD-S51J', m: 'POD verified - good delivery proof', c: '#10b981', lightBg: '#d1fae5', darkBg: 'rgba(16,185,129,0.2)' },
    { s: 'REJECTED', t: 'TR-MR26AIJL-YFP3', m: 'POD image is blurry and illegible', c: '#ef4444', lightBg: '#fee2e2', darkBg: 'rgba(239,68,68,0.2)' }
  ];

  return (
    <Box sx={{ p: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0 }}>
        <PageHeader 
        subicon={<FactCheck color="primary" sx={{ fontSize: 40 }}/>}
        />
              </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Grid container spacing={3} mb={4}>
            {statCards.map(c => (
              <Grid item xs={12} sm={6} md={3} key={c.label}>
                <Card sx={{ p: 3, background: isDark ? c.darkBg : c.lightBg, border: 'none', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="h3" sx={{ fontWeight: 800, color: c.col, mb: 0.5 }}>{c.val}</Typography>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600, opacity: 0.8 }}>{c.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', bgcolor: 'background.paper' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><FactCheckIcon sx={{ color: '#f59e0b', fontSize: 20 }}/> POD Verification Queue</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Driver delivery proofs waiting for admin/manager verification.</Typography>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <TextField label="Rate/km for auto billing" placeholder="Example: 50" size="small" fullWidth />
                  <TextField label="Verification notes" placeholder="Optional notes" size="small" fullWidth multiline rows={2} />
                </Box>
                <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', bgcolor: isDark ? 'rgba(0,0,0,0.1)' : '#fafafa' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <FactCheckIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>No POD pending</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Completed trip POD uploads will appear here.</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', bgcolor: 'background.paper' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><ReceiptLongIcon sx={{ color: '#3b82f6', fontSize: 20 }}/> Finance Approval Queue</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Billing drafts created after POD verification.</Typography>
                </Box>
                <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', bgcolor: isDark ? 'rgba(0,0,0,0.1)' : '#fafafa' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <ReceiptLongIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>No billing pending</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Verified PODs will auto-create billing drafts here.</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', bgcolor: 'background.paper' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><FactCheckIcon sx={{ color: '#10b981', fontSize: 20 }}/> Verified / Rejected History</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Recent POD decisions for audit and follow-up.</Typography>
                </Box>
                <Box sx={{ p: 2, flex: 1, bgcolor: 'background.paper' }}>
                  <Stack spacing={2}>
                    {historyItems.map((h,i) => (
                      <Box key={i} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, transition: 'all 0.2s', '&:hover': { boxShadow: isDark ? '0 4px 10px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>{h.t}</Typography>
                          <Chip label={h.s} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, color: h.c, bgcolor: isDark ? h.darkBg : h.lightBg, borderRadius: 1 }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>{h.m}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Card>
            </Grid>
          </Grid>
      </Box>
    </Box>
  );
}
