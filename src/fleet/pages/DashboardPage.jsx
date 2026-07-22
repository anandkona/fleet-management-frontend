import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import FleetManagerDashboard from './dashboards/FleetManagerDashboard';
import DriverDashboard from './DriverDashboard';
import MaintenanceManagerDashboard from './dashboards/MaintenanceManagerDashboard';
import FuelManagerDashboard from './dashboards/FuelManagerDashboard';
import DispatcherDashboard from './dashboards/DispatcherDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';
import InventoryManagerDashboard from './dashboards/InventoryManagerDashboard';
import HrManagerDashboard from './dashboards/HrManagerDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const roleName = user?.role?.name || user?.role?.key || user?.role || 'user';
  const roleLabel = typeof roleName === 'string' ? roleName.toLowerCase().replace(/_/g, ' ') : 'user';

  if (roleLabel === 'driver') {
    return <DriverDashboard />;
  }
  
  if (roleLabel === 'fleet manager' || roleLabel === 'fleet') {
    return <FleetManagerDashboard />;
  }

  if (roleLabel === 'maintenance manager' || roleLabel === 'mechanic' || roleLabel === 'maintenance') {
    return <MaintenanceManagerDashboard />;
  }

  if (roleLabel === 'fuel manager' || roleLabel === 'fuel') {
    return <FuelManagerDashboard />;
  }

  if (roleLabel === 'dispatcher' || roleLabel === 'dispatch') {
    return <DispatcherDashboard />;
  }

  if (roleLabel === 'accountant' || roleLabel === 'finance') {
    return <AccountantDashboard />;
  }

  if (roleLabel === 'inventory manager' || roleLabel === 'inventory') {
    return <InventoryManagerDashboard />;
  }

  if (roleLabel === 'hr manager' || roleLabel === 'user manager' || roleLabel === 'hr') {
    return <HrManagerDashboard />;
  }

  // Default to Super Admin for admin, super_admin, or unknown roles (for fallback)
  return <SuperAdminDashboard />;
}
