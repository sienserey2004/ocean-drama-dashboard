import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { Star, ShoppingBag, NotificationsNone, ChevronRight } from '@mui/icons-material';
import { useAuthStore } from '@/app/stores/authStore';

interface AccountSettingsProps {
    isMobile: boolean;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ isMobile }) => {
    const { user } = useAuthStore();
    
    const settings = [
        { icon: <Star />, label: 'Active Subscription', value: user?.role === 'viewer' ? 'Basic Member' : 'Unlimited Monthly Pass', color: '#FF2D2D' },
        { icon: <ShoppingBag />, label: 'My Purchases', value: `${user?.stats?.purchases_count || 0} items in library` },
        { icon: <NotificationsNone />, label: 'Account Notifications', value: 'Enabled' },
    ];

    return (
        <Box className={`${isMobile ? 'px-6 pb-24' : ''}`}>
            <Typography className="text-[#A1A1AA] text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                Account Settings
            </Typography>
            <Grid container spacing={2}>
                {settings.map((item, idx) => (
                    <Grid item xs={12} key={idx}>
                        <SettingItem {...item} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

const SettingItem: React.FC<{ icon: React.ReactElement; label: string; value: string; color?: string }> = 
({ icon, label, value, color }) => (
    <Box className="p-5 rounded-2xl bg-[#1A1A22]/50 border border-[#2A2A35]/30 hover:border-[#FF2D2D]/30 transition-all cursor-pointer flex items-center gap-4 group">
        <Box className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center group-hover:bg-[#FF2D2D]/10">
            {React.cloneElement(icon, { sx: { color: color || '#A1A1AA', fontSize: 20 } })}
        </Box>
        <Box className="flex-1">
            <Typography className="text-[13px] font-black tracking-tight">{label}</Typography>
            <Typography className="text-[11px] text-[#A1A1AA] font-bold">{value}</Typography>
        </Box>
        <ChevronRight sx={{ color: '#2A2A35' }} className="group-hover:text-[#FF2D2D] transition-colors" />
    </Box>
);

export default AccountSettings;