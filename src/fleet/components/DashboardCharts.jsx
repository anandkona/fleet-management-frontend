import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Skeleton } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const COLORS = ['#00C2A8', '#7C6FF7', '#F5A623', '#FF5D5D', '#45B7D1', '#6B7A8D', '#FF8C42'];

const STATUS_COLORS = {
  AVAILABLE: '#00C2A8', ON_TRIP: '#7C6FF7', UNDER_MAINTENANCE: '#F5A623',
  UNDER_REPAIR: '#FF8C42', INACTIVE: '#6B7A8D', SOLD: '#FF5D5D',
  ACCIDENT: '#FF5D5D', draft: '#6B7A8D', SCHEDULED: '#7C6FF7',
  STARTED: '#00C2A8', COMPLETED: '#00C2A8', CANCELLED: '#FF5D5D',
};

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid #3a3a42', borderRadius: 1, p: 1.5, boxShadow: 4 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>{payload[0].name || payload[0].payload?.name}</Typography>
        <Typography sx={{ fontSize: '0.8rem', color: '#00C2A8' }}>{payload[0].value}</Typography>
      </Box>
    );
  }
  return null;
};

export function StatusPieChart({ data, title, loading }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name: formatLabel(name), value }));
  if (loading) return <Card sx={{ height: '100%', bgcolor: 'background.paper' }}><CardContent><Skeleton height={250} /></CardContent></Card>;
  if (chartData.length === 0) return null;

  return (
    <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>{title}</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[Object.keys(data)[i]] || COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TypeBarChart({ data, title, loading, color = '#00C2A8' }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name: formatLabel(name), count: value }));
  if (loading) return <Card sx={{ height: '100%', bgcolor: 'background.paper' }}><CardContent><Skeleton height={250} /></CardContent></Card>;
  if (chartData.length === 0) return null;

  return (
    <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>{title}</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
            <XAxis dataKey="name" tick={{ fill: '#8a8a93', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8a8a93', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ExpiryAlertCard({ documents, loading }) {
  if (loading) return <Card sx={{ height: '100%', bgcolor: 'background.paper' }}><CardContent><Skeleton height={200} /></CardContent></Card>;
  const now = new Date();
  const soon = (documents || []).filter(d => {
    if (!d.expiryDate) return false;
    const diff = new Date(d.expiryDate) - now;
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  });

  return (
    <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>Document Expiry Alerts</Typography>
        {soon.length === 0 ? (
          <Stack alignItems="center" py={4}>
            <Typography sx={{ color: 'text.primary' }}>No upcoming expirations</Typography>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {soon.slice(0, 5).map((d, i) => (
              <Box key={i} sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: '#F5A62315', border: '1px solid #F5A62333' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>{d.name || d.type}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#F5A623' }}>Expires: {new Date(d.expiryDate).toLocaleDateString()}</Typography>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
