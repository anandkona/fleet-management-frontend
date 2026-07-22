import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authService } from '../services/api';

const COOKIE_OPTIONS = {
  secure: window.location.protocol === 'https:',
  sameSite: 'Strict',
  path: '/',
};

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('fleet_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const readStoredPermissions = () => {
  try {
    const stored = localStorage.getItem('fleet_permissions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [permissions, setPermissions] = useState(() => readStoredPermissions());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('fleet_token');
    const persistedUser = readStoredUser();
    const persistedPermissions = readStoredPermissions();

    if (!token) {
      setLoading(false);
      return;
    }

    authService.me()
      .then(async (res) => {
        const payload = res.data?.data || res.data;
        const userData = payload?.user || payload?.profile || payload;
        if (userData) {
          setUser(userData);
          localStorage.setItem('fleet_user', JSON.stringify(userData));
        } else if (persistedUser) {
          setUser(persistedUser);
        }

        try {
          const permRes = await authService.getEffectivePermissions();
          const effectivePerms = permRes.data?.data?.effectivePermissions || permRes.data?.effectivePermissions;
          if (effectivePerms && effectivePerms.length > 0) {
            setPermissions(effectivePerms);
            localStorage.setItem('fleet_permissions', JSON.stringify(effectivePerms));
          } else {
            const nextPermissions = payload?.permissions || persistedPermissions;
            if (nextPermissions?.length) {
              setPermissions(nextPermissions);
              localStorage.setItem('fleet_permissions', JSON.stringify(nextPermissions));
            }
          }
        } catch (err) {
          console.warn("Failed to fetch effective permissions, falling back.", err);
          const nextPermissions = payload?.permissions || persistedPermissions;
          if (nextPermissions?.length) {
            setPermissions(nextPermissions);
            localStorage.setItem('fleet_permissions', JSON.stringify(nextPermissions));
          }
        }
      })
      .catch(() => {
        if (persistedUser) {
          setUser(persistedUser);
          if (persistedPermissions.length) {
            setPermissions(persistedPermissions);
          }
        } else {
          Cookies.remove('fleet_token', COOKIE_OPTIONS);
          Cookies.remove('fleet_refresh_token', COOKIE_OPTIONS);
          localStorage.removeItem('fleet_user');
          localStorage.removeItem('fleet_permissions');
          setUser(null);
          setPermissions([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password);
    const data = res.data?.data || res.data;
    const accessToken = data?.accessToken || data?.token || data?.access_token;
    const refreshToken = data?.refreshToken || data?.refresh_token;

    if (accessToken) Cookies.set('fleet_token', accessToken, COOKIE_OPTIONS);
    if (refreshToken) Cookies.set('fleet_refresh_token', refreshToken, COOKIE_OPTIONS);

    const userData = data?.user || data?.profile || null;
    if (userData) {
      localStorage.setItem('fleet_user', JSON.stringify(userData));
      setUser(userData);
    } else {
      try {
        const meRes = await authService.me();
        const meData = meRes.data?.data || meRes.data;
        if (meData) {
          localStorage.setItem('fleet_user', JSON.stringify(meData));
          setUser(meData);
        }
      } catch {
        // ignore and keep the token-only login state
      }
    }

    try {
      const permRes = await authService.getEffectivePermissions();
      const effectivePerms = permRes.data?.data?.effectivePermissions || permRes.data?.effectivePermissions;
      if (effectivePerms && effectivePerms.length > 0) {
        localStorage.setItem('fleet_permissions', JSON.stringify(effectivePerms));
        setPermissions(effectivePerms);
      } else {
        const permissionsPayload = data?.permissions || [];
        if (permissionsPayload.length > 0) {
          localStorage.setItem('fleet_permissions', JSON.stringify(permissionsPayload));
          setPermissions(permissionsPayload);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch effective permissions during login, falling back.", err);
      const permissionsPayload = data?.permissions || [];
      if (permissionsPayload.length > 0) {
        localStorage.setItem('fleet_permissions', JSON.stringify(permissionsPayload));
        setPermissions(permissionsPayload);
      }
    }

    return data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = Cookies.get('fleet_refresh_token');
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // ignore logout API errors
    }
    Cookies.remove('fleet_token', COOKIE_OPTIONS);
    Cookies.remove('fleet_refresh_token', COOKIE_OPTIONS);
    localStorage.removeItem('fleet_user');
    localStorage.removeItem('fleet_permissions');
    setUser(null);
    setPermissions([]);
  }, []);

  const isAuthenticated = !!user && !!Cookies.get('fleet_token');

  const getNormalizedRoleKey = (role) => {
    if (typeof role === 'string') return role.trim().toLowerCase().replace(/\s+/g, '_');
    const key = role?.key || role?.name || '';
    return String(key).trim().toLowerCase().replace(/\s+/g, '_');
  };

  const ROLE_PERMISSION_FALLBACKS = {
    super_admin: ['vehicle_view', 'trip_view', 'driver_view', 'asset_view', 'maintenance_view', 'repair_view', 'expense_view', 'fuel_view', 'finance_view', 'report_view', 'document_metadata_view', 'user_view', 'role_view', 'settings_view', 'dispatch_view', 'compliance_view', 'dispatch_assign', 'driver_submission_view', 'driver_submission_review', 'driver_fuel_approve', 'driver_expense_approve', 'driver_document_verify', 'driver_issue_review', 'driver_inspection_review', 'driver_advance_view', 'driver_settlement_view'],
    admin: ['vehicle_view', 'trip_view', 'driver_view', 'asset_view', 'maintenance_view', 'repair_view', 'expense_view', 'fuel_view', 'finance_view', 'report_view', 'document_metadata_view', 'user_view', 'role_view', 'settings_view', 'dispatch_view', 'compliance_view', 'dispatch_assign', 'driver_submission_view', 'driver_submission_review', 'driver_fuel_approve', 'driver_expense_approve', 'driver_document_verify', 'driver_issue_review', 'driver_inspection_review', 'driver_advance_view', 'driver_settlement_view'],
    supervisor: ['trip_view', 'vehicle_view', 'driver_view', 'report_view'],
    manager: ['trip_view', 'vehicle_view', 'driver_view', 'report_view'],
    mechanic: ['maintenance_view', 'maintenance_create', 'maintenance_update', 'maintenance_submit', 'maintenance_approve', 'repair_view', 'repair_create', 'repair_update', 'repair_close', 'dashboard_view', 'vehicle_view', 'document_metadata_view', 'documents_view', 'documents_download'],
    finance: ['finance_view', 'expense_view', 'report_view', 'document_metadata_view'],
    assistant: ['finance_view', 'expense_view'],
    driver: ['driver_my_dashboard_view', 'driver_my_trips_view', 'driver_my_documents_view', 'driver_my_profile_view', 'driver_advance_view_own', 'driver_settlement_view_own', 'driver_expense_view_own', 'driver_fuel_view_own', 'driver_issue_view_own']
  };

  const hasPermission = useCallback((key) => {
    if (!key) return false;
    const normalizedKey = String(key).trim();
    const roleKey = getNormalizedRoleKey(user?.role);

    // Strictly sandbox drivers and mechanics regardless of backend permissions payload
    if (roleKey === 'driver' || roleKey === 'mechanic') {
      const fallback = ROLE_PERMISSION_FALLBACKS[roleKey];
      return Array.isArray(fallback) && fallback.includes(normalizedKey);
    }

    if (permissions.includes(normalizedKey)) return true;

    const rolePerms = user?.role?.permissions || user?.role?.rolePermissions;
    if (Array.isArray(rolePerms)) {
      const hasRolePerm = rolePerms.some((p) => {
        if (!p) return false;
        if (typeof p === 'string') return p === normalizedKey;
        if (p.permission && p.permission.key) return p.permission.key === normalizedKey;
        if (p.key) return p.key === normalizedKey;
        return false;
      });
      if (hasRolePerm) return true;
    }

    const fallback = ROLE_PERMISSION_FALLBACKS[roleKey];
    return Array.isArray(fallback) && fallback.includes(normalizedKey);
  }, [user, permissions]);

  return (
    <AuthContext.Provider value={{ user, permissions, isAuthenticated, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}
