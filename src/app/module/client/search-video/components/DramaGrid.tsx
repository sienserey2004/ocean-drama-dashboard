import React from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import { Video } from '@/app/types';
import DramaCard from './DramaCard';

interface DramaGridProps {
  results: Video[];
  loading: boolean;
  onSelect: (video: Video) => void;
}

const DramaGrid: React.FC<DramaGridProps> = ({ results, loading, onSelect }) => {
  if (loading && results.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress sx={{ color: '#E50914' }} />
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          Search for your favorite drama
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {results.map((video) => (
        <Grid item xs={6} key={video.video_id}>
          <DramaCard video={video} onClick={() => onSelect(video)} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DramaGrid;
