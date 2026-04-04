import { createTheme } from "@mui/material/styles";
// If Vite continues to have issues with named exports, this is sometimes the fallback:
// import createTheme from '@mui/material/styles/createTheme';

const sharedTypography = {
  fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
  h1: { fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.02em" },
  h2: { fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.01em" },
  h3: { fontSize: "1.5rem", fontWeight: 700 },
  h4: { fontSize: "1.25rem", fontWeight: 600 },
  h5: { fontSize: "1rem", fontWeight: 600 },
  h6: { fontSize: "0.875rem", fontWeight: 600 },
  body1: { fontSize: "1rem", lineHeight: 1.6 },
  body2: { fontSize: "0.875rem", lineHeight: 1.57 },
  caption: { fontSize: "0.75rem" },
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none" as const,
        fontWeight: 600,
        borderRadius: 9999, // pill shape
        padding: "8px 24px",
        transition: "all 300ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
        },
      },
      containedPrimary: {
        backgroundColor: "#3B82F6",
        color: "#FFFFFF",
        "&:hover": {
          backgroundColor: "#2563EB",
          boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)",
        },
      },
      outlinedPrimary: {
        borderColor: "#3B82F6",
        color: "#3B82F6",
        "&:hover": {
          borderColor: "#2563EB",
          backgroundColor: "rgba(59, 130, 246, 0.04)",
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        transition: "all 300ms ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 99, fontSize: "0.75rem", fontWeight: 600 },
    },
  },
  MuiTextField: { defaultProps: { size: "medium" as const } },
  MuiSelect: { defaultProps: { size: "medium" as const } },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#3B82F6", dark: "#2563EB", light: "#60A5FA" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#64748B" },
    divider: "#E2E8F0",
  },
  typography: sharedTypography,
  shape: { borderRadius: 16 },
  components: {
    ...sharedComponents,
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3B82F6", dark: "#2563EB", light: "#60A5FA" },
    background: { default: "#0F172A", paper: "#111827" },
    text: { primary: "#F9FAFB", secondary: "#9CA3AF" },
    divider: "#1E293B",
  },
  typography: sharedTypography,
  shape: { borderRadius: 16 },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#111827",
          border: "1px solid #1E293B",
          "&:hover": {
            borderColor: "#3B82F6",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #1E293B",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "#0F172A", borderRight: "1px solid #1E293B" },
      },
    },
  },
});

// Keep legacy export for any existing imports
export const theme = lightTheme;
