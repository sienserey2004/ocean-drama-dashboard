import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import {
    FavoriteBorder, LocalMall, History, Payment, Storefront,
    RateReview, LocationOn, HelpOutline
} from '@mui/icons-material';

interface QuickActionsProps {
    isMobile: boolean;
}

const actions = [
    { icon: <FavoriteBorder />, label: 'Favorites' },
    { icon: <LocalMall />, label: 'My Library' },
    { icon: <History />, label: 'Watch History' },
    { icon: <Payment />, label: 'Wallet' },
    { icon: <Storefront />, label: 'Store' },
    { icon: <RateReview />, label: 'Reviews', badge: 'NEW' },
    { icon: <LocationOn />, label: 'Following' },
    { icon: <HelpOutline />, label: 'Support' },
];

const QuickActions: React.FC<QuickActionsProps> = ({ isMobile }) => {
    return (
        <Box className={`${isMobile ? 'px-6' : ''} mb-10`}>
            <SectionTitle title="Quick Actions" />
            <Grid container spacing={isMobile ? 2 : 3}>
                {actions.map((item, idx) => (
                    <Grid item xs={3} sm={3} md={2.4} lg={1.5} key={idx}>
                        <ActionItem icon={item.icon} label={item.label} badge={item.badge} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <Typography component="div" className="text-[#A1A1AA] text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <Box className="w-1.5 h-3 bg-[#FF2D2D] rounded-full"></Box> {title}
    </Typography>
);

const ActionItem: React.FC<{ icon: React.ReactElement; label: string; badge?: string }> = ({ icon, label, badge }) => (
    <Box className="flex flex-col items-center gap-2 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group">
        <Box className="w-14 h-14 rounded-2xl bg-[#1A1A22] border border-[#2A2A35] flex items-center justify-center group-hover:border-[#FF2D2D]/50 group-hover:shadow-[0_0_20px_rgba(255,45,45,0.2)]">
            {React.cloneElement(icon, { sx: { color: '#FF2D2D', fontSize: 24 } })}
        </Box>
        <Typography className="text-[10px] font-bold text-[#A1A1AA] text-center group-hover:text-white transition-colors leading-tight">
            {label}
        </Typography>
    </Box>
);

export default QuickActions;