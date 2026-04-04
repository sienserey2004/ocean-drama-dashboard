// ViewerLayout.tsx
import React from 'react';
import Box from '@mui/material/Box';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/authStore';
import DesktopNavbar from './components/DesktopNavbar';
import MobileBottomNav from './components/MobileBottomNav';

const ViewerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser, isAuthenticated } = useAuthStore();

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
        flexDirection: 'column',
        bgcolor: '#000',
        color: 'white',
      }}
    >
      <DesktopNavbar
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