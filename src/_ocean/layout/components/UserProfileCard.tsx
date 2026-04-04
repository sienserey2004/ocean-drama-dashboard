// UserProfileCard.tsx
import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import { NavigateFunction } from 'react-router-dom';

interface UserProfileCardProps {
  user: any; // Replace with proper User type
  isAuthenticated: boolean;
  navigate: NavigateFunction;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  isAuthenticated,
  navigate,
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        p: 1.5,
        opacity: 1,
        cursor: 'pointer',
        mt: 'auto',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
      onClick={() => navigate(isAuthenticated ? 'profile' : '/login')}
    >
      <Avatar
        src={user?.profile_image || ''}
        sx={{
          width: 32,
          height: 32,
          fontSize: 14,
          bgcolor: isAuthenticated ? 'primary.main' : 'rgba(255,255,255,0.2)',
        }}
      >
        {user?.name?.charAt(0).toUpperCase() || <PersonIcon sx={{ fontSize: 20 }} />}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight="bold" noWrap>
          {user?.name || (isAuthenticated ? 'Profile' : 'Login')}
        </Typography>
        {isAuthenticated ? (
          <>
            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontWeight: 600 }}>
              {user?.email}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', textTransform: 'capitalize' }}>
              {user?.role} Account
            </Typography>
          </>
        ) : (
          <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>
            Sign in to see more
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default UserProfileCard;