import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
  useTheme
} from '@mui/material';
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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LogoutIcon from '@mui/icons-material/Logout';
import { ConfirmDialog } from './components/Common';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const menuConfig = [
  {
    category: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { id: 'tracking', label: 'Live Tracking', icon: <MyLocationIcon /> }
    ]
  },
  {
    category: 'OPERATIONS',
    items: [
      { id: 'vehicle-ops', label: 'Vehicle Ops', icon: <LocalShippingIcon />, badge: '3', badgeColor: 'black', permission: 'vehicle_view' },
      { id: 'trip-logs', label: 'Trip Logs', icon: <AssignmentIcon />, permission: 'trip_view' },
      { id: 'fuel', label: 'Fuel Logs', icon: <LocalGasStationIcon />, permission: 'fuel_view' },
      { id: 'drivers', label: 'Drivers', icon: <PeopleIcon />, permission: 'driver_view' },
      { id: 'dispatch', label: 'Dispatch Board', icon: <DynamicFeedIcon />, permission: 'trip_view' }
    ]
  },
  {
    category: 'ASSETS',
    items: [
      { id: 'inventory', label: 'Inventory', icon: <InventoryIcon />, permission: 'asset_view' },
      { id: 'maintenance', label: 'Maintenance', icon: <BuildIcon />, badge: '2', badgeColor: 'black', permission: 'maintenance_view' },
      { id: 'repairs', label: 'Repairs', icon: <BuildCircleIcon sx={{ fontSize: '26px !important' }} />, permission: 'repair_view' },
      { id: 'expenses', label: 'Expenses', icon: <AccountBalanceWalletIcon />, permission: 'expense_view' }
    ]
  },
  {
    category: 'FINANCE',
    items: [
      { id: 'finance', label: 'Finance & PnL', icon: <MonetizationOnIcon />, permission: 'finance_view' }
    ]
  },
  {
    category: 'INTELLIGENCE',
    items: [
      { id: 'ai-insights', label: 'AI Insights', icon: <AutoAwesomeIcon />, badge: 'AI', badgeColor: 'info', permission: 'report_view' },
      { id: 'reports', label: 'Reports', icon: <AssessmentIcon />, permission: 'report_view' }
    ]
  },
  {
    category: 'SYSTEM',
    items: [
      { id: 'documents', label: 'Documents', icon: <DescriptionIcon />, permission: 'document_metadata_view' },
      { id: 'users', label: 'Users', icon: <ManageAccountsIcon />, permission: 'user_view' },
      { id: 'roles', label: 'Roles & Permissions', icon: <SecurityIcon />, permission: 'role_view' },
      { id: 'settings', label: 'Settings', icon: <SettingsIcon />, permission: 'settings_view' }
    ]
  }
];

export default function FleetSidebar({ activeTab, setActiveTab }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { user, permissions, logout, hasPermission } = useAuth();

  const displayName = [user?.name, user?.fullName, user?.email].find(Boolean) || '';
  const roleName = (user?.role && typeof user.role === 'object')
    ? (user.role.key || user.role.name || '')
    : (typeof user?.role === 'string' && (user.role.includes(' ') || user.role.includes('_')) ? user.role : '');
  const roleLabel = roleName ? String(roleName).toLowerCase().replace(/_/g, ' ') : '';
  const initials = displayName
    ? displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : (user?.email ? String(user.email).charAt(0).toUpperCase() : '');

  const visibleMenuConfig = menuConfig.map(section => {
    const allowedItems = section.items.filter(item => {
      // If the item doesn't explicitly require a permission, always show it.
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
    return { ...section, items: allowedItems };
  }).filter(section => section.items.length > 0);

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        width: '260px',
        bgcolor: isDark ? '#0A1118' : '#F8FAFC',
        borderRight: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: isDark ? '#F8FAFC' : '#0F172A'
      }}
    >
      <Box sx={{ p: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Box
          sx={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <BusinessCenterIcon sx={{ color: '#fff', fontSize: '18px' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2, color: isDark ? '#fff' : '#0F172A', letterSpacing: '-0.5px' }}>
            FleetAI
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: '12px', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {visibleMenuConfig.map((section) => (
          <Box key={section.category} sx={{ mb: '20px' }}>
            <Typography
              variant="body2"
              sx={{
                px: '16px',
                mb: '6px',
                color: isDark ? '#64748B' : '#94A3B8',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              {section.category}
            </Typography>
            <List sx={{ p: 0 }}>
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <ListItem key={item.id} disablePadding sx={{ mb: '4px', px: '12px' }}>
                    <ListItemButton
                      onClick={() => setActiveTab(item.id)}
                      sx={{
                        borderRadius: '8px',
                        py: '6px',
                        px: '12px',
                        backgroundColor: isActive ? (isDark ? 'rgba(25, 118, 210, 0.15)' : '#E3F2FD') : 'transparent',
                        color: isActive ? '#1976d2' : (isDark ? '#CBD5E1' : '#475569'),
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: isActive ? (isDark ? 'rgba(25, 118, 210, 0.25)' : '#BBDEFB') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                          color: isActive ? '#1976d2' : (isDark ? '#F8FAFC' : '#0F172A'),
                          '& .MuiListItemIcon-root': {
                            color: isActive ? '#1976d2' : (isDark ? '#F8FAFC' : '#0F172A')
                          }
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: '32px',
                          color: isActive ? '#1976d2' : 'text.secondary',
                          '& svg': { fontSize: '20px' }
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                            {item.label}
                          </Typography>
                        }
                      />
                      {item.badge && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '18px',
                            minWidth: '18px',
                            borderRadius: '50%',
                            backgroundColor: item.badgeColor === 'black' ? (isDark ? '#333' : '#111827') : item.badgeColor === 'error' ? 'rgba(239, 68, 68, 0.15)' : item.badgeColor === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(3, 169, 244, 0.15)',
                            border: `1px solid ${item.badgeColor === 'black' ? (isDark ? '#444' : '#000') : item.badgeColor === 'error' ? 'rgba(239, 68, 68, 0.3)' : item.badgeColor === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(3, 169, 244, 0.3)'}`,
                            color: item.badgeColor === 'black' ? '#ffffff' : item.badgeColor === 'error' ? '#ef4444' : item.badgeColor === 'warning' ? '#f59e0b' : '#03a9f4',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            px: 0.5,
                            letterSpacing: '0.03em'
                          }}
                        >
                          {item.badge}
                        </Box>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />

      <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar
          sx={{
            width: '36px',
            height: '36px',
            backgroundColor: '#0288d1',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 700
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '0.8rem' }}>
            {displayName}
          </Typography>
          {roleLabel ? (
            <Typography variant="body2" noWrap sx={{ color: isDark ? '#94A3B8' : '#475569', fontSize: '0.7rem', fontWeight: 500, textTransform: 'capitalize' }}>
              {roleLabel}
            </Typography>
          ) : null}
        </Box>
        <IconButton size="small" onClick={() => setLogoutDialogOpen(true)} sx={{ color: isDark ? '#64748B' : '#94A3B8', '&:hover': { color: '#ef4444' } }}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>

      <ConfirmDialog 
        open={logoutDialogOpen} 
        title="Logout" 
        message="Are you sure you want to log out?" 
        onConfirm={handleLogout} 
        onCancel={() => setLogoutDialogOpen(false)} 
        confirmColor="error" 
      />
    </Box>
  );
}
