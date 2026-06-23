import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Avatar, Menu, MenuItem,
  Divider, Stack, useMediaQuery, Chip, Tooltip, Collapse,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon, Dashboard, DirectionsCar, Person, People, Shield,
  Logout, Inventory2, LocalShipping, Category, ExpandLess, ExpandMore,
  LocalGasStation, Route,   BuildCircle, Build, Receipt, AccountBalance,
  Assessment, Settings,  AdminPanelSettings
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { PALETTE } from '../theme';
import Swal from 'sweetalert2';

const SIDEBAR_W = 250;

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { label: 'Vehicles', path: '/vehicles', icon: <DirectionsCar />, perm: 'vehicle_view' },
  { label: 'Drivers', path: '/drivers', icon: <Person />, perm: 'driver_view' },
  { label: 'Fuel', path: '/fuel', icon: <LocalGasStation />, perm: 'fuel_view' },
  { label: 'Trips', path: '/trips', icon: <Route />, perm: 'trip_view' },
  { label: 'Repairs', path: '/repairs', icon: <BuildCircle />, perm: 'repair_view' },
  { label: 'Maintenance', path: '/maintenance', icon: <Build />, perm: 'repair_view' },
  { label: 'Expense', path: '/expense', icon: <Receipt />, perm: 'expense_view' },
  { label: 'Finance', path: '/finance', icon: <AccountBalance />, perm: 'finance_view' },
  {
    label: 'Master', icon: <AdminPanelSettings />,
    children: [
      { label: 'Assets', path: '/assets', icon: <Inventory2 />, perm: 'asset_view' },
    ],
  },
  { label: 'Users', path: '/users', icon: <People />, perm: 'user_view' },
    
  { label: 'Roles', path: '/roles', icon: <Shield />, perm: 'role_view' },
  { label: 'Settings', path: '/settings', icon: <Settings />, perm: 'settings_view' },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [openItems, setOpenItems] = useState({ 'Assets': true, 'Master': false });
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleItem = (label) => {
    setOpenItems(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  const sidebar = (
    <Box sx={{ width: SIDEBAR_W, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: PALETTE.navy }}>
      {/* Logo */}
      <Box sx={{ px: 2, py: 2, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          bgcolor: '#fff',
          borderRadius: 1,
          p: 1.5,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <img
            src="/hippo fleet.png"
            alt="Hippo Fleet Logo"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Nav */}
      <List sx={{ flex: 1, px: 1.5, py: 2, overflow: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        {NAV.filter((item) => !item.perm || hasPermission(item.perm)).map((item) => {
          const active = item.children
            ? location.pathname === item.path || item.children.some((c) => location.pathname === c.path)
            : location.pathname === item.path;
          const hasChildren = !!item.children;

          if (hasChildren) {
            return (
              <React.Fragment key={item.label}>
                <ListItemButton
                  onClick={() => toggleItem(item.label)}
                  sx={{
                    borderRadius: 2, mb: 0.5, px: 2, py: 1.2,
                    bgcolor: active ? 'rgba(0,194,168,0.15)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    '&:hover': { bgcolor: active ? 'rgba(0,194,168,0.2)' : 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: active ? PALETTE.teal : 'rgba(255,255,255,0.45)' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { color: 'inherit' } }} primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: '0.88rem' }} />
                  {openItems[item.label] ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.45)' }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.45)' }} />}
                </ListItemButton>
                <Collapse in={openItems[item.label]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => {
                      const childActive = location.pathname === child.path;
                      return (
                        <ListItemButton
                          key={child.path}
                          onClick={() => handleNav(child.path)}
                          sx={{
                            borderRadius: 2, mb: 0.5, ml: 2, mr: 1, px: 2, py: 0.9,
                            bgcolor: childActive ? 'rgba(0,194,168,0.12)' : 'transparent',
                            color: childActive ? '#fff' : 'rgba(255,255,255,0.45)',
                            '&:hover': { bgcolor: childActive ? 'rgba(0,194,168,0.18)' : 'rgba(255,255,255,0.04)' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 30, color: childActive ? PALETTE.teal : 'rgba(255,255,255,0.35)' }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText primary={child.label} sx={{ '& .MuiTypography-root': { color: 'inherit' } }} primaryTypographyProps={{ fontWeight: childActive ? 600 : 400, fontSize: '0.82rem' }} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: 2, mb: 0.5, px: 2, py: 1.2,
                bgcolor: active ? 'rgba(0,194,168,0.15)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                '&:hover': { bgcolor: active ? 'rgba(0,194,168,0.2)' : 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? PALETTE.teal : 'rgba(255,255,255,0.45)' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { color: 'inherit' } }} primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: '0.88rem' }} />
              {active && <Box sx={{ width: 3, height: 14, borderRadius: 2, bgcolor: PALETTE.teal }} />}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* User */}
      <Box sx={{ px: 2, py: 2, bgcolor: 'rgba(0,0,0,0.15)' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(0,194,168,0.25)', color: PALETTE.teal, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.role?.name || '—'}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <>
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Box sx={{ 
          width: SIDEBAR_W, flexShrink: 0, height: '100vh', overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '1px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255,255,255,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,194,168,0.4)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(0,194,168,0.6)',
            },
          },
        }}>
          {sidebar}
        </Box>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Box
          onClick={() => setMobileOpen(false)}
          sx={{
            position: 'fixed', inset: 0, zIndex: 1300,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: mobileOpen ? 'block' : 'none',
          }}
        />
      )}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: SIDEBAR_W, zIndex: 1301,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            overflow: 'hidden',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255,255,255,0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,194,168,0.4)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(0,194,168,0.6)',
              },
            },
          }}
        >
          {sidebar}
        </Box>
      )}

      {/* Right side */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        {/* Top bar */}
        <Box sx={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', px: { xs: 1, sm: 3 }, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }} />
          {!isMobile && (
            <Chip label={user?.role?.name || 'User'} size="small" sx={{ mr: 1.5, fontWeight: 600, bgcolor: `${PALETTE.teal}10`, color: PALETTE.teal, border: `1px solid ${PALETTE.teal}25` }} />
          )}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: `${PALETTE.teal}20`, color: PALETTE.teal, fontSize: '0.75rem', fontWeight: 700 }}>
              {(user?.name || 'U')[0].toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
            <MenuItem disabled><Typography variant="body2" color="text.secondary">{user?.email}</Typography></MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
          <Box sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1.5, sm: 3 }, minWidth: 0 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
    <Dialog
      open={logoutDialogOpen}
      onClose={handleCancelLogout}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 1,
          minWidth: 320,
        }
      }}
    >
      <DialogTitle sx={{ color: '#EF4444', pb: 1 }}>
        Confirm Logout
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to logout?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={handleCancelLogout}
          variant="text"
          sx={{color:'#888'}}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmLogout}
          variant="contained"
          color="error"
          autoFocus
        >
          Logout
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
