import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { 
    Box, Typography, Stack, IconButton, Tabs, Tab, Button, 
    CircularProgress, Dialog, Avatar, DialogContent, DialogActions 
} from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import IosShareIcon from '@mui/icons-material/IosShare'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import toast from 'react-hot-toast'
import { episodeApi } from '@/api/episode.service'
import { videoApi } from '@/api/video.service'
import { paymentApi } from '@/api/payment.service'
import QRPaymentCard from '@/components/shared/QRPaymentCard'
import { Episode } from '@/types'

const EpisodeListPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { videoId } = useParams();

    const numericVideoId = Number(videoId);
    
    // The video object is passed via router state from VideoCard
    const [video, setVideo] = useState<any>(location.state?.video || null);

    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    // Full screen player state
    const [playerOpen, setPlayerOpen] = useState(false);
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

    // Payment state
    const [paymentInfo, setPaymentInfo] = useState<{
        qrCode?: string;
        qrString?: string;
        transactionId?: string;
        status?: string;
    } | null>(null);
    
    const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        }
    }, []);

    const fetchEpisodes = async (id: number) => {
        if (!id) {
            console.error("videoId is missing");
            return;
        }
        const res = await episodeApi.list(id, { page: 1, limit: 100 });
        const sortedEpisodes = [...res.data].sort((a, b) => a.episode_number - b.episode_number);
        setEpisodes(sortedEpisodes);
    };

    useEffect(() => {
        if (!numericVideoId) return;

        const loadData = async () => {
            try {
                setLoading(true);
                if (!video) {
                    try {
                        const videoData = await videoApi.getById(numericVideoId);
                        setVideo(videoData);
                    } catch (e) {
                        console.error("Failed to fetch video missing from state", e);
                    }
                }
                
                console.log("Route videoId:", videoId);
                console.log("Numeric videoId:", numericVideoId);
                console.log("Video object:", video);
                
                await fetchEpisodes(numericVideoId);
            } catch (err: any) {
                console.error("Failed to fetch episodes", err);
                setError("Could not load episodes. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [numericVideoId]);

    // Derived filtered episodes based on Tabs
    const displayedEpisodes = episodes.filter(ep => {
        if (tabIndex === 1) return ep.has_access || ep.title.toLowerCase().includes('free'); // Fake free check if has_access is not strictly enough
        if (tabIndex === 2) return !ep.has_access;
        return true;
    });

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')} min`;
    };

    const handleEpisodeClick = (ep: Episode) => {
        if (ep.has_access) {
            setActiveVideoUrl(ep.full_video_url || ep.preview_video_url);
            setPlayerOpen(true);
        } else {
            // Locked -> open purchase modal
            setModalOpen(true);
        }
    };

    const startVerifyPolling = (transactionId: string) => {
        if (pollingRef.current) {
            console.log("Clearing previous polling...");
            clearInterval(pollingRef.current);
        }
        
        console.log("Starting payment verification polling for:", transactionId);
        pollingRef.current = setInterval(async () => {
            console.log("Polling status for transaction:", transactionId, "at", new Date().toLocaleTimeString());
            try {
                const res = await paymentApi.verify(transactionId);
                console.log("Polling result:", res.status);
                
                if (res.status === 'completed') {
                    console.log("Payment completed! Proceeding to library.");
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setEpisodes(prev => prev.map(ep => ({ ...ep, has_access: true })));
                    toast.success("Payment verified! Redirecting to your library...", { duration: 3000 });
                    
                    setModalOpen(false);
                    setPaymentInfo(null);

                    // Redirect to the newly purchased series
                    setTimeout(() => {
                        navigate(`/viewer/series/${numericVideoId}`, { replace: true });
                    }, 1500);
                }
            } catch (err: any) {
                if (err.response?.status === 400) {
                   console.log("Payment still pending...");
                } else {
                   console.error("Verification error:", err.message);
                }
            }
        }, 5000);
    };

    const handlePurchase = async (vidId: number) => {
        try {
            setPurchasing(true);
            const res = await paymentApi.initiate({
                amount: video.price,
                video_id: vidId
            });
            
            setPaymentInfo({
                qrCode: res.qr_code,
                qrString: res.qr_string,
                transactionId: res.transaction_id,
                status: res.status
            });
            
            // Start polling for verification
            startVerifyPolling(res.transaction_id);
            toast("Payment initiated. Scan the QR code to pay.");
        } catch (err: any) {
            console.error("Initiation failed:", err);
            toast.error(err.response?.data?.message || "Payment initiation failed. Please try again.");
        } finally {
            setPurchasing(false);
        }
    };

    if (!video) return null; // Prevent render if no state

    return (
        <Box sx={{ bgcolor: '#0B0B0C', minHeight: '100vh', color: 'white', pb: 10 }}>
            {/* ── Header ────────────────────────────────────────────── */}
            <Box sx={{ 
                position: 'sticky', top: 0, zIndex: 10, bgcolor: 'rgba(11,11,12,0.9)', 
                backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
                        <ArrowBackIosNewIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, textAlign: 'center', fontSize: 16 }} noWrap>
                        {video.title}
                    </Typography>
                    <IconButton sx={{ color: 'white' }}>
                        <IosShareIcon sx={{ fontSize: 24 }} />
                    </IconButton>
                </Stack>
            </Box>

            {/* ── Series Info Card ──────────────────────────────────── */}
            <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar 
                        src={video.thumbnail_url || video.thumbnailUrl || undefined} 
                        variant="rounded" 
                        sx={{ width: 80, height: 110, borderRadius: 2 }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2, mb: 1 }}>
                            {video.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ opacity: 0.7, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold">
                                {video.creator?.name || 'OceanDrama Creator'}
                            </Typography>
                            <CheckCircleIcon sx={{ fontSize: 14, color: '#20D5EC' }} />
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#FE2C55', fontWeight: 'bold' }}>
                            {video.price > 0 ? `$${video.price}` : 'Free'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Unlock all episodes for a one-time payment
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* ── Tabs ──────────────────────────────────────────────── */}
            <Tabs 
                value={tabIndex} 
                onChange={(_, v) => setTabIndex(v)}
                variant="fullWidth"
                sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    '& .MuiTabs-indicator': { backgroundColor: '#FE2C55' },
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontWeight: 'bold', fontSize: 15 },
                    '& .Mui-selected': { color: '#fff !important' },
                }}
            >
                <Tab label={`All (${episodes.length || 0})`} />
                <Tab label="Free" />
                <Tab label="Locked" />
            </Tabs>

            {/* ── Episode List ──────────────────────────────────────── */}
            <Box sx={{ p: 2 }}>
                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress sx={{ color: '#FE2C55' }} size={30} />
                    </Box>
                )}
                
                {!loading && error && (
                    <Typography color="error" textAlign="center" py={4}>{error}</Typography>
                )}

                {!loading && !error && displayedEpisodes.length === 0 && (
                    <Typography textAlign="center" py={8} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        No episodes found.
                    </Typography>
                )}

                <Stack spacing={2}>
                    {displayedEpisodes.map((ep, idx) => (
                        <Box 
                            key={ep.episode_id} 
                            onClick={() => handleEpisodeClick(ep)}
                            sx={{ 
                                display: 'flex', alignItems: 'center', p: 1.5, 
                                bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2,
                                cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                            }}
                        >
                            <Box sx={{ width: 100, height: 60, bgcolor: '#1A1A1D', borderRadius: 1.5, position: 'relative', mr: 2, overflow: 'hidden' }}>
                                { (video.thumbnail_url || video.thumbnailUrl) && (
                                    <img src={video.thumbnail_url || video.thumbnailUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                                )}
                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {ep.has_access ? <PlayCircleOutlineIcon sx={{ color: 'white', opacity: 0.8 }} /> : <LockIcon sx={{ color: '#FE2C55' }} />}
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">EP {ep.episode_number} — {ep.title}</Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                                    {formatDuration(ep.duration)}
                                </Typography>
                            </Box>
                            <Box>
                                {ep.has_access ? (
                                    <Typography variant="caption" sx={{ color: '#20D5EC', fontWeight: 'bold' }}>Free</Typography>
                                ) : (
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Locked</Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </Box>

            {/* ── Sticky Bottom CTA ─────────────────────────────────── */}
            <Box sx={{ 
                position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, 
                bgcolor: '#0B0B0C', borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'center', zIndex: 50 
            }}>
                <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => setModalOpen(true)}
                    sx={{ 
                        position: 'fixed',
                        bottom: { xs: 90, md: 20 },
                        zIndex: 30,
                        mx: 2,
                        bgcolor: '#FE2C55', color: 'white', py: 1.5, borderRadius: 2,
                        fontSize: 16, fontWeight: 'bold',
                        '&:hover': { bgcolor: '#E0264A' }
                    }}
                >
                    Unlock full series — {video.price > 0 ? `$${video.price}` : 'Free'}
                </Button>
            </Box>

            {/* ── Purchase Modal ────────────────────────────────────── */}
            <Dialog 
                open={modalOpen} 
                onClose={() => {
                    if (!purchasing) {
                        if (pollingRef.current) {
                            console.log("Closing dialog: Clearing polling interval.");
                            clearInterval(pollingRef.current);
                        }
                        setModalOpen(false);
                        setPaymentInfo(null);
                    }
                }}
                PaperProps={{
                    sx: { bgcolor: '#1A1A1D', color: 'white', borderRadius: 3, p: 1, minWidth: 300 }
                }}
            >
                <DialogContent sx={{ textAlign: 'center', pb: 1 }}>
                    {!paymentInfo ? (
                        <>
                            <LockIcon sx={{ color: '#FE2C55', fontSize: 48, mb: 1 }} />
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Unlock {video.title}</Typography>
                        </>
                    ) : (
                        <QRPaymentCard 
                            name={video.creator?.name || "Premium Creator"}
                            amount={video.price}
                            currency="USD"
                            qrValue={paymentInfo.qrString || paymentInfo.qrCode || ""}
                        />
                    )}
                    <Typography variant="body1" sx={{ color: '#FE2C55', fontWeight: '900', fontSize: 24, mb: 1 }}>
                        ${video.price}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {paymentInfo ? "Checking payment status..." : "One-time payment · All episodes forever"}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
                    <Button 
                        onClick={() => {
                            console.log("Payment cancelled by user. Clearing polling.");
                            if (pollingRef.current) clearInterval(pollingRef.current);
                            setModalOpen(false);
                            setPaymentInfo(null);
                        }} 
                        disabled={purchasing}
                        sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                    >
                        Cancel
                    </Button>
                    {!paymentInfo && (
                        <Button 
                            variant="contained" 
                            onClick={() => handlePurchase(numericVideoId)}
                            disabled={purchasing}
                            sx={{ bgcolor: '#FE2C55', color: 'white', fontWeight: 'bold', '&:hover': { bgcolor: '#E0264A' } }}
                        >
                            {purchasing ? <CircularProgress size={20} color="inherit" /> : "Initiate Payment"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* ── Full Screen Video Player Modal ────────────────────── */}
            <Dialog fullScreen open={playerOpen} onClose={() => setPlayerOpen(false)}>
                <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'black', position: 'relative' }}>
                    <IconButton 
                        onClick={() => setPlayerOpen(false)} 
                        sx={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
                    >
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    {activeVideoUrl && (
                        <video 
                            src={activeVideoUrl} 
                            controls 
                            autoPlay 
                            playsInline 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                    )}
                </Box>
            </Dialog>

        </Box>
    );
};

export default EpisodeListPage;