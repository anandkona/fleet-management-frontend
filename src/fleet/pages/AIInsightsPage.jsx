import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Chip, IconButton, CircularProgress, Button
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import api from '../../services/api';

const fallbackInsights = [];

export default function AIInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai-insights', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setInsights(items);
    } catch (err) {
      console.error(err);
      setInsights([]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const iconMap = {
    critical: <ErrorIcon sx={{ color: '#ef4444' }} />,
    warning: <WarningIcon sx={{ color: '#f59e0b' }} />,
    success: <CheckCircleIcon sx={{ color: '#10b981' }} />,
    info: <InfoIcon sx={{ color: '#3b82f6' }} />,
  };

  const colorMap = {
    critical: { bg: '#ef444415', border: '#ef4444', chip: '#ef4444' },
    warning: { bg: '#f59e0b15', border: '#f59e0b', chip: '#f59e0b' },
    success: { bg: '#10b98115', border: '#10b981', chip: '#10b981' },
    info: { bg: '#3b82f615', border: '#3b82f6', chip: '#3b82f6' },
  };

  const filtered = filter === 'all' ? insights : insights.filter(i => i.severity === filter);

  const counts = { critical: 0, warning: 0, success: 0, info: 0 };
  insights.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        </Box>

      {/* Filter chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {['all', 'critical', 'warning', 'success', 'info'].map(f => (
          <Chip key={f} label={f === 'all' ? `All (${insights.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f] || 0})`}
            onClick={() => setFilter(f)}
            sx={{
              fontWeight: 600, textTransform: 'capitalize',
              backgroundColor: filter === f ? (f === 'all' ? '#1976d2' : colorMap[f]?.chip) : '#1e1e24',
              color: filter === f ? '#fff' : '#888',
              '&:hover': { backgroundColor: filter === f ? (f === 'all' ? '#1565c0' : colorMap[f]?.chip) : '#2e2e38' }
            }} />
        ))}
      </Box>

      {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((insight, i) => {
            const c = colorMap[insight.severity] || colorMap.info;
            return (
              <Card key={i} sx={{ p: 2.5, backgroundColor: c.bg, borderLeft: `4px solid ${c.border}`, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ mt: 0.5 }}>{iconMap[insight.severity]}</Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', flex: 1 }}>{insight.title}</Typography>
                    <Chip label={insight.severity?.toUpperCase()} size="small" sx={{ backgroundColor: c.chip, color: 'text.primary', fontSize: '0.6rem', fontWeight: 700 }} />
                  </Box>
                  <Typography sx={{ color: 'text.primary', fontSize: '0.82rem', lineHeight: 1.5 }}>{insight.description}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    {insight.category && <Typography sx={{ color: 'text.primary', fontSize: '0.7rem' }}>{insight.category}</Typography>}
                    {insight.timestamp && <Typography sx={{ color: '#666', fontSize: '0.7rem' }}>{insight.timestamp}</Typography>}
                  </Box>
                </Box>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: 'text.primary' }}>No {filter !== 'all' ? filter : ''} insights available</Typography>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}
