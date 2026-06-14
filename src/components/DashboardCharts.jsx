import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Card, CardContent, Typography, Box, Skeleton, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PALETTE } from '../theme';

const CHART_COLORS = [
  PALETTE.teal, '#7C6FF7', PALETTE.amber, PALETTE.coral,
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8',
];

const STATUS_COLORS = {
  AVAILABLE: '#00C2A8',
  ON_TRIP: '#7C6FF7',
  UNDER_MAINTENANCE: '#F5A623',
  UNDER_REPAIR: '#FF8C42',
  INACTIVE: '#6B7A8D',
  SOLD: '#9CA3AF',
  ACCIDENT: '#FF5D5D',
  ON_LEAVE: '#F5A623',
  SUSPENDED: '#FF5D5D',
  ASSIGNED: '#7C6FF7',
  DAMAGED: '#FF5D5D',
  LOST: '#FF5D5D',
  RETIRED: '#6B7A8D',
};

function formatStatus(status) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: PALETTE.navy, color: '#fff', px: 1.5, py: 1, borderRadius: 1,
      fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>{payload[0].name || payload[0].payload?.name}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{payload[0].value}</Typography>
    </Box>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontWeight={700} fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function StatusPieChart({ data, title, loading }) {
  const chartData = Object.entries(data || {})
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({ name: formatStatus(key), value: val, color: STATUS_COLORS[key] || '#6B7A8D' }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{title}</Typography>
        {loading ? (
          <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
        ) : chartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No data available</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: PALETTE.text, fontSize: '0.75rem', fontWeight: 500 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TypeBarChart({ data, title, loading, color = PALETTE.teal }) {
  const chartData = Object.entries(data || {})
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({ name: key || 'Unknown', count: val }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{title}</Typography>
        {loading ? (
          <Stack spacing={1}>{Array(3).fill(0).map((_, i) => <Skeleton key={i} height={40} />)}</Stack>
        ) : chartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No data available</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7A8D' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7A8D' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpiryAlertCard({ documents, loading }) {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const alerts = (documents || [])
    .filter((doc) => doc.expiryDate)
    .map((doc) => ({
      ...doc,
      expiryDate: new Date(doc.expiryDate),
    }))
    .filter((doc) => doc.expiryDate <= thirtyDays)
    .sort((a, b) => a.expiryDate - b.expiryDate)
    .slice(0, 8);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Expiry Alerts</Typography>
          {alerts.length > 0 && (
            <Box sx={{
              bgcolor: alerts.some((a) => a.expiryDate < now) ? '#FFEEEE' : '#FEF6E7',
              color: alerts.some((a) => a.expiryDate < now) ? PALETTE.coral : PALETTE.amber,
              px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700,
            }}>
              {alerts.filter((a) => a.expiryDate < now).length > 0
                ? `${alerts.filter((a) => a.expiryDate < now).length} expired`
                : `${alerts.length} upcoming`}
            </Box>
          )}
        </Stack>
        {loading ? (
          <Stack spacing={1}>{Array(3).fill(0).map((_, i) => <Skeleton key={i} height={48} />)}</Stack>
        ) : alerts.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No upcoming expiries</Typography>
        ) : (
          <Stack spacing={1}>
            {alerts.map((doc) => {
              const isExpired = doc.expiryDate < now;
              return (
                <Box key={doc.id} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1.5, borderRadius: 1.5, border: '1px solid',
                  borderColor: isExpired ? alpha(PALETTE.coral, 0.2) : alpha(PALETTE.amber, 0.2),
                  bgcolor: isExpired ? alpha(PALETTE.coral, 0.04) : alpha(PALETTE.amber, 0.04),
                }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: PALETTE.navy }}>
                      {doc.documentType}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {doc.entityType} · {doc.documentNumber || '—'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{
                    fontWeight: 700, color: isExpired ? PALETTE.coral : PALETTE.amber,
                    whiteSpace: 'nowrap',
                  }}>
                    {isExpired ? 'Expired' : `${Math.ceil((doc.expiryDate - now) / (1000 * 60 * 60 * 24))}d`}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryRow({ items, loading }) {
  return (
    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
      {items.map((item) => (
        <Card key={item.label} sx={{ minWidth: 160, flex: '1 1 160px' }}>
          <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
            {loading ? (
              <Skeleton width={60} height={32} sx={{ mx: 'auto' }} />
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 700, color: item.color || PALETTE.navy }}>
                  {item.value ?? '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.label}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
