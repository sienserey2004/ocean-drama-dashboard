import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, useMediaQuery, useTheme } from '@mui/material';
import { userApi } from '@/app/api/user.service';
import { useAuthStore } from '@/app/stores/authStore';
import ProfileContent from './components/ProfileContent';
import ProfileSidebar from './components/ProfileSidebar';

const ProfileScreen: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, isAuthenticated, refreshUser } = useAuthStore();
    
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchHistory();
        }
    }, [isAuthenticated]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            refreshUser();
            const res = await userApi.getWatchHistory({ limit: 10 });
            if (res && res.data) {
                setWatchHistory(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#0B0B0F',
            backgroundImage: 'radial-gradient(circle at top, rgba(255,45,45,0.15), transparent 70%)',
            backgroundAttachment: 'fixed',
            color: '#FFFFFF',
            fontFamily: "'Inter', 'Poppins', sans-serif",
            pb: isMobile ? 12 : 8
        }}>
            <Container maxWidth="lg" sx={{ px: isMobile ? 0 : 4, py: isMobile ? 0 : 8 }}>
                <Grid container spacing={isMobile ? 0 : 4}>
                    <Grid item xs={12} md={4} lg={3.5}>
                        <ProfileSidebar isMobile={isMobile} />
                    </Grid>
                    <Grid item xs={12} md={8} lg={8.5}>
                        <ProfileContent 
                            isMobile={isMobile}
                            watchHistory={watchHistory}
                            loading={loading}
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ProfileScreen;