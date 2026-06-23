import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Avatar, Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  Route as TripIcon,
  Build as MaintenanceIcon,
  LocalGasStation as FuelIcon,
  People as UsersIcon,
  ExitToApp as LogoutIcon,
  ElectricCar as FleetLogo,
  Settings as SettingsIcon,
  Receipt as ExpenseIcon,
  AccountBalance as FinanceIcon,
  BuildCircle as RepairsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeSettings } from '../context/ThemeContext';

const DRAWER_WIDTH = 240;

const NAV = [
  { path: '/',            icon: <DashboardIcon />,   label: 'Dashboard' },
  { path: '/vehicles',    icon: <VehicleIcon />,     label: 'Vehicles', perm: 'vehicle_view' },
  { path: '/drivers',     icon: <DriverIcon />,      label: 'Drivers', perm: 'driver_view' },
  { path: '/fuel',        icon: <FuelIcon />,        label: 'Fuel', perm: 'fuel_view' },
  { path: '/trips',       icon: <TripIcon />,        label: 'Trips', perm: 'trip_view' },
  { path: '/repairs',     icon: <RepairsIcon />,     label: 'Repairs', perm: 'repair_view' },
  { path: '/maintenance', icon: <MaintenanceIcon />, label: 'Maintenance', perm: 'repair_view' },
  { path: '/expense',     icon: <ExpenseIcon />,     label: 'Expense', perm: 'expense_view' },
  { path: '/finance',     icon: <FinanceIcon />,     label: 'Finance', perm: 'finance_view' },
  { path: '/settings',    icon: <SettingsIcon />,    label: 'Settings', perm: 'settings_view' },
  { path: '/users',       icon: <UsersIcon />,       label: 'Users', perm: 'user_view' },
];

function NavItem({ item, active, onClick, isDark, primaryColor }) {
  const textColor = active ? '#fff' : isDark ? 'rgba(255,255,255,0.55)' : '#6b7280';
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={onClick}
        sx={{
          mx: 1, borderRadius: 2,
          color: textColor,
          bgcolor: active ? `${primaryColor}2e` : 'transparent',
          borderLeft: active ? `3px solid ${primaryColor}` : '3px solid transparent',
          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: isDark ? '#fff' : '#000' },
          transition: 'all 0.15s',
          py: 1,
        }}
      >
        <ListItemIcon sx={{ color: 'inherit', minWidth: 36, '& svg': { fontSize: 20 } }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          sx={{ '& .MuiTypography-root': { color: textColor } }}
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default function Sidebar({ mobileOpen, onClose, variant = 'persistent' }) {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { settings } = useThemeSettings();
  const primaryColor = settings?.primaryColor || '#00C2A8';
  const isDark = settings?.mode === 'dark';

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ bgcolor: primaryColor, borderRadius: 2, p: 0.75, display: 'flex' }}>
          <FleetLogo sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ color: isDark ? '#fff' : '#1a2535', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>
            FleetOS
          </Typography>
          <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Management
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', mx: 2 }} />

      {/* Nav */}
      <List sx={{ flex: 1, pt: 2 }}>
        {NAV.filter((item) => !item.perm || hasPermission(item.perm)).map((item) => (
          <NavItem
            key={item.path}
            item={item}
            active={pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))}
            onClick={() => handleNav(item.path)}
            isDark={isDark}
            primaryColor={primaryColor}
          />
        ))}
      </List>

      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', mx: 2 }} />

      {/* User profile */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', mb: 1 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: primaryColor, fontSize: '0.85rem', fontWeight: 700 }}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: isDark ? '#fff' : '#1a2535', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }} noWrap>
              {user?.name || 'User'}
            </Typography>
            <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.7rem' }} noWrap>
              {user?.role || 'Admin'}
            </Typography>
          </Box>
        </Stack>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: 2, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', '&:hover': { color: '#FF5D5D', bgcolor: 'rgba(255,93,93,0.1)' } }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}><LogoutIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: '0.8rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant === 'temporary' ? 'temporary' : 'permanent'}
      open={variant === 'temporary' ? mobileOpen : true}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: isDark ? '#0b1120' : '#ffffff',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
