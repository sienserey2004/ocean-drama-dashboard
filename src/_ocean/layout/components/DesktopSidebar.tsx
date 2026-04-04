// DesktopSidebar.tsx
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/Message';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { NavigateFunction, Location } from 'react-router-dom';
import UserProfileCard from './UserProfileCard';

interface DesktopSidebarProps {
  user: any; // Replace with proper User type
  isAuthenticated: boolean;
  location: Location;
  navigate: NavigateFunction;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  user,
  isAuthenticated,
  location,
  navigate,
}) => {
  const navItems = [
    { label: 'For You', icon: HomeIcon, path: '/viewer', exact: true },
    { label: 'Explore', icon: SearchIcon, path: '/explore', disabled: false }, // placeholder
    { label: 'Messages', icon: MessageIcon, path: '/messages', disabled: false },
    { label: 'Series', icon: VideoLibraryIcon, path: '/library', exact: false },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    if (path === '/library') return location.pathname.includes('/library');
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width: 240,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        p: 3,
        gap: 2,
      }}
    >
      <Typography variant="h5" fontWeight="900" sx={{ mb: 4, letterSpacing: '-1px' }}>
        OceanDrama
      </Typography>

      {navItems.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            p: 1.5,
            bgcolor: isActive(item.path, item.exact) ? 'rgba(255,255,255,0.1)' : 'transparent',
            borderRadius: 2,
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            opacity: item.disabled ? 0.4 : isActive(item.path, item.exact) ? 1 : 0.6,
            '&:hover': { opacity: item.disabled ? 0.4 : 1 },
          }}
          onClick={() => !item.disabled && navigate(item.path)}
        >
          <item.icon />
          <Typography fontWeight="bold">{item.label}</Typography>
        </Stack>
      ))}

      {/* User profile section pinned to bottom */}
      <UserProfileCard
        user={user}
        isAuthenticated={isAuthenticated}
        navigate={navigate}
      />
    </Box>
  );
};

export default DesktopSidebar;