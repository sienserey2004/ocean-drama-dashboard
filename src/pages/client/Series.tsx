import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { videoApi, PurchaseItem } from '@/api/video.service'
import { useNavigate } from 'react-router-dom'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'

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
        setPurchases(response.data);
      } catch (err) {
        console.error('Failed to fetch purchases:', err);
        setError('Failed to load your library.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
        <CircularProgress sx={{ color: '#FE2C55' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#000', height: '100%' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      bgcolor: '#000', 
      minHeight: '100%',
      color: 'white',
      pb: 10 // Space for mobile nav
    }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <VideoLibraryIcon sx={{ fontSize: 32, color: '#FE2C55' }} />
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>
            My Library
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            {purchases.length} {purchases.length === 1 ? 'Series' : 'Series'} purchased
          </Typography>
        </Box>
      </Stack>

      {purchases.length === 0 ? (
        <Box sx={{ mt: 10, textAlign: 'center', opacity: 0.5 }}>
          <Typography variant="h6">No purchases yet</Typography>
          <Typography variant="body2">Your purchased series will appear here.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {purchases.map((item) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={item.purchaseId}>
              <Card 
                sx={{ 
                  bgcolor: '#111', 
                  color: 'white', 
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(254,44,85,0.4)',
                    '& .play-overlay': { opacity: 1 }
                  }
                }}
              >
                <CardActionArea onClick={() => navigate(String(item.videoId))}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="280"
                      image={item.video.thumbnail_url || (item.video as any).thumbnailUrl}
                      alt={item.video.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    {/* Hover Overlay */}
                    <Box 
                      className="play-overlay"
                      sx={{ 
                        position: 'absolute', inset: 0, 
                        bgcolor: 'rgba(0,0,0,0.4)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s'
                      }}
                    >
                      <PlayCircleOutlineIcon sx={{ fontSize: 60, color: 'white' }} />
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 1.5, pb: '16px !important' }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="700" 
                      noWrap 
                      sx={{ mb: 0.5 }}
                    >
                      {item.video.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ opacity: 0.5, display: 'block' }}
                    >
                      Purchased on {new Date(item.purchaseDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default Series;
