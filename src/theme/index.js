import { createTheme, alpha } from '@mui/material/styles';

const PALETTE = {
  navy:   '#0D1B2A',
  slate:  '#1C2E40',
  steel:  '#2A4158',
  teal:   '#00C2A8',
  amber:  '#F5A623',
  coral:  '#FF5D5D',
  cloud:  '#EFF4F8',
  mist:   '#C8D8E8',
  text:   '#1A2535',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: PALETTE.teal, contrastText: '#fff' },
    secondary: { main: PALETTE.amber, contrastText: '#fff' },
    error:     { main: PALETTE.coral },
    background:{ default: '#F5F7FA', paper: '#ffffff' },
    text:      { primary: PALETTE.text, secondary: '#6B7A8D' },
    divider:   '#E8ECF0',
    navy:      { main: PALETTE.navy },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button:    { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 10 },
  shadows: [
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
        body: { background: '#F5F7FA' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: PALETTE.mist, borderRadius: 3 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          border: '1px solid #E8ECF0',
          borderRadius: 12,
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
          background: `linear-gradient(135deg, ${PALETTE.teal} 0%, #00A896 100%)`,
          boxShadow: '0 2px 8px rgba(0,194,168,0.3)',
          '&:hover': { background: `linear-gradient(135deg, #00A896 0%, #009688 100%)`, boxShadow: '0 4px 12px rgba(0,194,168,0.4)' },
        },
        outlined: { borderColor: '#D0D5DD' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '12px 16px', fontSize: '0.875rem', borderColor: '#F0F2F5' },
        head: {
          fontWeight: 600,
          background: '#FAFBFC',
          color: '#6B7A8D',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '12px 16px',
          borderColor: '#E8ECF0',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { overflowX: 'auto' },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: '1px solid #F0F2F5' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: '#D0D5DD' },
            '&:hover fieldset': { borderColor: '#B0B8C4' },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8, height: 6 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

export default theme;
export { PALETTE };
