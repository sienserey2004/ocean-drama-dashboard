import React from 'react';
import { Stack, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface SearchHeaderProps {
  onClose: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ onClose }) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
      <Typography sx={{ 
        fontFamily: "'Bebas Neue', sans-serif", 
        fontSize: 24, 
        color: 'white', 
        letterSpacing: '0.05em' 
      }}>
        SEARCH
      </Typography>
      <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)' }}>
        <CloseIcon />
      </IconButton>
    </Stack>
  );
};

export default SearchHeader;