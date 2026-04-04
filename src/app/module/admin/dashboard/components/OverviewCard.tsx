import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, icon, color }) => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%', 
        borderRadius: '16px', 
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {value}
            </Typography>
          </Box>
          <Avatar 
            variant="rounded"
            sx={{ 
              bgcolor: (theme) => `${color}.light`, 
              color: (theme) => `${color}.main`, 
              width: 52, 
              height: 52,
              borderRadius: '14px'
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OverviewCard;
