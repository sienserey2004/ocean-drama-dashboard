import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import AddBoxIcon from '@mui/icons-material/AddBox'
import MessageIcon from '@mui/icons-material/Message'
import PersonIcon from '@mui/icons-material/Person'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Avatar from '@mui/material/Avatar'

const ViewerLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser, isAuthenticated } = useAuthStore();
    
    React.useEffect(() => {
        // Only refresh user from API if we have a token but are not yet marked as authenticated
        if (localStorage.getItem('access_token') && !isAuthenticated) {
            refreshUser();
        }
    }, [refreshUser, isAuthenticated]);

    const [value, setValue] = React.useState(location.pathname === '/viewer' ? 0 : -1);

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            bgcolor: '#000',
            color: 'white' 
        }}>
            {/* Desktop Sidebar */}
            <Box 
                sx={{ 
                    width: 240, 
                    display: { xs: 'none', md: 'flex' }, 
                    flexDirection: 'column', 
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    p: 3,
                    gap: 2
                }}
            >
                <Typography variant="h5" fontWeight="900" sx={{ mb: 4, letterSpacing: '-1px' }}>OceanDrama</Typography>
                
                <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={2} 
                    sx={{ p: 1.5, bgcolor: location.pathname === '/viewer' ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: 2, cursor: 'pointer' }}
                    onClick={() => navigate('/viewer')}
                >
                    <HomeIcon />
                    <Typography fontWeight="bold">For You</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                    <SearchIcon />
                    <Typography fontWeight="bold">Explore</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                    <MessageIcon />
                    <Typography fontWeight="bold">Messages</Typography>
                </Stack>

                <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={2} 
                    sx={{ p: 1.5, opacity: 1, cursor: 'pointer', mt: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={() => navigate(isAuthenticated ? 'profile' : '/login')}
                >
                    <Avatar 
                        src={user?.profile_image || ''} 
                        sx={{ width: 32, height: 32, fontSize: 14, bgcolor: isAuthenticated ? 'primary.main' : 'rgba(255,255,255,0.2)' }}
                    >
                        {user?.name?.charAt(0).toUpperCase() || <PersonIcon sx={{ fontSize: 20 }} />}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight="bold" noWrap>
                            {user?.name || (isAuthenticated ? 'Profile' : 'Login')}
                        </Typography>
                        {!isAuthenticated && (
                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>
                                Sign in to see more
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </Box>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <Outlet />
            </Box>

            {/* Mobile Bottom Navigation Bar */}
            <Box sx={{ 
                position: 'fixed', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                bgcolor: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                display: { xs: 'flex', md: 'none' }, // Only show on mobile
                justifyContent: 'space-around',
                alignItems: 'center',
                p: 2,
                zIndex: 100,
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                <HomeIcon sx={{ color: 'white', cursor: 'pointer' }} onClick={() => navigate('/viewer')} />
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }} />
                <AddBoxIcon sx={{ color: 'white', fontSize: 40, cursor: 'pointer' }} />
                <MessageIcon sx={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }} />
                <Avatar 
                    src={user?.profile_image || ''} 
                    onClick={() => navigate(isAuthenticated ? 'profile' : '/login')}
                    sx={{ 
                        width: 28, height: 28, fontSize: 14, cursor: 'pointer',
                        border: '1.5px solid white',
                        bgcolor: isAuthenticated ? 'primary.main' : 'rgba(255,255,255,0.3)'
                    }}
                >
                    {user?.name?.charAt(0).toUpperCase() || <PersonIcon sx={{ fontSize: 16 }} />}
                </Avatar>
            </Box>
        </Box>
    )
}

export default ViewerLayout
