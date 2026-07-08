import React, { useCallback, Suspense, lazy, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline, CircularProgress, Drawer } from '@mui/material';
import { getTheme } from './theme';
import { useSettings } from '../contexts/SettingsContext';
import FleetSidebar from './FleetSidebar';
import FleetHeader from './FleetHeader';
import api from '../services/api';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LiveTrackingPage = lazy(() => import('./pages/LiveTrackingPage'));
const VehicleOpsPage = lazy(() => import('./pages/VehicleOpsPage'));
const TripLogsPage = lazy(() => import('./pages/TripLogsPage'));
const DriversPage = lazy(() => import('./pages/DriversPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const RepairsPage = lazy(() => import('./pages/RepairsPage'));
const AIInsightsPage = lazy(() => import('./pages/AIInsightsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FuelPage = lazy(() => import('./pages/FuelPage'));
const DispatchBoardPage = lazy(() => import('./pages/DispatchBoardPage'));

const VALID_TABS = ['dashboard', 'tracking', 'dispatch', 'vehicle-ops', 'trip-logs', 'drivers', 'inventory', 'maintenance', 'repairs', 'expenses', 'fuel', 'finance', 'ai-insights', 'reports', 'documents', 'users', 'roles', 'settings'];

const pageMap = {
  dashboard: DashboardPage,
  tracking: LiveTrackingPage,
  dispatch: DispatchBoardPage,
  'vehicle-ops': VehicleOpsPage,
  'trip-logs': TripLogsPage,
  drivers: DriversPage,
  inventory: InventoryPage,
  maintenance: MaintenancePage,
  repairs: RepairsPage,
  expenses: ExpensesPage,
  fuel: FuelPage,
  finance: FinancePage,
  'ai-insights': AIInsightsPage,
  reports: ReportsPage,
  documents: DocumentsPage,
  users: UsersPage,
  roles: RolesPage,
  settings: SettingsPage,
};

const PageLoader = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <CircularProgress size={32} sx={{ color: '#4fc3f7' }} />
  </Box>
);

export default function FleetApp() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = VALID_TABS.includes(tab) ? tab : 'dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const setActiveTab = useCallback((tabId) => {
    navigate(`/${tabId}`, { replace: true });
  }, [navigate]);

  const handleAddVehicle = useCallback(async (type) => {
    try { await api.post('/vehicles', { type }); } catch (err) { console.error(err); }
  }, []);

  const ActivePage = pageMap[activeTab];
  const { themeMode } = useSettings();
  const theme = getTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default' }}>
          <Box component="nav" sx={{ width: { md: '260px' }, flexShrink: { md: 0 } }}>
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: '260px', bgcolor: 'background.paper' },
              }}
            >
              <FleetSidebar activeTab={activeTab} setActiveTab={(tabId) => { setActiveTab(tabId); setMobileOpen(false); }} />
            </Drawer>
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: '260px', bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' },
              }}
              open
            >
              <FleetSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </Drawer>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: { xs: '100%', md: `calc(100% - 260px)` } }}>
            <FleetHeader onAddVehicle={handleAddVehicle} handleDrawerToggle={handleDrawerToggle} />
            <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: '16px', sm: '24px' }, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Suspense fallback={<PageLoader />}>
                {ActivePage ? <ActivePage /> : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', border: '1px dashed #2a2a30', borderRadius: '12px', bgcolor: 'background.paper' }}>
                    <Box component="span" sx={{ color: 'text.primary' }}>{activeTab.replace('-', ' ').toUpperCase()} section is under development.</Box>
                  </Box>
                )}
              </Suspense>
            </Box>
          </Box>
        </Box>
    </ThemeProvider>
  );
}
