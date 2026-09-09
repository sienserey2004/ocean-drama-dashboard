// ViewerLayout.tsx
import React from 'react';
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
    <div className="flex h-screen flex-col bg-black text-white">
      <DesktopNavbar
        user={user}
        isAuthenticated={isAuthenticated}
        location={location}
        navigate={navigate}
      />

      {/* Main content area */}
      <div className="relative flex-1 overflow-auto">
        <Outlet />
      </div>

      {(!location.pathname.startsWith('/app-studio') && !location.pathname.startsWith('/subscription-plan')) && (
        <MobileBottomNav
          user={user}
          isAuthenticated={isAuthenticated}
          location={location}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default ViewerLayout;
