import React from 'react';
import { Stack, Button } from '@mui/material';
import {
  Tune as FilterIcon,
  TrendingUp as RankingIcon,
  FiberNew as NewIcon,
  EventNote as ReserveIcon,
} from '@mui/icons-material';

const actions = [
  { icon: <FilterIcon sx={{ fontSize: 18 }} />, label: 'Filter' },
  { icon: <RankingIcon sx={{ fontSize: 18 }} />, label: 'Ranking' },
  { icon: <NewIcon sx={{ fontSize: 18 }} />, label: 'New' },
  { icon: <ReserveIcon sx={{ fontSize: 18 }} />, label: 'Reserve' },
];

const ActionButtons: React.FC = () => {
  return (
    <Stack direction="row" spacing={1.5} sx={{ mb: 4, overflowX: 'auto', pb: 1 }}>
      {actions.map((action, index) => (
        <ActionButton key={index} icon={action.icon} label={action.label} />
      ))}
    </Stack>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <Button
    startIcon={icon}
    sx={{
      bgcolor: 'rgba(255,255,255,0.05)',
      color: 'white',
      borderRadius: '99px',
      px: 2.5,
      py: 1,
      textTransform: 'none',
      fontSize: '13px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      border: '1px solid rgba(255,255,255,0.1)',
      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
    }}
  >
    {label}
  </Button>
);

export default ActionButtons;