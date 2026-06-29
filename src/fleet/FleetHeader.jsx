import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { DarkMode, LightMode } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { useSettings } from '../contexts/SettingsContext';

function FleetHeader({ onAddVehicle, handleDrawerToggle }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [vehicleType, setVehicleType] = useState('TRUCK');
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { themeMode, toggleThemeMode } = useSettings();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      + ' • ' + currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  }, [currentTime]);

  const handleConfirmAdd = async () => {
    await onAddVehicle(vehicleType);
    setOpenDialog(false);
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
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', display: { xs: 'none', sm: 'block' } }}>
          Fleet Dashboard
        </Typography>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid #2d2d35',
            borderRadius: '20px',
            p: '6px 16px',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2 }}>
            {today}
          </Typography>
        </Box>
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

        <IconButton sx={{ border: '1px solid', borderColor: 'divider', p: '8px', borderRadius: '50%', color: 'text.primary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
          <Badge badgeContent={6} sx={{ '& .MuiBadge-badge': { backgroundColor: '#1976d2', color: '#fff' } }}>
            <NotificationsIcon sx={{ fontSize: '20px' }} />
          </Badge>
        </IconButton>

        <Button variant="contained" onClick={() => setOpenDialog(true)} sx={{ backgroundColor: '#1976d2', px: { xs: '8px', sm: '18px' }, py: { xs: '4px', sm: '8px' }, color: '#fff', fontSize: { xs: '0.75rem', sm: '0.875rem' }, '&:hover': { backgroundColor: '#1565c0' }, minWidth: { xs: 'auto', sm: '120px' } }}>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>+ Add Vehicle</Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>+ Add</Box>
        </Button>

        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ border: '1px solid', borderColor: 'divider', p: '8px', borderRadius: '50%', color: 'text.primary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
          <MoreHorizIcon sx={{ fontSize: '20px' }} />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => setAnchorEl(null)}>Configure Widgets</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>Export PDF Report</MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings', { replace: true }); }}>Settings</MenuItem>
        </Menu>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Add New Vehicle</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', minWidth: '300px', pt: 2 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: 'text.primary' }}>Vehicle Type</InputLabel>
            <Select
              value={vehicleType}
              label="Vehicle Type"
              onChange={(e) => setVehicleType(e.target.value)}
              sx={{ color: 'text.primary', backgroundColor: 'background.default', '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' } }}
            >
              <MenuItem value="TRUCK">Truck</MenuItem>
              <MenuItem value="VAN">Van</MenuItem>
              <MenuItem value="CAR">Car</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: '16px' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmAdd} sx={{ backgroundColor: '#1976d2' }}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default React.memo(FleetHeader);
