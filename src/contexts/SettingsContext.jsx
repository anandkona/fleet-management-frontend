import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const defaultSettings = {
  themeMode: 'dark', // 'light' | 'dark'
  companyName: 'Hippo Fleet Logistics',
  currency: 'USD',
  distanceUnit: 'km',
  timezone: 'UTC',
  lowFuelAlert: 20,
  maintenanceDueDays: 7
};

const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('fleet_settings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Persist settings whenever they change
  useEffect(() => {
    localStorage.setItem('fleet_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleThemeMode = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      themeMode: prev.themeMode === 'light' ? 'dark' : 'light'
    }));
  }, []);

  const setThemeMode = useCallback((mode) => {
    setSettings(prev => ({ ...prev, themeMode: mode }));
  }, []);

  const value = useMemo(() => ({
    settings,
    updateSettings,
    toggleThemeMode,
    setThemeMode,
    themeMode: settings.themeMode,
  }), [settings, updateSettings, toggleThemeMode, setThemeMode]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
