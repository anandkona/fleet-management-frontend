import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fleet_user")) || null;
    } catch {
      return null;
    }
  });
  const [permissions, setPermissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fleet_permissions")) || [];
    } catch {
      return [];
    }
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("fleet_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fleet_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authService.me()
      .then((res) => {
        const data = res.data?.data ?? res.data;
        const u = data.user ?? data;
        setUser(u);
        setPermissions(data.permissions ?? []);
        localStorage.setItem("fleet_user", JSON.stringify(u));
        localStorage.setItem("fleet_permissions", JSON.stringify(data.permissions ?? []));
      })
      .catch(() => {
        localStorage.removeItem("fleet_token");
        localStorage.removeItem("fleet_user");
        localStorage.removeItem("fleet_refresh_token");
        localStorage.removeItem("fleet_permissions");
        setUser(null);
        setPermissions([]);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password);
    const payload = res.data?.data ?? res.data;
    
    const token = payload.accessToken || payload.token;
    const refreshToken = payload.refreshToken || "";
    const u = payload.user ?? null;
    const perms = payload.permissions ?? u?.permissions ?? [];

    localStorage.setItem("fleet_token", token);
    localStorage.setItem("fleet_user", JSON.stringify(u));
    localStorage.setItem("fleet_refresh_token", refreshToken);
    localStorage.setItem("fleet_permissions", JSON.stringify(perms));

    setUser(u);
    setPermissions(perms);
    setAccessToken(token);

    return res;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("fleet_refresh_token");
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch { /* ignore */ }
    localStorage.removeItem("fleet_token");
    localStorage.removeItem("fleet_user");
    localStorage.removeItem("fleet_refresh_token");
    localStorage.removeItem("fleet_permissions");
    setUser(null);
    setPermissions([]);
    setAccessToken(null);
  }, []);

  const hasPermission = useCallback((key) => permissions.includes(key), [permissions]);

  return (
    <AuthContext.Provider value={{ user, permissions, accessToken, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
