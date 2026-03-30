import React, { useRef, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import { useNavigate } from 'react-router-dom'
import { IconButtonProps } from '@mui/material/IconButton'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ShareIcon from '@mui/icons-material/Share'
import CommentIcon from '@mui/icons-material/Comment'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'


interface VideoCardProps {
    video: any;
    videoUrl: string;
    username: string;
    description: string;
    likes: string;
    comments: string;
    favorites: string;
    shares: string;
    music: string;
    profilePic: string;
    active: boolean;
    /** Global mute state from parent */
    muted: boolean;
    /** Global volume 0–1 from parent */
    volume: number;
}

const InteractionButton = (props: IconButtonProps) => (
    <IconButton 
        {...props} 
        sx={{ 
            color: 'white',
            p: 1,
            mb: 0.5,
            bgcolor: 'rgba(255,255,255,0.08)',
            '&:hover': {
                bgcolor: 'rgba(255,255,255,0.15)',
            },
            '& svg': {
                fontSize: 32,
            },
            ...props.sx
        }}
    />
);

const VideoCard: React.FC<VideoCardProps> = ({ 
    video, videoUrl, username, description, likes, comments, favorites, shares, music, profilePic,
    active, muted, volume,
}) => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [liked, setLiked] = useState(false);

    // Play / pause when active changes
    useEffect(() => {
        if (!videoRef.current) return;
        if (active) {
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [active]);

    // Apply volume imperatively (avoids remounting video element)
    useEffect(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = muted;
        videoRef.current.volume = volume;
    }, [muted, volume]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(error => {
                if (error.name !== 'AbortError') console.error('Video play failed:', error);
            });
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <Box 
            sx={{ 
                height: '100%', 
                width: '100%', 
                scrollSnapAlign: 'start', 
                position: 'relative',
                bgcolor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={togglePlay}
        >
            {/* Video Background */}
            <video
                ref={videoRef}
                loop
                playsInline
                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                key={videoUrl}
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {!isPlaying && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayArrowIcon sx={{ fontSize: 80, color: 'white', opacity: 0.5 }} />
                </Box>
            )}

            {/* Bottom Gradient Overlay */}
            <Box 
                sx={{ 
                    position: 'absolute', bottom: 0, left: 0, right: 0, 
                    height: '40%', 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    zIndex: 1, pointerEvents: 'none'
                }} 
            />

            {/* Episode List Button */}
            <Button
                variant="contained"
                onClick={(e) => { e.stopPropagation(); navigate(`episodes/${video.videoId}`, { state: { video } }); }}
                sx={{
                    position: 'absolute',
                    bottom: { xs: 90, md: 20 },
                    zIndex: 30,
                    left: 20,
                    bgcolor: '#FE2C55',
                    '&:hover': { bgcolor: '#FE2C55' },
                }}
            >
                Buy Full Season
            </Button>

            {/* Content Bottom Info */}
            <Box sx={{ position: 'absolute', bottom: { xs: 140, md: 70 }, left: 15, right: 80, zIndex: 10, color: 'white' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: '0.05em' }}>@{username}</Typography>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#20D5EC' }} />
                </Stack>
                <Typography variant="body1" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.2, mb: 1.5 }}>
                    {description}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <MusicNoteIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{music}</Typography>
                </Stack>
            </Box>

            {/* Right Side Buttons */}
            <Stack spacing={2} alignItems="center" sx={{ position: 'absolute', bottom: { xs: 150, md: 80 }, right: 12, zIndex: 10 }}>
                {/* Profile */}
                <Box position="relative" sx={{ mb: 2 }}>
                    <Avatar 
                        src={profilePic} 
                        sx={{ width: 50, height: 50, border: '2px solid white', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }} 
                    />
                    <Box sx={{ 
                        position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                        bgcolor: '#FE2C55', borderRadius: '50%', width: 22, height: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 16, fontWeight: 'bold', border: '1.5px solid white'
                    }}>
                        +
                    </Box>
                </Box>

                <Box textAlign="center">
                    <InteractionButton onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}>
                        <FavoriteIcon sx={{ color: liked ? '#FE2C55' : 'white' }} />
                    </InteractionButton>
                    <Typography variant="caption" fontWeight="600">{likes}</Typography>
                </Box>

                <Box textAlign="center">
                    <InteractionButton onClick={(e) => e.stopPropagation()}>
                        <CommentIcon />
                    </InteractionButton>
                    <Typography variant="caption" fontWeight="600">{comments}</Typography>
                </Box>

                <Box textAlign="center">
                    <InteractionButton onClick={(e) => e.stopPropagation()}>
                        <BookmarkIcon />
                    </InteractionButton>
                    <Typography variant="caption" fontWeight="600">{favorites}</Typography>
                </Box>

                <Box textAlign="center">
                    <InteractionButton onClick={(e) => e.stopPropagation()}>
                        <ShareIcon />
                    </InteractionButton>
                    <Typography variant="caption" fontWeight="600">{shares}</Typography>
                </Box>

                {/* Spinning Music Record */}
                <Box sx={{ 
                    mt: 2, width: 45, height: 45, borderRadius: '50%', bgcolor: '#333',
                    backgroundImage: `url(${profilePic})`, backgroundSize: 'cover',
                    border: '10px solid #111',
                    animation: 'spin 4s linear infinite',
                    '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } }
                }} />
            </Stack>
        </Box>
    )
}

export default VideoCard
