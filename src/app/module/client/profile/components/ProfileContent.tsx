import React from 'react';
import { Box, Typography, Grid, Stack, IconButton } from '@mui/material';
import { AccountCircle, SettingsOutlined } from '@mui/icons-material';
import AccountSettings from './AccountSettings';
import MobileStatsBar from './MobileStatsBar';
import QuickActions from './QuickActions';
import WatchHistory from './WatchHistory';

interface ProfileContentProps {
    isMobile: boolean;
    watchHistory: any[];
    loading: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ isMobile, watchHistory, loading }) => {
    return (
        <Box className={`bg-[#14141A]/40 backdrop-blur-xl border-[#2A2A35]/50 shadow-2xl flex flex-col
            ${isMobile ? 'rounded-none' : 'rounded-[32px] border p-8 pb-12'}`}>
            
            {isMobile ? <MobileStatsBar /> : <ActivityHeader />}
            
            <QuickActions isMobile={isMobile} />
            <WatchHistory isMobile={isMobile} history={watchHistory} loading={loading} />
            <AccountSettings isMobile={isMobile} />
        </Box>
    );
};

const ActivityHeader: React.FC = () => (
    <Box className="flex items-center justify-between mb-10">
        <Typography className="text-2xl font-black italic tracking-tighter">Activity Overview</Typography>
        <Stack direction="row" spacing={2}>
            <IconButton className="bg-[#1A1A22] text-[#A1A1AA] hover:text-[#FF2D2D]">
                <AccountCircle />
            </IconButton>
            <IconButton className="bg-[#1A1A22] text-[#A1A1AA] hover:text-[#FF2D2D]">
                <SettingsOutlined />
            </IconButton>
        </Stack>
    </Box>
);

export default ProfileContent;