import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  InputBase
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { 
  DarkMode, LightMode, Info, CheckCircle, Warning, Error as ErrorIcon
} from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SecurityIcon from '@mui/icons-material/Security';
import MenuIcon from '@mui/icons-material/Menu';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';

function FleetHeader({ handleDrawerToggle }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const path = location.pathname.substring(1);
    if (!path || path === 'dashboard') return 'Fleet Dashboard';
    if (path === 'vehicle-ops') return 'Vehicle Operations';
    if (path === 'ai-insights') return 'AI Insights';
    if (path === 'tracking') return 'Live Tracking';
    if (path === 'dispatch') return 'Dispatch Board';
    return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }, [location.pathname]);

  const PageIcon = useMemo(() => {
    const path = location.pathname.substring(1);
    switch (path) {
      case 'vehicle-ops': return LocalShippingIcon;
      case 'maintenance': return BuildIcon;
      case 'repairs': return BuildCircleIcon;
      case 'expenses': return AccountBalanceWalletIcon;
      case 'finance': return MonetizationOnIcon;
      case 'tracking': return MyLocationIcon;
      case 'drivers': return PeopleIcon;
      case 'users': return ManageAccountsIcon;
      case 'inventory': return InventoryIcon;
      case 'fuel': return LocalGasStationIcon;
      case 'ai-insights': return AutoAwesomeIcon;
      case 'roles': return SecurityIcon;
      case 'trip-logs': return AssignmentIcon;
      case 'documents': return DescriptionIcon;
      case 'dispatch': return DynamicFeedIcon;
      case 'reports': return AssessmentIcon;
      case 'settings': return SettingsIcon;
      default: return DashboardIcon;
    }
  }, [location.pathname]);
  const { themeMode, toggleThemeMode } = useSettings();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification();
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);

  const handleNotifClick = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const getNotifIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'warning': return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'error': return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      default: return <Info sx={{ color: 'info.main', fontSize: 20 }} />;
    }
  };



  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: '20px 24px',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        color: 'text.primary',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '12px', sm: '20px' } }}>
        <IconButton
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ display: { md: 'none' }, color: 'text.primary', border: '1px solid', borderColor: 'divider', p: '8px', borderRadius: '50%' }}
        >
          <MenuIcon sx={{ fontSize: '20px' }} />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
          <PageIcon sx={{ color: 'primary.main', mr: 1, fontSize: '28px' }} />
          {pageTitle}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            px: '12px',
            py: '6px',
            width: { xs: '130px', sm: '220px' },
            '&:focus-within': { borderColor: 'primary.main' }
          }}
        >
          <SearchIcon sx={{ color: 'text.primary', fontSize: '18px', mr: 1 }} />
          <InputBase
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/vehicle-ops?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            sx={{ flex: 1, color: 'text.primary', fontSize: '0.875rem' }}
          />
        </Box>

        <IconButton onClick={toggleThemeMode} sx={{ border: '1px solid', borderColor: 'divider', p: '8px', borderRadius: '50%', color: 'text.primary', '&:hover': { bgcolor: 'action.hover', color: 'primary.main' } }}>
          {themeMode === 'dark' ? <LightMode sx={{ fontSize: '20px' }} /> : <DarkMode sx={{ fontSize: '20px' }} />}
        </IconButton>

        <IconButton onClick={handleNotifClick} sx={{ border: '1px solid', borderColor: 'divider', p: '8px', borderRadius: '50%', color: 'text.primary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
          <Badge badgeContent={unreadCount} sx={{ '& .MuiBadge-badge': { backgroundColor: '#1976d2', color: '#fff' } }}>
            <NotificationsIcon sx={{ fontSize: '20px' }} />
          </Badge>
        </IconButton>
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          PaperProps={{
            elevation: 3,
            sx: {
              width: 320,
              maxHeight: 400,
              mt: 1.5,
              borderRadius: '12px',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
            <Box>
              <Button size="small" onClick={markAllAsRead} sx={{ fontSize: '0.75rem', mr: 1 }}>Mark all read</Button>
              <Button size="small" color="error" onClick={clearAll} sx={{ fontSize: '0.75rem' }}>Clear</Button>
            </Box>
          </Box>
          <Box sx={{ overflowY: 'auto', maxHeight: 320 }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
              </Box>
            ) : (
              notifications.map((n) => (
                <MenuItem
                  key={n.id}
                  onClick={() => { markAsRead(n.id); }}
                  sx={{
                    px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: n.read ? 'transparent' : 'action.hover',
                    whiteSpace: 'normal',
                    display: 'flex', alignItems: 'flex-start', gap: 1.5
                  }}
                >
                  <Box sx={{ mt: 0.5 }}>{getNotifIcon(n.type)}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{n.message}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Box>
        </Menu>

        <IconButton onClick={() => navigate('/settings', { replace: true })} sx={{ border: '1px solid', borderColor: 'divider', p: '8px', borderRadius: '50%', color: 'text.primary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
          <SettingsIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default React.memo(FleetHeader);
