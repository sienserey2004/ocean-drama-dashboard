import React from 'react';
import { Box, Typography, Link, Stack, IconButton, Tooltip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CreateVideoForm from '@/components/admin/CreateVideoForm';

export default function CreateVideoPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title="Back to Videos">
          <IconButton onClick={() => navigate('/dashboard/videos')}>
            <ArrowBack fontSize="medium" />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            New Series
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
