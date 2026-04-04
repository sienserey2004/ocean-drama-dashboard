import React from 'react';
import {
    Box,
    Container,
    Paper,
    Avatar,
    Badge,
    IconButton,
    Button,
    LinearProgress,
    Typography,
    Divider,
    Stack,
    Grid,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    FavoriteBorder,
    NotificationsNone,
    SettingsOutlined,
    ChevronRight,
    Star,
    History,
    Payment,
    ShoppingBag,
    LocalMall,
    RateReview,
    Storefront,
    CheckCircle,
    HelpOutline,
    LocationOn,
    Logout,
    Home,
    Search,
    Chat,
    Person,
    PlayCircleOutline,
    AccountCircle
} from '@mui/icons-material';

const ProfileScreen: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Dummy click handlers
    const handleNavClick = (tab: string) => console.log(`Navigate to ${tab}`);
    const handleStatClick = (stat: string) => console.log(`Stat clicked: ${stat}`);
    const handleVipClick = () => console.log('Upgrade to VIP');
    const handleSettingClick = (setting: string) => console.log(`Setting: ${setting}`);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#0B0B0F',
                backgroundImage: 'radial-gradient(circle at top, rgba(255,45,45,0.15), transparent 70%)',
                backgroundAttachment: 'fixed',
                color: '#FFFFFF',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                pb: isMobile ? 12 : 8
            }}
        >
            {/* Main Content Container */}
            <Container maxWidth="lg" sx={{ px: isMobile ? 0 : 4, py: isMobile ? 0 : 8 }}>
                <Grid container spacing={isMobile ? 0 : 4}>

                    {/* Left Column: User Profile & VIP Info */}
                    <Grid item xs={12} md={4} lg={3.5}>
                        <Box
                            className={`bg-[#14141A]/60 backdrop-blur-xl border-[#2A2A35]/50 shadow-2xl overflow-hidden flex flex-col
                ${isMobile ? 'rounded-none border-b' : 'rounded-[32px] border h-full'}`}
                        >
                            {/* Header Box (Logo and Settings) */}
                            <Box className="px-6 pt-6 flex justify-between items-center bg-gradient-to-b from-[#FF2D2D]/10 to-transparent">
                                <Typography
                                    sx={{
                                        fontSize: 20,
                                        fontWeight: 900,
                                        fontFamily: "'Oswald', sans-serif",
                                        textTransform: 'uppercase',
                                        color: 'white',
                                        textShadow: '2px 2px 0px #FF2D2D',
                                    }}
                                >
                                    OCEAN DRAMA
                                </Typography>
                                <IconButton className="bg-[#2A2A35]/50" sx={{ color: 'white' }}>
                                    <SettingsOutlined />
                                </IconButton>
                            </Box>

                            {/* Profile Bio Section */}
                            <Box className="p-8 flex flex-col items-center text-center">
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        <Box
                                            className="bg-[#FF2D2D] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(255,45,45,0.6)]"
                                            sx={{ border: '3px solid #14141A' }}
                                        >
                                            PRO
                                        </Box>
                                    }
                                >
                                    <Avatar
                                        sx={{
                                            width: isMobile ? 80 : 120,
                                            height: isMobile ? 80 : 120,
                                            bgcolor: '#1A1A22',
                                            border: '4px solid #FF2D2D',
                                            boxShadow: '0 0 30px rgba(255,45,45,0.3)',
                                        }}
                                        className="text-white text-4xl font-black"
                                    >
                                        DS
                                    </Avatar>
                                </Badge>
                                <Typography className="mt-5 text-2xl font-black tracking-tight">Dara Sok</Typography>
                                <Typography className="text-[#A1A1AA] text-sm font-medium mb-5">@darasok · Premium Member</Typography>

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    className="border-[#2A2A35] text-[#A1A1AA] hover:border-[#FF2D2D] hover:text-white transition-all duration-300 rounded-full px-6 py-2 normal-case mb-6"
                                >
                                    Edit Profile
                                </Button>

                                {/* Desktop Stats (Vertical layout in side box) */}
                                <Box className="w-full grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Watched', value: '42' },
                                        { label: 'Library', value: '15' },
                                        { label: 'Favorites', value: '128' },
                                        { label: 'Points', value: '2.4k' },
                                    ].map((stat, idx) => (
                                        <Box key={idx} className="p-4 bg-[#1A1A22]/80 rounded-2xl border border-[#2A2A35] hover:border-[#FF2D2D]/30 transition-all cursor-pointer">
                                            <Typography className="text-xl font-black text-white">{stat.value}</Typography>
                                            <Typography className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">{stat.label}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {/* VIP Promotion Box */}
                            <Box className="p-4 pt-0">
                                <Box
                                    className="bg-gradient-to-br from-[#FF2D2D] to-[#CC1F1F] rounded-3xl p-6 cursor-pointer group hover:scale-[1.03] transition-all duration-300 shadow-[0_10px_30px_rgba(255,45,45,0.3)]"
                                    onClick={handleVipClick}
                                >
                                    <Typography className="text-white text-xl font-black leading-tight italic mb-1 uppercase tracking-tight">Unlimited Pass</Typography>
                                    <Typography className="text-white/80 text-[10px] font-bold mb-4 uppercase tracking-widest">Early Access · No Ads · 4K</Typography>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        className="bg-white text-[#FF2D2D] hover:bg-white/90 font-black rounded-full shadow-lg normal-case py-2"
                                    >
                                        Go Premium
                                    </Button>
                                </Box>
                            </Box>

                            {/* Logout - Desktop only bottom anchored style */}
                            {!isMobile && (
                                <Box className="p-8 pt-0 mt-auto">
                                    <Button
                                        startIcon={<Logout />}
                                        fullWidth
                                        className="text-[#A1A1AA] hover:text-[#FF2D2D] transition-colors normal-case font-bold p-3"
                                        onClick={() => handleSettingClick('Sign Out')}
                                    >
                                        Log Out
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Right Column: Content, Horizontal Grids, etc. */}
                    <Grid item xs={12} md={8} lg={8.5}>
                        <Box
                            className={`bg-[#14141A]/40 backdrop-blur-xl border-[#2A2A35]/50 shadow-2xl flex flex-col
                ${isMobile ? 'rounded-none' : 'rounded-[32px] border p-8 pb-12'}`}
                        >

                            {/* Quick Summary Bar (Visible on mobile as overlapped stats) */}
                            {isMobile ? (
                                <Box className="mx-6 p-1 bg-[#1A1A22]/80 rounded-2xl border border-[#2A2A35] shadow-lg flex mb-8">
                                    {[
                                        { label: 'Watched', value: '42' },
                                        { label: 'Library', value: '15' },
                                        { label: 'Favorites', value: '128' },
                                        { label: 'Points', value: '2.4k' },
                                    ].map((stat, idx) => (
                                        <Box key={idx} className="flex-1 flex flex-col items-center py-3 cursor-pointer relative" onClick={() => handleStatClick(stat.label)}>
                                            <Typography className="text-xl font-black text-white">{stat.value}</Typography>
                                            <Typography className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">{stat.label}</Typography>
                                            {idx < 3 && <Box className="w-px h-6 bg-[#2A2A35] absolute right-0 top-1/2 -translate-y-1/2" />}
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box className="flex items-center justify-between mb-10">
                                    <Typography className="text-2xl font-black italic tracking-tighter">Activity Overview</Typography>
                                    <Stack direction="row" spacing={2}>
                                        <IconButton className="bg-[#1A1A22] text-[#A1A1AA] hover:text-[#FF2D2D]"><AccountCircle /></IconButton>
                                        <IconButton className="bg-[#1A1A22] text-[#A1A1AA] hover:text-[#FF2D2D]"><SettingsOutlined /></IconButton>
                                    </Stack>
                                </Box>
                            )}

                            {/* Quick Actions Grid */}
                            <Box className={`${isMobile ? 'px-6' : ''} mb-10`}>
                                <Typography className="text-[#A1A1AA] text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Box className="w-1.5 h-3 bg-[#FF2D2D] rounded-full"></Box> Quick Actions
                                </Typography>
                                <Grid container spacing={isMobile ? 2 : 3}>
                                    {[
                                        { icon: <FavoriteBorder />, label: 'Favorites' },
                                        { icon: <LocalMall />, label: 'My Library' },
                                        { icon: <History />, label: 'Watch History' },
                                        { icon: <Payment />, label: 'Wallet' },
                                        { icon: <Storefront />, label: 'Store' },
                                        { icon: <RateReview />, label: 'Reviews', badge: 'NEW' },
                                        { icon: <LocationOn />, label: 'Following' },
                                        { icon: <HelpOutline />, label: 'Support' },
                                    ].map((item, idx) => (
                                        <Grid item xs={3} sm={3} md={2.4} lg={1.5} key={idx}>
                                            <Box className="flex flex-col items-center gap-2 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group">
                                                <Box className="w-14 h-14 rounded-2xl bg-[#1A1A22] border border-[#2A2A35] flex items-center justify-center group-hover:border-[#FF2D2D]/50 group-hover:shadow-[0_0_20px_rgba(255,45,45,0.2)]">
                                                    {React.cloneElement(item.icon as React.ReactElement, { sx: { color: '#FF2D2D', fontSize: 24 } })}
                                                </Box>
                                                <Typography className="text-[10px] font-bold text-[#A1A1AA] text-center group-hover:text-white transition-colors leading-tight">{item.label}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Recently Watched Slider */}
                            <Box className={`${isMobile ? 'px-6' : ''} mb-10`}>
                                <Box className="flex justify-between items-center mb-6">
                                    <Typography className="text-white text-lg font-black italic uppercase tracking-tighter">Recently Watched</Typography>
                                    <Typography className="text-[#FF2D2D] text-xs font-bold cursor-pointer hover:underline items-center flex gap-1">View All <ChevronRight sx={{ fontSize: 14 }} /></Typography>
                                </Box>
                                <Stack direction="row" spacing={3} className="overflow-x-auto pb-6 no-scrollbar">
                                    {[
                                        { title: 'The Silent Sea', progress: 85, img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop' },
                                        { title: 'Kingdom', progress: 30, img: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop' },
                                        { title: 'Alchemy of Souls', progress: 100, img: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop' },
                                        { title: 'Squid Game', progress: 10, img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop' },
                                        { title: 'Vincenzo', progress: 50, img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop' },
                                    ].map((item, idx) => (
                                        <Box key={idx} className="flex-shrink-0 w-[160px] group cursor-pointer">
                                            <Box className="relative w-[160px] h-[240px] rounded-2xl overflow-hidden border border-[#2A2A35] group-hover:border-[#FF2D2D] group-hover:scale-[1.02] transition-all duration-300 shadow-xl group-hover:shadow-[0_0_20px_rgba(255,45,45,0.2)]">
                                                <Box component="img" src={item.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                <Box className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                                                <Box className="absolute bottom-3 left-3 right-3">
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={item.progress}
                                                        sx={{
                                                            height: 4,
                                                            borderRadius: 99,
                                                            bgcolor: 'rgba(255,255,255,0.2)',
                                                            '& .MuiLinearProgress-bar': { bgcolor: '#FF2D2D' }
                                                        }}
                                                    />
                                                </Box>
                                                <Box className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                                    <Box className="bg-[#FF2D2D] p-3 rounded-full shadow-[0_0_20px_rgba(255,45,45,0.8)]">
                                                        <PlayCircleOutline sx={{ color: 'white', fontSize: 32 }} />
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Typography className="text-[11px] font-black text-white mt-3 group-hover:text-[#FF2D2D] truncate tracking-tight uppercase italic">{item.title}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>

                            {/* Lists / Settings Section */}
                            <Box className={`${isMobile ? 'px-6 pb-24' : ''}`}>
                                <Typography className="text-[#A1A1AA] text-[11px] font-black uppercase tracking-[0.2em] mb-4">Account Settings</Typography>
                                <Grid container spacing={2}>
                                    {[
                                        { icon: <Star />, label: 'Active Subscription', value: 'Unlimited Monthly Pass', color: '#FF2D2D' },
                                        { icon: <ShoppingBag />, label: 'My Purchases', value: '15 items in library' },
                                        { icon: <NotificationsNone />, label: 'Account Notifications', value: 'Enabled' },
                                    ].map((item, idx) => (
                                        <Grid item xs={12} key={idx}>
                                            <Box className="p-5 rounded-2xl bg-[#1A1A22]/50 border border-[#2A2A35]/30 hover:border-[#FF2D2D]/30 transition-all cursor-pointer flex items-center gap-4 group">
                                                <Box className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center group-hover:bg-[#FF2D2D]/10">
                                                    {React.cloneElement(item.icon as React.ReactElement, { sx: { color: item.color || '#A1A1AA', fontSize: 20 } })}
                                                </Box>
                                                <Box className="flex-1">
                                                    <Typography className="text-[13px] font-black tracking-tight">{item.label}</Typography>
                                                    <Typography className="text-[11px] text-[#A1A1AA] font-bold">{item.value}</Typography>
                                                </Box>
                                                <ChevronRight sx={{ color: '#2A2A35' }} className="group-hover:text-[#FF2D2D] transition-colors" />
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Modern Bottom Nav - Mobile Only */}
            {/* {isMobile && (
        <Paper 
          elevation={0} 
          className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-[#0B0B0F]/90 backdrop-blur-xl border-t border-[#2A2A35] flex justify-around items-center py-4 px-6 z-50 rounded-t-3xl"
        >
          {[
            { icon: <Home />, label: 'Home' },
            { icon: <Search />, label: 'Search' },
            { icon: <Chat />, label: 'Feed' },
            { icon: <Person />, label: 'Profile', active: true },
          ].map((tab, idx) => {
            const active = tab.active;
            return (
              <Box key={idx} className="flex flex-col items-center gap-1 cursor-pointer">
                <Box className={`p-2 rounded-xl transition-all ${active ? 'bg-[#FF2D2D] shadow-[0_0_20px_rgba(255,45,45,0.4)]' : 'text-[#A1A1AA]'}`}>
                   {React.cloneElement(tab.icon as React.ReactElement, { sx: { fontSize: 22, color: active ? 'white' : 'inherit' } })}
                </Box>
                <Typography className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-[#FF2D2D]' : 'text-[#A1A1AA]'}`}>
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Paper>
      )} */}
        </Box>
    );
};

export default ProfileScreen;