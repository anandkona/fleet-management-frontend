import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode Colors
          background: {
            default: '#f8fafc',
            paper: '#ffffff',
          },
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#9c27b0',
          },
          success: {
            main: '#2e7d32',
            light: '#4caf50',
          },
          warning: {
            main: '#ed6c02',
            light: '#ff9800',
          },
          error: {
            main: '#d32f2f',
            light: '#ef5350',
          },
          info: {
            main: '#0288d1',
            light: '#03a9f4',
          },
          text: {
            primary: '#000000', // Made darker
            secondary: '#475569', // Made darker
          },
          divider: '#e2e8f0',
        }
      : {
          // Dark Mode Colors
          background: {
            default: '#121212',
            paper: '#18181c',
          },
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#9c27b0',
          },
          success: {
            main: '#2e7d32',
            light: '#4caf50',
          },
          warning: {
            main: '#ed6c02',
            light: '#ff9800',
          },
          error: {
            main: '#d32f2f',
            light: '#ef5350',
          },
          info: {
            main: '#0288d1',
            light: '#03a9f4',
          },
          text: {
            primary: '#ffffff',
            secondary: '#e2e8f0', // Made brighter for better contrast
          },
          divider: '#2a2a30',
        }),
  },
  typography: {
    fontFamily: '"Nunito", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 800 }, // Bolder
    h2: { fontSize: '1.5rem', fontWeight: 700 }, // Bolder
    h6: { fontSize: '1.1rem', fontWeight: 700 }, // Bolder
    body1: { fontSize: '0.95rem', lineHeight: 1.5, fontWeight: 500 }, // Bolder
    body2: { fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 500 }, // Bolder
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          borderRadius: '12px',
          border: `1px solid ${theme.palette.divider}`,
          padding: '16px',
          boxShadow: theme.palette.mode === 'dark' 
            ? 'none' 
            : '0 4px 20px 0 rgba(15, 23, 42, 0.04)',
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
        }),
      },
    }
  },
});

// For backward compatibility until full refactor is complete
export const theme = getTheme('dark');
