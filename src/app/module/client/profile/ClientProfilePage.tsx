import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SettingsIcon from '@mui/icons-material/Settings'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import HistoryIcon from '@mui/icons-material/History'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import { useAuthStore } from '@/app/stores/authStore'

const ClientProfilePage: React.FC = () => {
    const { user, isAuthenticated } = useAuthStore()
    console.log(user)
    const navigate = useNavigate()
    const [tab, setTab] = React.useState(0)

    if (!isAuthenticated || !user) {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Profile</Typography>
                <Typography sx={{ mb: 3, opacity: 0.6, textAlign: 'center' }}>Login to see your profile and saved videos</Typography>
                <Button variant="contained" onClick={() => navigate('/login')} sx={{ px: 4, borderRadius: 50, bgcolor: '#FE2C55', '&:hover': { bgcolor: '#ef2950' } }}>Login</Button>
            </Box>
        )
    }

    return (
        <Box sx={{ height: '100%', bgcolor: '#000', color: 'white', overflowY: 'auto', pb: 8 }}>
            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, bgcolor: '#000', zIndex: 10 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography sx={{ fontWeight: 800 }}>{user.name || 'User'}</Typography>
                <IconButton onClick={() => navigate('/dashboard/profile')} sx={{ color: 'white' }}>
                    <SettingsIcon />
                </IconButton>
            </Box>

            {/* Profile Info */}
            <Box sx={{ px: 4, pt: 2, pb: 4, textAlign: 'center' }}>
                <Avatar 
                    src={user.profile_image} 
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '2px solid rgba(255,255,255,0.1)' }}
                >
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>@{user.name?.toLowerCase().replace(/\s/g, '') || 'user'}</Typography>
                
                {/* Stats */}
                <Stack direction="row" justifyContent="center" spacing={4} sx={{ my: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography fontWeight="900">0</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>Following</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography fontWeight="900">0</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>Followers</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography fontWeight="900">0</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>Likes</Typography>
                    </Box>
                </Stack>

                <Button 
                    variant="outlined" 
                    onClick={() => navigate('/profile')}
                    sx={{ 
                        color: 'white', 
                        borderColor: 'rgba(255,255,255,0.2)', 
                        textTransform: 'none',
                        px: 4,
                        borderRadius: 1,
                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    Edit profile
                </Button>
                
                <Typography variant="body2" sx={{ mt: 3, opacity: 0.8, maxWidth: 300, mx: 'auto' }}>
                    Movie enthusiast | Loving Ocean Drama short series 🌊✨
                </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Tabs */}
            <Tabs 
                value={tab} 
                onChange={(_, v) => setTab(v)}
                variant="fullWidth"
                sx={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiTabs-indicator': { bgcolor: 'white' },
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', minHeight: 48 },
                    '& .Mui-selected': { color: 'white' }
                }}
            >
                <Tab icon={<HistoryIcon />} />
                <Tab icon={<FavoriteBorderIcon />} />
                <Tab icon={<BookmarkBorderIcon />} />
            </Tabs>

            {/* Content Grid */}
            <Box sx={{ minHeight: '50vh', position: 'relative' }}>
                <Grid container spacing={0.5} sx={{ p: 0.5 }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid item xs={4} key={i}>
                            <Box 
                                sx={{ 
                                    aspectRatio: '3/4', 
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    borderRadius: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                <Typography sx={{ opacity: 0.2 }}>Video {i}</Typography>
                                <Box sx={{ position: 'absolute', bottom: 5, left: 5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FavoriteBorderIcon sx={{ fontSize: 14 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>0</Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
                
                {tab === 1 && (
                    <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
                        <Typography>No liked videos yet</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    )
}

export default ClientProfilePage
