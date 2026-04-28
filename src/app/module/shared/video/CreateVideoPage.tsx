import React from 'react';
import { Box, Typography, IconButton, useTheme, useMediaQuery, Stack } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CreateVideoForm from '../../admin/videos/CreateVideoForm';

export default function CreateVideoPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ flexGrow: 1, px: isMobile ? 2 : 4, py: isMobile ? 2 : 4, pb: isMobile ? 8 : 4 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: 2, 
        mb: isMobile ? 3 : 4 
      }}>
        <IconButton 
          onClick={() => navigate('/dashboard/videos')}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            New Series
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Upload a thumbnail and fill in the details to publish your next drama.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CreateVideoForm />
      </Box>
    </Box>
  );
}
