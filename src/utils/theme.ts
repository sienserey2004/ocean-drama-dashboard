import { createTheme } from '@mui/material/styles'
// If Vite continues to have issues with named exports, this is sometimes the fallback:
// import createTheme from '@mui/material/styles/createTheme';

const sharedTypography = {
  fontFamily: "'Inter', system-ui, sans-serif",
  h1: { fontSize: '1.75rem', fontWeight: 600 },
  h2: { fontSize: '1.375rem', fontWeight: 600 },
  h3: { fontSize: '1.125rem', fontWeight: 600 },
  h4: { fontSize: '1rem',    fontWeight: 600 },
  h5: { fontSize: '0.875rem', fontWeight: 500 },
  h6: { fontSize: '0.8125rem', fontWeight: 500 },
  body1: { fontSize: '0.875rem' },
  body2: { fontSize: '0.8125rem' },
  caption: { fontSize: '0.75rem' },
}

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: { textTransform: 'none' as const, fontWeight: 500, borderRadius: 8 },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 12, boxShadow: 'none' },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 99, fontSize: '0.75rem' },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: { fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
      body: { fontSize: '0.8125rem' },
    },
  },
  MuiTextField: { defaultProps: { size: 'small' as const } },
  MuiSelect:    { defaultProps: { size: 'small' as const } },
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#185FA5', dark: '#0C447C', light: '#E6F1FB' },
    secondary:  { main: '#534AB7', light: '#EEEDFE' },
    success:    { main: '#0F6E56', light: '#E1F5EE' },
    warning:    { main: '#854F0B', light: '#FAEEDA' },
    error:      { main: '#A32D2D', light: '#FCEBEB' },
    background: { default: '#F7F7F5', paper: '#FFFFFF' },
    text: { primary: '#1a1a18', secondary: '#6b6b68' },
  },
  typography: sharedTypography,
  shape: { borderRadius: 10 },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: 'none' },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#4D9EE8', dark: '#2678CC', light: '#1A2F45' },
    secondary:  { main: '#8B82E0', light: '#2A2650' },
    success:    { main: '#3DB88A', light: '#1A3D2F' },
    warning:    { main: '#E8A030', light: '#3D2E10' },
    error:      { main: '#E06060', light: '#3D1E1E' },
    background: { default: '#111214', paper: '#1C1E22' },
    text: { primary: '#E8E8E6', secondary: '#9A9A96' },
  },
  typography: sharedTypography,
  shape: { borderRadius: 10 },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.07)', boxShadow: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#1C1E22', borderBottom: '1px solid rgba(255,255,255,0.07)' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#1C1E22', borderRight: '1px solid rgba(255,255,255,0.07)' },
      },
    },
  },
})

// Keep legacy export for any existing imports
export const theme = lightTheme
