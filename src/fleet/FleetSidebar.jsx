import React, { useState, useEffect } from 'react';
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
  useTheme,
  Collapse
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
import ReceiptIcon from '@mui/icons-material/Receipt';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MoneyIcon from '@mui/icons-material/Money';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { ConfirmDialog } from './components/Common';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { dispatchService } from '../services/api';

const menuConfig = [
  {
    category: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> }
    ]
  },
  {
    category: 'DRIVER PORTAL',
    items: [
      { id: 'driver-trips', label: 'My Trips', icon: <AssignmentIcon />, permission: 'driver_my_trips_view' },
      { id: 'driver-documents', label: 'My Documents', icon: <DescriptionIcon />, permission: 'driver_my_documents_view' },
      { id: 'driver-profile', label: 'My Profile', icon: <PeopleIcon />, permission: 'driver_my_profile_view' },
      { id: 'driver-advances', label: 'My Advances', icon: <MoneyIcon />, permission: 'driver_advance_view_own' },
      { id: 'driver-settlements', label: 'My Settlements', icon: <HandshakeIcon />, permission: 'driver_settlement_view_own' }
    ]
  },
  {
    category: 'OPERATIONS',
    items: [
      { id: 'vehicle-ops', label: 'Vehicle Ops', icon: <LocalShippingIcon />, badge: '3', badgeColor: 'black', permission: 'vehicle_view' },
      { id: 'trip-logs', label: 'Trip Logs', icon: <AssignmentIcon />, permission: 'trip_view' },
      { id: 'fuel', label: 'Fuel Logs', icon: <LocalGasStationIcon />, permission: 'fuel_view' },
      { id: 'drivers', label: 'Drivers', icon: <PeopleIcon />, permission: 'driver_view' },
      { id: 'driver-submissions', label: 'Driver Submissions', icon: <AssignmentIcon />, permission: 'driver_submission_view' },
      { id: 'advances', label: 'Driver Advances', icon: <MoneyIcon />, permission: 'driver_advance_view' },
      { id: 'settlements', label: 'Driver Settlements', icon: <HandshakeIcon />, permission: 'driver_settlement_view' },
      { id: 'inventory', label: 'Asset Inventory', icon: <InventoryIcon />, permission: 'asset_view' },
      { id: 'dispatch', label: 'Dispatch Board', icon: <DynamicFeedIcon />, permission: 'dispatch_view' },
      { id: 'compliance-board', label: 'Compliance Board', icon: <FactCheckIcon />, permission: 'compliance_view' }
    ]
  },
  {
    category: 'FINANCE',
    items: [
      {
        id: 'finance-module',
        label: 'Finance',
        icon: <MonetizationOnIcon />,
        permission: 'finance_view',
        subItems: [
          { id: 'finance', label: 'Finance & PnL', icon: <MonetizationOnIcon />, permission: 'finance_view' },
          { id: 'transactions', label: 'Transactions', icon: <ReceiptLongIcon />, permission: 'finance_view' },
          { id: 'accounts', label: 'Accounts', icon: <AccountBalanceIcon />, permission: 'finance_view' },
          { id: 'finance-categories', label: 'Categories', icon: <CategoryIcon />, permission: 'finance_view' },
          { id: 'customers', label: 'Customers', icon: <PeopleIcon />, permission: 'finance_view' },
          { id: 'vendors', label: 'Vendors', icon: <StorefrontIcon />, permission: 'finance_view' },
          { id: 'trip-billing', label: 'Trip Billing', icon: <ReceiptIcon />, permission: 'finance_view' },
          { id: 'pod-billing', label: 'POD Chain', icon: <FactCheckIcon />, permission: 'finance_view' },
          { id: 'payments', label: 'Payments', icon: <PaymentIcon />, permission: 'finance_view' }
        ]
      }
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
  const [dispatchSummary, setDispatchSummary] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();

  const { user, permissions, logout, hasPermission } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    // Only fetch if user has permission to view dispatch board to avoid unauthorized errors
    if (hasPermission('trip_view') || hasPermission('vehicle_view') || hasPermission('driver_view')) {
      dispatchService.getBoard()
        .then(res => {
          if (res.data?.data?.summary) {
            setDispatchSummary(res.data.data.summary);
          }
        })
        .catch(err => {
          if (err.response?.status !== 403) {
            console.error("Failed to fetch dispatch summary for badges", err);
          }
        });
    }
  }, [hasPermission]);

  const displayName = [user?.name, user?.fullName, user?.email].find(Boolean) || '';
  const roleName = (user?.role && typeof user.role === 'object')
    ? (user.role.key || user.role.name || '')
    : (typeof user?.role === 'string' && (user.role.includes(' ') || user.role.includes('_')) ? user.role : '');
  const roleLabel = roleName ? String(roleName).toLowerCase().replace(/_/g, ' ') : '';
  const initials = displayName
    ? displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : (user?.email ? String(user.email).charAt(0).toUpperCase() : '');

  const visibleMenuConfig = menuConfig.map(section => {
    if (section.category === 'DRIVER PORTAL' && roleLabel !== 'driver') {
      return { ...section, items: [] };
    }
    const allowedItems = section.items.map(item => {
      if (item.subItems) {
        const allowedSubItems = item.subItems.filter(sub => {
          if (roleLabel === 'finance' && sub.id === 'finance') return false;
          return !sub.permission || hasPermission(sub.permission);
        });
        return { ...item, subItems: allowedSubItems };
      }
      return item;
    }).filter(item => {
      if (item.subItems) return item.subItems.length > 0 && (!item.permission || hasPermission(item.permission));
      if (!item.permission) return true;
      return hasPermission(item.permission);
    }).map(item => {
      // Inject dynamic badges based on dispatch board summary
      if (dispatchSummary) {
        if (item.id === 'vehicle-ops') {
          return { ...item, badge: String(dispatchSummary.availableVehicles || 0), badgeColor: 'black' };
        }
        if (item.id === 'drivers') {
          return { ...item, badge: String(dispatchSummary.availableDrivers || 0), badgeColor: 'black' };
        }
        if (item.id === 'dispatch') {
          const unassigned = dispatchSummary.unassignedTrips || 0;
          return { ...item, badge: String(unassigned), badgeColor: unassigned > 0 ? 'warning' : 'black' };
        }
      }
      return item;
    });
    return { ...section, items: allowedItems };
  }).filter(section => section.items.length > 0);

  const handleToggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <Box
          sx={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <img src={settings?.logo || "/fleet-logo.jpg"} alt="Fleet Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 900, lineHeight: 1.2, color: isDark ? '#fff' : '#0F265C', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', }}>
            FLEET MANAGEMENT
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
                const isExpanded = openMenus[item.id];
                const isSubItemActive = item.subItems && item.subItems.some(sub => sub.id === activeTab);
                const isActive = activeTab === item.id || isSubItemActive;

                const renderItem = (i, isSub = false) => {
                  const isIActive = activeTab === i.id;
                  return (
                    <ListItem key={i.id} disablePadding sx={{ mb: '4px', px: isSub ? '24px' : '12px' }}>
                      <ListItemButton
                        onClick={() => i.subItems ? handleToggleMenu(i.id) : setActiveTab(i.id)}
                        sx={{
                          borderRadius: '8px',
                          py: '6px',
                          px: '12px',
                          backgroundColor: isIActive ? (isDark ? 'rgba(25, 118, 210, 0.15)' : '#E3F2FD') : 'transparent',
                          color: isIActive ? '#1976d2' : (isDark ? '#CBD5E1' : '#475569'),
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: isIActive ? (isDark ? 'rgba(25, 118, 210, 0.25)' : '#BBDEFB') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                            color: isIActive ? '#1976d2' : (isDark ? '#F8FAFC' : '#0F172A'),
                            '& .MuiListItemIcon-root': {
                              color: isIActive ? '#1976d2' : (isDark ? '#F8FAFC' : '#0F172A')
                            }
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: '32px',
                            color: isIActive ? '#1976d2' : 'text.secondary',
                            '& svg': { fontSize: isSub ? '18px' : '20px' }
                          }}
                        >
                          {i.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: isIActive ? 600 : 500 }}>
                              {i.label}
                            </Typography>
                          }
                        />
                        {i.badge && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '18px',
                              minWidth: '18px',
                              borderRadius: '50%',
                              backgroundColor: i.badgeColor === 'black' ? (isDark ? '#333' : '#111827') : i.badgeColor === 'error' ? 'rgba(239, 68, 68, 0.15)' : i.badgeColor === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(3, 169, 244, 0.15)',
                              border: `1px solid ${i.badgeColor === 'black' ? (isDark ? '#444' : '#000') : i.badgeColor === 'error' ? 'rgba(239, 68, 68, 0.3)' : i.badgeColor === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(3, 169, 244, 0.3)'}`,
                              color: i.badgeColor === 'black' ? '#ffffff' : i.badgeColor === 'error' ? '#ef4444' : i.badgeColor === 'warning' ? '#f59e0b' : '#03a9f4',
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              px: 0.5,
                              letterSpacing: '0.03em'
                            }}
                          >
                            {i.badge}
                          </Box>
                        )}
                        {i.subItems && (openMenus[i.id] ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />)}
                      </ListItemButton>
                    </ListItem>
                  );
                };

                return (
                  <React.Fragment key={item.id}>
                    {renderItem(item)}
                    {item.subItems && (
                      <Collapse in={openMenus[item.id]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.subItems.map((sub) => renderItem(sub, true))}
                        </List>
                      </Collapse>
                    )}
                  </React.Fragment>
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
    </Box >
  );
}
