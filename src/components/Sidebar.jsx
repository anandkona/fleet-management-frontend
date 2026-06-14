import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Avatar, Divider, Tooltip, Stack, Chip,
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
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { PALETTE } from '../theme';
import { useAuth } from '../context/AuthContext';

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
  { path: '/reports',     icon: <ReportsIcon />,     label: 'Reports', perm: 'report_view' },
  { path: '/settings',    icon: <SettingsIcon />,    label: 'Settings', perm: 'settings_view' },
  { path: '/users',       icon: <UsersIcon />,       label: 'Users', perm: 'user_view' },
];

function NavItem({ item, active, onClick }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={onClick}
        sx={{
          mx: 1, borderRadius: 2,
          color: active ? '#fff' : 'rgba(255,255,255,0.55)',
          bgcolor: active ? 'rgba(0,194,168,0.18)' : 'transparent',
          borderLeft: active ? `3px solid ${PALETTE.teal}` : '3px solid transparent',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
          transition: 'all 0.15s',
          py: 1,
        }}
      >
        <ListItemIcon sx={{ color: 'inherit', minWidth: 36, '& svg': { fontSize: 20 } }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
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

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ bgcolor: PALETTE.teal, borderRadius: 2, p: 0.75, display: 'flex' }}>
          <FleetLogo sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#fff', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>
            FleetOS
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Management
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      {/* Nav */}
      <List sx={{ flex: 1, pt: 2 }}>
        {NAV.filter((item) => !item.perm || hasPermission(item.perm)).map((item) => (
          <NavItem
            key={item.path}
            item={item}
            active={pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))}
            onClick={() => handleNav(item.path)}
          />
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      {/* User profile */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', mb: 1 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: PALETTE.teal, fontSize: '0.85rem', fontWeight: 700 }}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }} noWrap>
              {user?.name || 'User'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }} noWrap>
              {user?.role || 'Admin'}
            </Typography>
          </Box>
        </Stack>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: 2, color: 'rgba(255,255,255,0.45)', '&:hover': { color: '#FF5D5D', bgcolor: 'rgba(255,93,93,0.1)' } }}
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
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
