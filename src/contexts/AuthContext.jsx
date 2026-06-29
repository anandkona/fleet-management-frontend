import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('fleet_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem('fleet_permissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fleet_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService.me()
      .then((res) => {
        const userData = res.data?.data || res.data;
        setUser(userData);
        localStorage.setItem('fleet_user', JSON.stringify(userData));
        if (userData.permissions) {
          setPermissions(userData.permissions);
          localStorage.setItem('fleet_permissions', JSON.stringify(userData.permissions));
        }
      })
      .catch(() => {
        localStorage.removeItem('fleet_token');
        localStorage.removeItem('fleet_user');
        localStorage.removeItem('fleet_refresh_token');
        localStorage.removeItem('fleet_permissions');
        setUser(null);
        setPermissions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password);
    const data = res.data?.data || res.data;
    if (data.accessToken) localStorage.setItem('fleet_token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('fleet_refresh_token', data.refreshToken);
    if (data.user) {
      localStorage.setItem('fleet_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    if (data.permissions) {
      localStorage.setItem('fleet_permissions', JSON.stringify(data.permissions));
      setPermissions(data.permissions);
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

  const hasPermission = useCallback((key) => {
    if (user?.role?.key === 'super_admin' || user?.role?.name === 'Super Admin') return true;
    return permissions.includes(key);
  }, [user, permissions]);

  return (
    <AuthContext.Provider value={{ user, permissions, isAuthenticated, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}
