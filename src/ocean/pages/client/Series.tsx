import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import { videoApi, PurchaseItem } from '@/ocean/api/video.service';
import { useNavigate } from 'react-router-dom';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return date.toLocaleDateString();
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const Series = () => {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await videoApi.getPurchases();
        const sorted = [...response.data].sort(
          (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        );
        setPurchases(sorted);
      } catch (err) {
        console.error('Failed to fetch purchases:', err);
        setError('Unable to load your library. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#000', minHeight: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#222' }} />
          <Box>
            <Skeleton width={160} height={40} sx={{ bgcolor: '#222' }} />
            <Skeleton width={100} height={20} sx={{ bgcolor: '#222' }} />
          </Box>
        </Stack>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Skeleton variant="rounded" height={280} sx={{ bgcolor: '#111', borderRadius: 2 }} />
              <Skeleton width="90%" sx={{ bgcolor: '#222', mt: 1 }} />
              <Skeleton width="60%" sx={{ bgcolor: '#222' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#000', minHeight: '100%' }}>
        <Typography color="error" variant="body1" sx={{ mb: 2 }}>{error}</Typography>
        <Chip
          label="Retry"
          onClick={() => window.location.reload()}
          sx={{ bgcolor: '#FE2C55', color: '#fff', '&:hover': { bgcolor: '#d81b45' } }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#000', minHeight: '100%', color: '#fff', pb: 10 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 5 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <VideoLibraryIcon sx={{ fontSize: 40, color: '#FE2C55' }} />
          <Box>
            <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>My Library</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>{purchases.length} {purchases.length === 1 ? 'series' : 'series'} purchased</Typography>
          </Box>
        </Stack>
      </Stack>

      {purchases.length === 0 ? (
        <Box sx={{ mt: 12, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <VideocamOffIcon sx={{ fontSize: 80, opacity: 0.3 }} />
          <Typography variant="h6" fontWeight="600">Your library is empty</Typography>
          <Typography variant="body2" sx={{ opacity: 0.6, maxWidth: 300 }}>Start exploring and purchase your first series. It will appear here.</Typography>
          <Chip label="Browse Series" onClick={() => navigate('/browse')} icon={<TrendingFlatIcon />} sx={{ mt: 2, bgcolor: '#FE2C55', color: '#fff', '&:hover': { bgcolor: '#d81b45' } }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {purchases.map((item) => {
            const thumbnail = item.video.thumbnail_url || (item.video as any).thumbnailUrl;
            const fallback = 'https://via.placeholder.com/400x600?text=No+Preview';
            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={item.purchaseId}>
                <Card sx={{
                  bgcolor: '#0a0a0a', borderRadius: 3, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.25s ease-in-out',
                  '&:hover': { transform: 'translateY(-6px)', borderColor: '#FE2C55', boxShadow: '0 12px 24px -8px rgba(254,44,85,0.2)', '& .play-overlay': { opacity: 1 }, '& .thumbnail-img': { transform: 'scale(1.05)' } }
                }}>
                  {/* Navigate to /library/:videoId - matches original route */}
                  <CardActionArea onClick={() => navigate(`/library/${item.videoId}`)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '2/3' }}>
                      <CardMedia component="img" image={thumbnail || fallback} alt={item.video.title} className="thumbnail-img" sx={{ objectFit: 'cover', width: '100%', height: '100%', transition: 'transform 0.4s ease' }} onError={(e) => (e.target as HTMLImageElement).src = fallback} />
                      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', pointerEvents: 'none' }} />
                      <Box className="play-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.25s', backdropFilter: 'blur(4px)' }}>
                        <PlayCircleOutlineIcon sx={{ fontSize: 56, color: '#fff', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 1.5, pb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="700" noWrap sx={{ mb: 0.75, fontSize: '0.9rem' }}>{item.video.title}</Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.7rem' }}>{getRelativeTime(item.purchaseDate)}</Typography>
                        {item.amountPaid && (
                          <Chip label={`${item.amountPaid} ${item.currency || 'USD'}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(254,44,85,0.15)', color: '#FE2C55', '& .MuiChip-label': { px: 0.8 } }} />
                        )}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Series;