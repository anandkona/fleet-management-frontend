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
      { id: 'drivers', label: 'Drivers', icon: <PeopleIcon />, permission: 'driver_view' }
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
  
  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.key || user?.role?.name || '');

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
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: 'text.primary'
      }}
    >
      <Box sx={{ p: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Box
          sx={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <BusinessCenterIcon sx={{ color: 'text.primary', fontSize: '24px' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
            FleetAI
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.75rem', fontWeight: 500 }}>
            Fleet Intelligence Platform
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
                mb: '8px',
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}
            >
              {section.category}
            </Typography>
            <List sx={{ p: 0 }}>
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <ListItem key={item.id} disablePadding sx={{ mb: '4px' }}>
                    <ListItemButton
                      onClick={() => setActiveTab(item.id)}
                      sx={{
                        borderRadius: '8px',
                        py: '8px',
                        px: '16px',
                        backgroundColor: isActive ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
                        color: isActive ? '#1976d2' : 'text.primary',
                        borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: isActive ? 'rgba(25, 118, 210, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                          color: '#1976d2',
                          '& .MuiListItemIcon-root': {
                            color: '#1976d2'
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

      <Divider sx={{ borderColor: 'divider' }} />

      <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar
          sx={{
            width: '40px',
            height: '40px',
            backgroundColor: '#0288d1',
            color: 'text.primary',
            fontSize: '0.9rem',
            fontWeight: 700
          }}
        >
          {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize' }}>
            {roleName ? roleName.toLowerCase().replace(/_/g, ' ') : 'Role'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setLogoutDialogOpen(true)} sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }}>
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
