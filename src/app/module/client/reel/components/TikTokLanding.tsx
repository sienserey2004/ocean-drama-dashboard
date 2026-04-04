import React, { useRef, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Tooltip from '@mui/material/Tooltip'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import VolumeDownIcon from '@mui/icons-material/VolumeDown'
import VideoCard from '../VideoCard'
import { videoApi, FeedPreviewItem } from '@/app/api/video.service'
import { useAuthStore } from '@/app/stores/authStore'

const TikTokLanding: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { user, isAuthenticated } = useAuthStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const [feedItems, setFeedItems] = useState<FeedPreviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Audio state ────────────────────────────────────────────────
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await videoApi.feedPreview({ limit: 20, offset: 0 });
                setFeedItems(response.data);
                console.log("feedItems", response.data);
            } catch (err) {
                console.error('Failed to fetch feed:', err);
                setError('Failed to load feed. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / e.currentTarget.clientHeight);
        if (index !== activeIndex) setActiveIndex(index);
    };

    const handleVolumeIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showVolumeSlider) {
            // Toggle mute when slider is already showing
            setMuted(prev => !prev);
        } else {
            setShowVolumeSlider(true);
            resetHideTimer();
        }
    };

    const resetHideTimer = () => {
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 3000);
    };

    const handleVolumeChange = (_: Event, val: number | number[]) => {
        const v = val as number;
        setVolume(v);
        if (v === 0) {
            setMuted(true);
        } else {
            setMuted(false);
        }
        resetHideTimer();
    };

    const VolumeIcon = muted || volume === 0
        ? VolumeOffIcon
        : volume < 0.5
        ? VolumeDownIcon
        : VolumeUpIcon;

    // ── Loading / Error / Empty ────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ height: '100%', width: '100%', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress sx={{ color: '#FE2C55' }} size={48} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Loading For You...</Typography>
                </Stack>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ height: '100%', width: '100%', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={1}>
                    <Typography sx={{ color: '#FE2C55', fontWeight: 700 }}>Oops!</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{error}</Typography>
                </Stack>
            </Box>
        );
    }

    if (feedItems.length === 0) {
        return (
            <Box sx={{ height: '100%', width: '100%', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>No videos available</Typography>
            </Box>
        );
    }

    return (
        <Box
            ref={containerRef}
            onScroll={handleScroll}
            sx={{
                height: '100%',
                width: '100%',
                bgcolor: '#000',
                overflowY: 'scroll',
                scrollSnapType: 'y mandatory',
                position: 'relative',
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
            }}
        >
            {/* ── Top Nav Bar ───────────────────────────────────────── */}
            <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={3}
                sx={{
                    position: 'fixed',
                    top: 20,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    px: 3
                }}
            >
                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
                    {isAuthenticated && user && (
                        <Typography sx={{ color: 'white', fontSize: 14, fontWeight: '700', pointerEvents: 'auto', opacity: 0.8 }}>
                            Welcome back, {user.name} 👋
                        </Typography>
                       
                    )}
                </Box>
                <Stack direction="row" spacing={3} sx={{ pointerEvents: 'auto' }}>
                    <Typography variant="h6" sx={{ fontSize: 17, fontWeight: '800', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                        Following
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: 17, fontWeight: '800', color: 'white', borderBottom: '3px solid white', paddingBottom: '5px', cursor: 'pointer' }}>
                        For You
                    </Typography>
                </Stack>

                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
            </Stack>

            {/* ── Volume Control — top-left */}
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    zIndex: 30,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    // Glassmorphism pill
                    background: showVolumeSlider
                        ? 'rgba(0,0,0,0.55)'
                        : 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 50,
                    px: showVolumeSlider ? 1.5 : 0.5,
                    py: 0.5,
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                    maxWidth: showVolumeSlider ? 220 : 48,
                }}
            >
                {/* Mute / Volume icon */}
                <Tooltip title={muted ? 'Unmute' : 'Mute'} placement="bottom">
                    <IconButton
                        size="small"
                        onClick={handleVolumeIconClick}
                        sx={{
                            color: 'white',
                            flexShrink: 0,
                            p: 0.75,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        <VolumeIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                </Tooltip>

                {/* Volume slider — slides in */}
                {showVolumeSlider && (
                    <Box sx={{ width: 120, display: 'flex', alignItems: 'center', pr: 0.5 }}>
                        <Slider
                            size="small"
                            value={muted ? 0 : volume}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={handleVolumeChange}
                            onMouseEnter={resetHideTimer}
                            aria-label="Volume"
                            sx={{
                                color: '#FE2C55',
                                '& .MuiSlider-thumb': {
                                    width: 14,
                                    height: 14,
                                    boxShadow: '0 0 0 3px rgba(254,44,85,0.3)',
                                    '&:hover': { boxShadow: '0 0 0 5px rgba(254,44,85,0.3)' },
                                },
                                '& .MuiSlider-rail': { opacity: 0.3 },
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* ── Video Feed ────────────────────────────────────────── */}
            {/* Video Feed */}
            {feedItems.map((item, index) => (
                <VideoCard
                    key={item.episodeId}
                    episodeId={item.episodeId}
                    video={item.video}
                    videoUrl={item.previewVideoUrl ?? ''}
                    username={item.video.creator?.name ?? 'Unknown'}
                    description={item.video.title ?? 'No title'}
                  
                    likes={String(item.video.like_count ?? 0)}
                    comments={String(item.video.comment_count ?? 0)}
                    favorites={String(item.video.save_count ?? 0)}
                    shares={String(item.video.share_count ?? 0)}

                    music={item.video.title ?? 'Original Sound'}
                    profilePic={item.video.thumbnailUrl ?? ''}
                    active={index === activeIndex}
                    muted={muted}
                    volume={volume}
                />
            ))}
        </Box>
    );
}

export default TikTokLanding
