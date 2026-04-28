import React from 'react';
import { Box, Paper, TextField, InputAdornment, CircularProgress } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface SearchBarProps {
  q: string;
  setQ: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ q, setQ, inputRef, loading }) => {
  return (
    <Box sx={{ position: 'relative', mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: '4px 12px',
          borderRadius: '16px',
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          inputRef={inputRef}
          placeholder="The moonlight will never fall..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', mr: 1 }} />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} sx={{ color: '#E50914' }} />
              </InputAdornment>
            ),
            sx: { color: 'white', fontSize: 16, py: 1 }
          }}
        />
        <Box sx={{ 
          bgcolor: 'rgba(229, 9, 20, 0.15)', 
          color: '#E50914', 
          px: 1.5, 
          py: 0.5, 
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 800,
          ml: 1,
          whiteSpace: 'nowrap'
        }}>
          @know drama
        </Box>
      </Paper>
    </Box>
  );
};

export default SearchBar;
