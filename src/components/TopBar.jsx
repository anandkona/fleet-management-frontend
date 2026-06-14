import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Stack, Badge, Avatar, useTheme } from '@mui/material';
import { Menu as MenuIcon, Notifications as BellIcon } from '@mui/icons-material';
import { DRAWER_WIDTH } from './Sidebar';
import { PALETTE } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml:    { md: `${DRAWER_WIDTH}px` },
        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton color="inherit" size="small">
            <Badge badgeContent={3} color="secondary">
              <BellIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: PALETTE.teal, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </Avatar>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
