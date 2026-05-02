import React from 'react';
import { Box, Avatar, Badge, IconButton, Button, Typography } from '@mui/material';
import { SettingsOutlined, Person, Logout } from '@mui/icons-material';
import { useAuthStore } from '@/app/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface ProfileSidebarProps {
    isMobile: boolean;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isMobile }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const stats = [
        { label: 'Watched', value: user?.stats?.watch_history_count || '0' },
        { label: 'Library', value: user?.stats?.purchases_count || '0' },
        { label: 'Favorites', value: user?.stats?.favorites_count || '0' },
        { label: 'Following', value: user?.stats?.following_count || '0' },
    ];

    return (
        <Box className={`bg-[#14141A]/60 backdrop-blur-xl border-[#2A2A35]/50 shadow-2xl overflow-hidden flex flex-col
            ${isMobile ? 'rounded-none border-b' : 'rounded-[32px] border h-full'}`}>
            
            <ProfileHeader />
            <ProfileBio user={user} isMobile={isMobile} stats={stats} />
            <VipPromotion onUpgrade={() => navigate('/subscription-plan')} />
            
            <LogoutButton />
        </Box>
    );
};

const ProfileHeader: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Box className="px-6 pt-6 flex justify-between items-center bg-gradient-to-b from-[#FF2D2D]/10 to-transparent">
            <Typography sx={{
                fontSize: 20,
                fontWeight: 900,
                fontFamily: "'Oswald', sans-serif",
                textTransform: 'uppercase',
                color: 'white',
                textShadow: '2px 2px 0px #FF2D2D',
            }}>
                OCEAN DRAMA
            </Typography>
            <IconButton 
                className="bg-[#2A2A35]/50" 
                sx={{ color: 'white' }}
                onClick={() => navigate('/dashboard/profile')}
            >
                <SettingsOutlined />
            </IconButton>
        </Box>
    );
};

interface ProfileBioProps {
    user: any;
    isMobile: boolean;
    stats: Array<{ label: string; value: string | number }>;
}

const ProfileBio: React.FC<ProfileBioProps> = ({ user, isMobile, stats }) => (
    <Box className="p-8 flex flex-col items-center text-center">
        <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
                <Box className="bg-[#FF2D2D] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(255,45,45,0.6)]"
                    sx={{ border: '3px solid #14141A' }}>
                    PRO
                </Box>
            }>
            <Avatar
                src={user?.profile_image || ""}
                sx={{
                    width: isMobile ? 80 : 120,
                    height: isMobile ? 80 : 120,
                    bgcolor: '#1A1A22',
                    border: '4px solid #FF2D2D',
                    boxShadow: '0 0 30px rgba(255,45,45,0.3)',
                }}
                className="text-white text-4xl font-black">
                {user?.name?.charAt(0) || <Person />}
            </Avatar>
        </Badge>
        
        <Typography className="mt-5 text-2xl font-black tracking-tight">
            {user?.name || "Guest User"}
        </Typography>
        
        <Typography className="text-[#A1A1AA] text-sm font-medium mb-5">
            @{user?.name?.toLowerCase().replace(/\s/g, '') || "guest"} · {user?.role === 'viewer' ? 'Member' : 'VIP Member'}
        </Typography>

        <Button variant="outlined" fullWidth
            className="border-[#2A2A35] text-[#A1A1AA] hover:border-[#FF2D2D] hover:text-white transition-all duration-300 rounded-full px-6 py-2 normal-case mb-6">
            Edit Profile
        </Button>

        <Box className="w-full grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
                <StatCard key={idx} label={stat.label} value={stat.value} />
            ))}
        </Box>
    </Box>
);

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <Box className="p-4 bg-[#1A1A22]/80 rounded-2xl border border-[#2A2A35] hover:border-[#FF2D2D]/30 transition-all cursor-pointer">
        <Typography className="text-xl font-black text-white">{value}</Typography>
        <Typography className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">{label}</Typography>
    </Box>
);

const VipPromotion: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => (
    <Box className="p-4 pt-0">
        <Box className="bg-gradient-to-br from-[#FF2D2D] to-[#CC1F1F] rounded-3xl p-6 cursor-pointer group hover:scale-[1.03] transition-all duration-300 shadow-[0_10px_30px_rgba(255,45,45,0.3)]"
            onClick={onUpgrade}>
            <Typography className="text-white text-xl font-black leading-tight italic mb-1 uppercase tracking-tight">
                Unlimited Pass
            </Typography>
            <Typography className="text-white/80 text-[10px] font-bold mb-4 uppercase tracking-widest">
                Early Access · No Ads · 4K
            </Typography>
            <Button variant="contained" fullWidth
                className="bg-white text-[#FF2D2D] hover:bg-white/90 font-black rounded-full shadow-lg normal-case py-2">
                Upgrade to start business
            </Button>
        </Box>
    </Box>
);

const LogoutButton: React.FC = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <Box className="p-8 pt-0 mt-auto">
            <Button 
                startIcon={<Logout />} 
                fullWidth
                onClick={handleLogout}
                className="text-[#A1A1AA] hover:text-[#FF2D2D] transition-colors normal-case font-bold p-3"
            >
                Log Out
            </Button>
        </Box>
    );
};

export default ProfileSidebar;