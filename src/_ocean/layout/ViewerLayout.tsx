// ViewerLayout.tsx
import React from 'react';
import Box from '@mui/material/Box';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/authStore';
import DesktopSidebar from './components/DesktopSidebar';
import MobileBottomNav from './components/MobileBottomNav';

const ViewerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser, isAuthenticated } = useAuthStore();
  const [value, setValue] = React.useState(location.pathname === '/viewer' ? 0 : -1);

  // Refresh user if token exists but store not authenticated
  React.useEffect(() => {
    if (localStorage.getItem('access_token') && !isAuthenticated) {
      refreshUser();
    }
  }, [refreshUser, isAuthenticated]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: '#000',
        color: 'white',
      }}
    >
      <DesktopSidebar
        user={user}
        isAuthenticated={isAuthenticated}
        location={location}
        navigate={navigate}
      />

      {/* Main content area */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Outlet />
      </Box>

      <MobileBottomNav
        user={user}
        isAuthenticated={isAuthenticated}
        location={location}
        navigate={navigate}
      />
    </Box>
  );
};

export default ViewerLayout;