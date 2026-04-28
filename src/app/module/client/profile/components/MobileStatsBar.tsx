import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuthStore } from '@/app/stores/authStore';

const MobileStatsBar: React.FC = () => {
    const { user } = useAuthStore();
    
    const stats = [
        { label: 'Watched', value: user?.stats?.watch_history_count || '0' },
        { label: 'Library', value: user?.stats?.purchases_count || '0' },
        { label: 'Favorites', value: user?.stats?.favorites_count || '0' },
        { label: 'Following', value: user?.stats?.following_count || '0' },
    ];

    return (
        <Box className="mx-6 p-1 bg-[#1A1A22]/80 rounded-2xl border border-[#2A2A35] shadow-lg flex mb-8">
            {stats.map((stat, idx) => (
                <Box key={idx} className="flex-1 flex flex-col items-center py-3 cursor-pointer relative">
                    <Typography className="text-xl font-black text-white">{stat.value}</Typography>
                    <Typography className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">
                        {stat.label}
                    </Typography>
                    {idx < 3 && <Box className="w-px h-6 bg-[#2A2A35] absolute right-0 top-1/2 -translate-y-1/2" />}
                </Box>
            ))}
        </Box>
    );
};

export default MobileStatsBar;