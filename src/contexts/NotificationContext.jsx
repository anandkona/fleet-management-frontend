import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useSnackbar } from 'notistack';
import { notificationService } from '../services/api';

const NotificationContext = createContext();

const normalizeNotification = (item) => ({
  id: item.id || item._id || item.uuid || `${item.type || 'notification'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: item.title || item.subject || item.message || 'Notification',
  message: item.message || item.body || item.description || '',
  type: item.type || item.variant || 'info',
  read: Boolean(item.read ?? item.isRead ?? item.readAt),
  timestamp: item.timestamp || item.createdAt || item.created_at || item.date || new Date().toISOString(),
  source: 'api'
});

const normalizeNotifications = (payload) => {
  if (Array.isArray(payload)) return payload.map(normalizeNotification);
  if (Array.isArray(payload?.notifications)) return payload.notifications.map(normalizeNotification);
  if (Array.isArray(payload?.data)) return payload.data.map(normalizeNotification);
  if (Array.isArray(payload?.items)) return payload.items.map(normalizeNotification);
  return [];
};

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { enqueueSnackbar } = useSnackbar();

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('fleet_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    localStorage.setItem('fleet_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const syncNotifications = useCallback(async () => {
    const token = Cookies.get('fleet_token');
    if (!token) return;

    setLoadingNotifications(true);
    try {
      const res = await notificationService.getAll();
      const apiNotifications = normalizeNotifications(res.data?.data || res.data?.notifications || res.data || []);

      setNotifications((prev) => {
        const localOnly = prev.filter((item) => item.source !== 'api');
        return [...apiNotifications, ...localOnly].slice(0, 50);
      });
    } catch (error) {
      if (error.response?.status !== 401) {
        console.warn('Unable to load notifications from API:', error);
      }
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    syncNotifications();
  }, [syncNotifications]);

  const addNotification = useCallback((title, message, type = 'info') => {
    enqueueSnackbar(title, { variant: type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info' });

    const newNotification = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString(),
      source: 'local'
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
  }, [enqueueSnackbar]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    notificationService.markAsRead(id).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificationService.markAllAsRead().catch(() => {});
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loadingNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        clearNotification,
        refreshNotifications: syncNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
