import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

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
    const token = localStorage.getItem('fleet_token');
    const persistedUser = readStoredUser();
    const persistedPermissions = readStoredPermissions();

    if (!token) {
      setLoading(false);
      return;
    }

    authService.me()
      .then((res) => {
        const payload = res.data?.data || res.data;
        const userData = payload?.user || payload?.profile || payload;
        if (userData) {
          setUser(userData);
          localStorage.setItem('fleet_user', JSON.stringify(userData));
        } else if (persistedUser) {
          setUser(persistedUser);
        }

        const nextPermissions = payload?.permissions || persistedPermissions;
        if (nextPermissions?.length) {
          setPermissions(nextPermissions);
          localStorage.setItem('fleet_permissions', JSON.stringify(nextPermissions));
        }
      })
      .catch(() => {
        if (persistedUser) {
          setUser(persistedUser);
          if (persistedPermissions.length) {
            setPermissions(persistedPermissions);
          }
        } else {
          localStorage.removeItem('fleet_token');
          localStorage.removeItem('fleet_user');
          localStorage.removeItem('fleet_refresh_token');
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

    if (accessToken) localStorage.setItem('fleet_token', accessToken);
    if (refreshToken) localStorage.setItem('fleet_refresh_token', refreshToken);

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

    const permissionsPayload = data?.permissions || [];
    if (permissionsPayload.length > 0) {
      localStorage.setItem('fleet_permissions', JSON.stringify(permissionsPayload));
      setPermissions(permissionsPayload);
    }

    return data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('fleet_refresh_token');
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // ignore logout API errors
    }
    localStorage.removeItem('fleet_token');
    localStorage.removeItem('fleet_user');
    localStorage.removeItem('fleet_refresh_token');
    localStorage.removeItem('fleet_permissions');
    setUser(null);
    setPermissions([]);
  }, []);

  const isAuthenticated = !!user && !!localStorage.getItem('fleet_token');

  const getNormalizedRoleKey = (role) => {
    const key = role?.key || role?.name || '';
    return String(key).trim().toLowerCase().replace(/\s+/g, '_');
  };

  const ROLE_PERMISSION_FALLBACKS = {
    super_admin: ['vehicle_view', 'trip_view', 'driver_view', 'asset_view', 'maintenance_view', 'repair_view', 'expense_view', 'finance_view', 'report_view', 'document_metadata_view', 'user_view', 'role_view', 'settings_view'],
    admin: ['vehicle_view', 'trip_view', 'driver_view', 'asset_view', 'maintenance_view', 'repair_view', 'expense_view', 'finance_view', 'report_view', 'document_metadata_view', 'user_view', 'role_view', 'settings_view'],
    supervisor: ['trip_view', 'vehicle_view', 'driver_view', 'report_view'],
    manager: ['trip_view', 'vehicle_view', 'driver_view', 'report_view'],
    mechanic: ['maintenance_view', 'repair_view'],
    finance: ['finance_view', 'expense_view', 'report_view', 'document_metadata_view'],
    assistant: ['finance_view', 'expense_view'],
    driver: ['trip_view']
  };

  const hasPermission = useCallback((key) => {
    if (!key) return false;
    const normalizedKey = String(key).trim();
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

    const roleKey = getNormalizedRoleKey(user?.role);
    const fallback = ROLE_PERMISSION_FALLBACKS[roleKey];
    return Array.isArray(fallback) && fallback.includes(normalizedKey);
  }, [user, permissions]);

  return (
    <AuthContext.Provider value={{ user, permissions, isAuthenticated, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}
