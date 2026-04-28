import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { Video } from '@/app/types';

interface DramaCardProps {
  video: Video;
  onClick: () => void;
}

const DramaCard: React.FC<DramaCardProps> = ({ video, onClick }) => {
  const isNewToday = video.created_at && 
    new Date(video.created_at).toDateString() === new Date().toDateString();

  return (
    <Box 
      onClick={onClick}
      sx={{ 
        position: 'relative', 
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'translateY(-4px)' }
      }}
    >
      <DramaImage src={video.thumbnail_url || ''} alt={video.title} />
      <DramaOverlayText title={video.title} />
      <DramaMeta 
        views={video.view_count || 0} 
        tag={(video as any).categories?.[0]?.name || 'Drama'} 
      />
      {isNewToday && (
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <NewBadge label="New today" />
        </Box>
      )}
    </Box>
  );
};

const DramaImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <Box sx={{ 
    width: '100%', 
    aspectRatio: '2/3', 
    borderRadius: '16px', 
    overflow: 'hidden',
    position: 'relative',
    mb: 1.5,
    bgcolor: '#1A1A22'
  }}>
    <img 
      src={src} 
      alt={alt} 
      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
    />
    <Box sx={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(15,16,20,0.9), transparent 50%)'
    }} />
  </Box>
);

const DramaOverlayText: React.FC<{ title: string }> = ({ title }) => (
  <Typography sx={{ 
    color: 'white', 
    fontWeight: 700, 
    fontSize: '14px', 
    lineHeight: 1.2,
    mb: 0.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }}>
    {title}
  </Typography>
);

const DramaMeta: React.FC<{ views: number; tag: string }> = ({ views, tag }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>
      <Visibility sx={{ fontSize: 12 }} />
      <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
        {views > 1000 ? `${(views/1000).toFixed(1)}k` : views}
      </Typography>
    </Stack>
    <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)' }} />
    <Typography sx={{ 
      fontSize: '11px', 
      color: 'rgba(255,255,255,0.4)', 
      fontWeight: 600 
    }}>
      {tag}
    </Typography>
  </Stack>
);

const NewBadge: React.FC<{ label: string }> = ({ label }) => (
  <Box sx={{ 
    bgcolor: '#E50914', 
    color: 'white', 
    px: 1, 
    py: 0.25, 
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 900,
    textTransform: 'uppercase',
    boxShadow: '0 4px 10px rgba(229, 9, 20, 0.4)'
  }}>
    {label}
  </Box>
);

export default DramaCard;