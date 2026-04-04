// DesktopNavbar.tsx
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import MessageIcon from '@mui/icons-material/Message';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { NavigateFunction, Location } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';

interface DesktopNavbarProps {
  user: any;
  isAuthenticated: boolean;
  location: Location;
  navigate: NavigateFunction;
}

const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  user,
  isAuthenticated,
  location,
  navigate,
}) => {
  const navItems = [
    { label: 'For You', icon: HomeIcon, path: '/viewer', exact: true },
    { label: 'Explore', icon: SearchIcon, path: '/explore', disabled: false },
    { label: 'Messages', icon: MessageIcon, path: '/messages', disabled: false },
    { label: 'Series', icon: VideoLibraryIcon, path: '/library', exact: false },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    if (path === '/library') return location.pathname.includes('/library');
    if (path === '/viewer' && location.pathname === '/') return true; // handle root redirect
    return location.pathname.startsWith(path);
  };

  return (
    <Box 
      sx={{ 
        height: 70, 
        px: 6, 
        display: { xs: 'none', md: 'flex' }, 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'rgba(11,11,15,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}
    >
      <Typography
        onClick={() => navigate('/viewer')}
        sx={{
          fontSize: 24,
          fontWeight: 900,
          fontFamily: "'Oswald', sans-serif",
          textTransform: 'uppercase',
          color: 'white',
          cursor: 'pointer',
          textShadow: '2px 2px 0px #FF2D2D',
          letterSpacing: '1.5px'
        }}
      >
        OCEAN DRAMA
      </Typography>

      <Stack direction="row" spacing={6} alignItems="center">
        {navItems.map((item) => (
          <Typography 
            key={item.label} 
            sx={{
              color: isActive(item.path, item.exact) ? '#FF2D2D' : '#A1A1AA',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '12px',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              '&:hover': { color: 'white' },
              '&::after': isActive(item.path, item.exact) ? {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                bgcolor: '#FF2D2D',
                borderRadius: '50%',
                boxShadow: '0 0 10px #FF2D2D'
              } : {}
            }}
            onClick={() => !item.disabled && navigate(item.path)}
          >
            {item.label}
          </Typography>
        ))}
      </Stack>

      <Stack direction="row" spacing={3} alignItems="center">
        <IconButton sx={{ color: '#A1A1AA', '&:hover': { color: '#FF2D2D' } }}>
          <NotificationsNoneIcon />
        </IconButton>
        <Avatar 
          src={user?.profile_image || ''}
          onClick={() => navigate(isAuthenticated ? '/profile-screen' : '/login')}
          sx={{ 
            bgcolor: '#1A1A22', 
            cursor: 'pointer', 
            width: 38, 
            height: 38,
            border: '2px solid #2A2A35',
            transition: 'all 0.3s ease',
            '&:hover': { 
              transform: 'scale(1.1)',
              borderColor: '#FF2D2D',
              boxShadow: '0 0 15px rgba(255,45,45,0.3)'
            }
          }}
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
      </Stack>
    </Box>
  );
};

export default DesktopNavbar;
