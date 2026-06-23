import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Skeleton, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { PALETTE } from '../theme';
import EChart from './EChart';
import { useThemeSettings } from '../context/ThemeContext';

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

export function StatusPieChart({ data, title, loading }) {
  const { settings } = useThemeSettings();
  const isDark = settings?.mode === 'dark';

  const chartData = useMemo(() => Object.entries(data || {})
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({ name: formatStatus(key), value: val, color: STATUS_COLORS[key] || '#6B7A8D' })),
  [data]);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1e293b' : '#0f172a',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12, fontFamily: 'Nunito' },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 12,
      textStyle: { color: isDark ? '#94a3b8' : '#475569', fontSize: 11, fontFamily: 'Nunito' },
    },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      padAngle: 3,
      itemStyle: { borderRadius: 6 },
      label: {
        show: true,
        position: 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
          fontFamily: 'Nunito',
          color: isDark ? '#f1f5f9' : '#020617',
        },
      },
      labelLine: { show: false },
      data: chartData.map((item) => ({
        value: item.value,
        name: item.name,
        itemStyle: { color: item.color },
      })),
    }],
  }), [chartData, isDark]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>{title}</Typography>
        {loading ? (
          <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
        ) : chartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No data available</Typography>
        ) : (
          <EChart option={option} style={{ height: 260 }} />
        )}
      </CardContent>
    </Card>
  );
}

export function TypeBarChart({ data, title, loading, color = PALETTE.teal }) {
  const { settings } = useThemeSettings();
  const isDark = settings?.mode === 'dark';

  const chartData = useMemo(() => Object.entries(data || {})
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({ name: key || 'Unknown', value: val })),
  [data]);

  const categories = chartData.map((d) => d.name);
  const values = chartData.map((d) => d.value);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1e293b' : '#0f172a',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12, fontFamily: 'Nunito' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontFamily: 'Nunito' },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontFamily: 'Nunito' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: values.map((val, i) => ({
        value: val,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: CHART_COLORS[i % CHART_COLORS.length] },
              { offset: 1, color: `${CHART_COLORS[i % CHART_COLORS.length]}88` },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barWidth: '45%',
    }],
  }), [categories, values, isDark]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>{title}</Typography>
        {loading ? (
          <Stack spacing={1}>{Array(3).fill(0).map((_, i) => <Skeleton key={i} height={40} />)}</Stack>
        ) : chartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>No data available</Typography>
        ) : (
          <EChart option={option} style={{ height: 260 }} />
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>Expiry Alerts</Typography>
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
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
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
                <Typography variant="h5" sx={{ fontWeight: 700, color: item.color || 'text.primary' }}>
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
