import React, { useRef, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import VideoCard from '@/components/client/VideoCard'

const dummyVideos = [
  {
    id: 1,
    url: 'https://cdn.coverr.co/videos/coverr-young-woman-using-phone-while-walking-vertical-5174/1080p.mp4',
    username: 'daily.vibes',
    description: 'Chill walk in the city 🌆 #vibes #daily #lifestyle',
    likes: '22.3K',
    comments: '1.1K',
    favorites: '3.2K',
    shares: '2.5K',
    music: 'City Walk - Chill Beat',
    profilePic: 'https://i.pravatar.cc/150?u=1'
  },
  {
    id: 2,
    url: 'https://cdn.coverr.co/videos/coverr-woman-dancing-in-the-street-vertical-1573/1080p.mp4',
    username: 'dance.flow',
    description: 'Feel the rhythm 💃 #dance #fun #energy',
    likes: '88.1K',
    comments: '4.2K',
    favorites: '12K',
    shares: '9.4K',
    music: 'Street Dance - Remix',
    profilePic: 'https://i.pravatar.cc/150?u=2'
  },
  {
    id: 3,
    url: 'https://cdn.coverr.co/videos/coverr-girl-enjoying-sunset-vertical-6941/1080p.mp4',
    username: 'sunset.soul',
    description: 'Golden hour magic 🌅 #sunset #peace #nature',
    likes: '65.7K',
    comments: '2.8K',
    favorites: '8.9K',
    shares: '6.3K',
    music: 'Golden Sky - Ambient',
    profilePic: 'https://i.pravatar.cc/150?u=3'
  }
]

const TikTokLanding: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / e.currentTarget.clientHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

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
                '&::-webkit-scrollbar': { display: 'none' }, // hide scrollbar
                msOverflowStyle: 'none',  
                scrollbarWidth: 'none',
            }}
        >
            {/* Top Navigation Bar Overlay */}
            <Stack 
                direction="row" 
                justifyContent="center" 
                alignItems="center" 
                spacing={3} 
                sx={{ 
                    position: 'absolute', 
                    top: 20, 
                    left: 0, 
                    right: 0, 
                    zIndex: 20,
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 'bold'
                }}
            >
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontSize: 17, 
                        fontWeight: '800', 
                        cursor: 'pointer',
                        '&:hover': { color: 'white' }
                    }}
                >
                    Following
                </Typography>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontSize: 17, 
                        fontWeight: '800', 
                        color: 'white', 
                        borderBottom: '3px solid white', 
                        paddingBottom: '5px',
                        cursor: 'pointer'
                    }}
                >
                    For You
                </Typography>
            </Stack>

            {dummyVideos.map((video, index) => (
                <VideoCard 
                    key={video.id} 
                    {...video} 
                    videoUrl={video.url}
                    active={index === activeIndex} 
                />
            ))}
        </Box>
    )
}

export default TikTokLanding
