import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

const THEME_COLORS = [
  { name: 'Teal',       value: '#00C2A8', light: '#e6faf6', dark: '#00C2A8' },
  { name: 'Blue',       value: '#1a6fd4', light: '#e8f1fc', dark: '#60a5fa' },
  { name: 'Indigo',     value: '#4f46e5', light: '#eef2ff', dark: '#818cf8' },
  { name: 'Purple',     value: '#7c3aed', light: '#f5f3ff', dark: '#a78bfa' },
  { name: 'Pink',       value: '#db2777', light: '#fdf2f8', dark: '#f472b6' },
  { name: 'Rose',       value: '#e11d48', light: '#fff1f2', dark: '#fb7185' },
  { name: 'Orange',     value: '#ea580c', light: '#fff7ed', dark: '#fb923c' },
  { name: 'Amber',      value: '#d97706', light: '#fffbeb', dark: '#fbbf24' },
  { name: 'Emerald',    value: '#059669', light: '#ecfdf5', dark: '#34d399' },
  { name: 'Cyan',       value: '#0891b2', light: '#ecfeff', dark: '#22d3ee' },
  { name: 'Slate',      value: '#475569', light: '#f8fafc', dark: '#94a3b8' },
  { name: 'Crimson',    value: '#dc2626', light: '#fef2f2', dark: '#f87171' },
];

const DARK_PALETTES = {
  bg:       { default: '#0b1120', paper: '#131c31', elevated: '#1a2540' },
  surface:  { primary: '#1e2d4a', secondary: '#253352', hover: '#2a3a5c' },
  border:   { light: '#1e2d4a', medium: '#2a3a5c', strong: '#374969' },
  text:     { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b', disabled: '#475569' },
  success:  { main: '#10b981', light: '#064e3b', dark: '#34d399', bg: '#052e16' },
  warning:  { main: '#f59e0b', light: '#78350f', dark: '#fbbf24', bg: '#451a03' },
  error:    { main: '#ef4444', light: '#7f1d1d', dark: '#f87171', bg: '#450a0a' },
  info:     { main: '#3b82f6', light: '#1e3a5f', dark: '#60a5fa', bg: '#172554' },
};

const LIGHT_PALETTES = {
  bg:       { default: '#f8fafc', paper: '#ffffff', elevated: '#ffffff' },
  surface:  { primary: '#ffffff', secondary: '#f8fafc', hover: '#f1f5f9' },
  border:   { light: '#e2e8f0', medium: '#cbd5e1', strong: '#94a3b8' },
  text:     { primary: '#020617', secondary: '#1e293b', muted: '#334155', disabled: '#94a3b8' },
  success:  { main: '#059669', light: '#d1fae5', dark: '#047857', bg: '#ecfdf5' },
  warning:  { main: '#d97706', light: '#fef3c7', dark: '#b45309', bg: '#fffbeb' },
  error:    { main: '#dc2626', light: '#fee2e2', dark: '#b91c1c', bg: '#fef2f2' },
  info:     { main: '#2563eb', light: '#dbeafe', dark: '#1d4ed8', bg: '#eff6ff' },
};

const DEFAULT_SETTINGS = {
  mode: 'light',
  primaryColor: '#00C2A8',
  fontSize: 14,
  language: 'en',
  darkSidebar: true,
  showLabels: true,
  collapsed: false,
  notifications: {
    email: true,
    push: true,
    sms: false,
    maintenance: true,
    fuel: true,
    repairs: true,
  },
};

function buildTheme(settings) {
  const { mode, primaryColor, fontSize } = settings;
  const isDark = mode === 'dark';
  const palette = isDark ? DARK_PALETTES : LIGHT_PALETTES;
  const colorDef = THEME_COLORS.find(c => c.value === primaryColor) || THEME_COLORS[0];

  const primary = isDark ? colorDef.dark : colorDef.value;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
        light: isDark ? `${primary}33` : colorDef.light,
        dark: isDark ? primary : colorDef.value,
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#fbbf24' : '#d97706',
        light: isDark ? '#451a03' : '#fef3c7',
        dark: isDark ? '#f59e0b' : '#b45309',
        contrastText: '#ffffff',
      },
      success: {
        main: palette.success.main,
        light: palette.success.light,
        dark: palette.success.dark,
        contrastText: '#ffffff',
      },
      warning: {
        main: palette.warning.main,
        light: palette.warning.light,
        dark: palette.warning.dark,
        contrastText: '#ffffff',
      },
      error: {
        main: palette.error.main,
        light: palette.error.light,
        dark: palette.error.dark,
        contrastText: '#ffffff',
      },
      info: {
        main: palette.info.main,
        light: palette.info.light,
        dark: palette.info.dark,
        contrastText: '#ffffff',
      },
      background: {
        default: palette.bg.default,
        paper: palette.bg.paper,
      },
      text: {
        primary: palette.text.primary,
        secondary: palette.text.secondary,
        disabled: palette.text.disabled,
      },
      divider: palette.border.light,
      action: {
        active: palette.text.primary,
        hover: palette.surface.hover,
        selected: `${primary}1a`,
        disabled: palette.text.disabled,
        disabledBackground: palette.surface.primary,
      },
    },
    typography: {
      fontFamily: '"Nunito", "Helvetica Neue", Arial, sans-serif',
      fontSize,
      h1: { fontWeight: 700, letterSpacing: '-0.02em', color: palette.text.primary },
      h2: { fontWeight: 700, letterSpacing: '-0.02em', color: palette.text.primary },
      h3: { fontWeight: 600, letterSpacing: '-0.01em', color: palette.text.primary },
      h4: { fontWeight: 600, color: palette.text.primary },
      h5: { fontWeight: 600, color: palette.text.primary },
      h6: { fontWeight: 600, color: palette.text.primary },
      subtitle1: { fontWeight: 500, color: palette.text.primary },
      body1: { fontWeight: 500, color: palette.text.primary },
      body2: { fontWeight: 500, color: palette.text.secondary },
      caption: { fontWeight: 500, color: palette.text.muted },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 10 },
    shadows: isDark ? [
      'none',
      '0 1px 3px rgba(0,0,0,0.2)',
      '0 2px 8px rgba(0,0,0,0.25)',
      '0 4px 16px rgba(0,0,0,0.3)',
      '0 8px 24px rgba(0,0,0,0.35)',
      ...Array(20).fill('0 12px 32px rgba(0,0,0,0.4)'),
    ] : [
      'none',
      '0 1px 3px rgba(0,0,0,0.04)',
      '0 2px 8px rgba(0,0,0,0.06)',
      '0 4px 16px rgba(0,0,0,0.08)',
      '0 8px 24px rgba(0,0,0,0.1)',
      ...Array(20).fill('0 12px 32px rgba(0,0,0,0.12)'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: palette.bg.default,
            color: palette.text.primary,
          },
          '::-webkit-scrollbar': { width: 6, height: 6 },
          '::-webkit-scrollbar-track': { background: 'transparent' },
          '::-webkit-scrollbar-thumb': {
            background: isDark ? palette.border.medium : palette.border.light,
            borderRadius: 3,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
            border: `1px solid ${palette.border.light}`,
            borderRadius: 12,
            backgroundColor: palette.bg.paper,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: palette.bg.paper,
            backgroundImage: 'none',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: '20px', '&:last-child': { paddingBottom: '20px' } },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, px: 2.5, py: 1 },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`,
            boxShadow: `0 2px 8px ${primary}40`,
            '&:hover': {
              background: `linear-gradient(135deg, ${primary}dd 0%, ${primary}aa 100%)`,
              boxShadow: `0 4px 12px ${primary}60`,
            },
          },
          outlined: {
            borderColor: palette.border.medium,
            color: palette.text.primary,
            '&:hover': {
              borderColor: primary,
              backgroundColor: `${primary}0a`,
            },
          },
          text: {
            color: palette.text.primary,
            '&:hover': { backgroundColor: palette.surface.hover },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: palette.text.secondary,
            '&:hover': { backgroundColor: palette.surface.hover },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.75rem' },
          outlined: {
            borderColor: palette.border.medium,
            color: palette.text.secondary,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
            fontSize: '0.875rem',
            borderColor: palette.border.light,
            color: palette.text.primary,
          },
          head: {
            fontWeight: 600,
            background: isDark ? palette.surface.primary : '#FAFBFC',
            color: palette.text.muted,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '12px 16px',
            borderColor: palette.border.light,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: { root: { overflowX: 'auto' } },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: { borderTop: `1px solid ${palette.border.light}` },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: isDark ? palette.surface.primary : 'transparent',
              '& fieldset': { borderColor: palette.border.medium },
              '&:hover fieldset': { borderColor: palette.border.strong },
              '&.Mui-focused fieldset': { borderColor: primary },
            },
            '& .MuiInputLabel-root': { color: palette.text.muted },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            backgroundColor: isDark ? palette.surface.primary : 'transparent',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:hover': { backgroundColor: palette.surface.hover },
            '&.Mui-selected': { backgroundColor: `${primary}1a` },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
            backgroundColor: palette.bg.paper,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { color: palette.text.primary } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 8, height: 6 },
          colorPrimary: { backgroundColor: isDark ? palette.surface.primary : palette.surface.secondary },
        },
      },
      MuiAvatar: {
        styleOverrides: { root: { fontWeight: 700 } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? palette.bg.paper : undefined,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? palette.surface.primary : '#333',
            color: isDark ? palette.text.primary : '#fff',
            fontSize: '0.75rem',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 8 },
          standardSuccess: { backgroundColor: palette.success.bg, color: palette.success.main },
          standardWarning: { backgroundColor: palette.warning.bg, color: palette.warning.main },
          standardError: { backgroundColor: palette.error.bg, color: palette.error.main },
          standardInfo: { backgroundColor: palette.info.bg, color: palette.info.main },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': { color: primary },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: primary },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: palette.text.muted,
            '&.Mui-selected': { color: primary },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: primary },
        },
      },
      MuiBreadcrumbs: {
        styleOverrides: {
          separator: { color: palette.text.muted },
          li: { color: palette.text.secondary },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: { color: primary, '&:hover': { color: `${primary}cc` } },
        },
      },
    },
  });
}

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fleet-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('fleet-settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('fleet-settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  const theme = useMemo(() => buildTheme(settings), [settings]);

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetSettings, themeColors: THEME_COLORS }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeSettings = () => useContext(ThemeContext);
export { THEME_COLORS };
