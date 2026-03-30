import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { videoApi } from '@/api/video.service'
import { Episode, Video } from '@/types'

const SeriesDetail: React.FC = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!videoId) return;
            try {
                setLoading(true);
                const [epResponse, videoData] = await Promise.all([
                    videoApi.getEpisodesByVideoId(Number(videoId), { page: 1, limit: 50 }),
                    videoApi.getById(Number(videoId))
                ]);
                // Sort episodes by episode_number just in case
                const sorted = [...epResponse.data].sort((a, b) => a.episode_number - b.episode_number);
                setEpisodes(sorted);
                setVideo(videoData);
            } catch (err) {
                console.error('Failed to fetch series details:', err);
                setError('Failed to load episodes list.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [videoId]);

    if (loading) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
                <CircularProgress sx={{ color: '#FE2C55' }} size={48} />
            </Box>
        );
    }

    if (error || !video) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#000', height: '100%', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="error" sx={{ mb: 2 }}>{error || 'Series not found'}</Typography>
                <Button variant="outlined" sx={{ color: 'white', borderColor: 'white' }} onClick={() => navigate(-1)}>
                    Go Back
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            bgcolor: '#000', 
            minHeight: '100%', 
            color: 'white',
            pb: 10
        }}>
            {/* Header / Banner Area */}
            <Box sx={{ position: 'relative', height: { xs: 240, md: 400 }, width: '100%' }}>
                <CardMedia
                    component="img"
                    image={video.thumbnail_url || (video as any).thumbnailUrl}
                    sx={{ height: '100%', width: '100%', objectFit: 'cover', opacity: 0.5 }}
                />
                <Box sx={{ 
                    position: 'absolute', inset: 0, 
                    background: 'linear-gradient(to top, #000 0%, transparent 100%)' 
                }} />
                
                <IconButton 
                    onClick={() => navigate(-1)}
                    sx={{ position: 'absolute', top: 20, left: 20, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, zIndex: 10 }}
                >
                    <ArrowBackIcon />
                </IconButton>

                <Box sx={{ position: 'absolute', bottom: 30, left: { xs: 20, md: 40 }, right: 20, zIndex: 5 }}>
                    <Typography 
                        variant="h1" 
                        fontWeight="900" 
                        sx={{ 
                            mb: 1, 
                            textShadow: '0 2px 10px rgba(0,0,0,0.8)', 
                            fontSize: { xs: '2rem', md: '3.5rem' },
                            lineHeight: 1.1
                        }}
                    >
                        {video.title}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 700, color: '#FE2C55' }}>
                            {episodes.length} Episodes
                        </Typography>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 500 }}>
                            {video.creator?.name || 'OceanDrama Original'}
                        </Typography>
                    </Stack>
                </Box>
            </Box>

            {/* Episodes List Section */}
            <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.5px', color: 'white' }}>
                        Episode List
                    </Typography>
                </Stack>

                <Grid container spacing={2.5}>
                    {episodes.map((ep) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={ep.episode_id}>
                            <Card sx={{ 
                                bgcolor: '#121212', 
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 3,
                                overflow: 'hidden',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': { 
                                    bgcolor: '#1c1c1c', 
                                    borderColor: 'rgba(254,44,85,0.5)',
                                    transform: 'translateY(-2px)'
                                }
                            }}>
                                <CardActionArea 
                                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                                    onClick={() => navigate(`/viewer/episodes/${videoId}`, { state: { episodes, currentEpisode: ep } })}
                                >
                                    <Box sx={{ position: 'relative', height: 160 }}>
                                        <CardMedia
                                            component="img"
                                            image={video.thumbnail_url || (video as any).thumbnailUrl}
                                            sx={{ height: '100%', objectFit: 'cover' }}
                                        />
                                        <Box sx={{ 
                                            position: 'absolute', inset: 0, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: 'rgba(0,0,0,0.3)',
                                            transition: 'background-color 0.2s',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                                        }}>
                                            <PlayCircleFilledIcon sx={{ color: 'white', fontSize: 48, opacity: 0.9 }} />
                                        </Box>
                                        <Box sx={{ 
                                            position: 'absolute', top: 12, left: 12, 
                                            bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.5, borderRadius: 1,
                                            backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            <Typography variant="caption" fontWeight="900">
                                                EP {ep.episode_number}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <CardContent sx={{ p: 2, color: 'white' }}>
                                        <Typography variant="subtitle1" fontWeight="700" noWrap sx={{ mb: 0.5, color: 'white' }}>
                                            {ep.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                                            {ep.duration ? `${Math.floor(ep.duration / 60)}:${(ep.duration % 60).toString().padStart(2, '0')}` : 'Premium Content'}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {episodes.length === 0 && (
                    <Box sx={{ py: 12, textAlign: 'center', opacity: 0.4 }}>
                        <Typography variant="h6">No episodes found for this series.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default SeriesDetail;