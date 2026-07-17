import React from 'react';
import { Tabs, Tab, Box, Card, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HandshakeIcon from '@mui/icons-material/Handshake';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentsIcon from '@mui/icons-material/Payments';

const tabsConfig = [
  { label: 'Dashboard', path: '/finance', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
  { label: 'Driver Advances', path: '/advances', icon: <RequestQuoteIcon sx={{ fontSize: 18 }} /> },
  { label: 'Driver Settlements', path: '/settlements', icon: <HandshakeIcon sx={{ fontSize: 18 }} /> },
  { label: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon sx={{ fontSize: 18 }} /> },
  { label: 'Accounts', path: '/accounts', icon: <AccountBalanceIcon sx={{ fontSize: 18 }} /> },

  { label: 'Vendors', path: '/vendors', icon: <BusinessIcon sx={{ fontSize: 18 }} /> },
  { label: 'Customers', path: '/customers', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
  { label: 'POD Chain', path: '/pod-billing', icon: <FactCheckIcon sx={{ fontSize: 18 }} /> },
  { label: 'Trip Billing', path: '/trip-billing', icon: <LocalShippingIcon sx={{ fontSize: 18 }} /> },
  { label: 'Payments', path: '/payments', icon: <PaymentsIcon sx={{ fontSize: 18 }} /> }
];

export default function FinanceTabs({ action }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const currentTab = tabsConfig.findIndex(t => location.pathname === t.path);
  const activeIndex = currentTab === -1 ? 0 : currentTab;

  return (
    <Card sx={{ 
      p: 0, 
      mb: 3, 
      borderRadius: 3, 
      boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)', 
      border: '1px solid', 
      borderColor: 'divider',
      position: 'sticky',
      top: 16,
      zIndex: 1100
    }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ width: '100%' }}>
          <Tabs 
            value={activeIndex} 
            variant="scrollable" 
            scrollButtons="auto" 
            sx={{ px: 2 }}
            indicatorColor="primary"
            textColor="primary"
          >
            {tabsConfig.map((tab, idx) => (
              <Tab 
                key={tab.path}
                icon={tab.icon} 
                iconPosition="start" 
                label={tab.label} 
                onClick={() => navigate(tab.path)}
                sx={{ minHeight: 60, fontWeight: 600, textTransform: 'none', letterSpacing: 0.5 }}
              />
            ))}
          </Tabs>
        </Box>
        {action && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
            {action}
          </Box>
        )}
      </Box>
    </Card>
  );
}
