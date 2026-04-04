import React, { useState } from 'react';
import {
  Box,
  Container,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Avatar,
  Typography,
  Paper,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress
} from '@mui/material';

import {
  Sort,
  Star,
  Schedule,
  Theaters,
  Home,
  Search,
  LibraryBooks,
  Person,
  PlayArrow,
  Download,
  CheckCircle,
  MoreHoriz,
  AccessTime,
  TrendingUp,
  Refresh
} from '@mui/icons-material';
import { videoApi } from '@/app/api/video.service';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/app/stores/authStore';


// Custom theme for dark mode
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#534AB7',
    },
    secondary: {
      main: '#0F6E56',
    },
    background: {
      default: '#0f0f10',
      paper: '#1a1a1c',
    },
    text: {
      primary: '#f0ede8',
      secondary: '#aaa',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
  },
  shape: {
    borderRadius: 12,
  },
});

// Types
interface Episode {
  number: number;
  title: string;
  duration: string;
  watched: boolean;
  progress?: number; // For partially watched episodes
  currentTime?: string;
  totalTime?: string;
}

interface Series {
  id: string;
  title: string;
  categories: string[];
  rating: number;
  episodeCount: number;
  totalDuration: string;
  progressPercentage: number;
  watchedEpisodes: number;
  totalEpisodes: number;
  purchaseDate: string;
  price: string;
  thumbnailGradient: string;
  ownedBadgeText: string;
  ownedBadgeColor: string;
  episodes: Episode[];
  status: 'in-progress' | 'completed' | 'not-started';
}

// Mock Data
const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortOpen, setSortOpen] = useState(false);
  const [value, setValue] = React.useState('my-list');
  const [purchases, setPurchases] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await videoApi.getPurchases();

      if (!response || !response.data) {
        setPurchases([]);
        return;
      }

      const mappedData: Series[] = response.data.map(p => {
        const video = (p.video || {}) as any;
        const totalEpisodes = video.episode_count || 0;
        const watchedEpisodes = video.watched_episodes_count || 0;
        const progressPercentage = video.progress_percentage || 0;

        let status: 'in-progress' | 'completed' | 'not-started' = 'not-started';
        if (progressPercentage === 100) status = 'completed';
        else if (progressPercentage > 0) status = 'in-progress';

        return {
          id: String(video.videoId || video.id || 'N/A'),
          title: video.title || 'Untitled Series',
          categories: video.categories || [],
          rating: 4.5,
          episodeCount: totalEpisodes,
          totalDuration: `~${Math.round(totalEpisodes * 10 / 60)}h total`,
          progressPercentage: progressPercentage,
          watchedEpisodes: watchedEpisodes,
          totalEpisodes: totalEpisodes,
          purchaseDate: p.purchaseDate ? format(new Date(p.purchaseDate), 'MMM d, yyyy') : 'Unknown Date',
          price: video.price ? `$${video.price}` : '$0.00',
          thumbnailGradient: (video.thumbnail_url && video.thumbnail_url.trim() !== '')
            ? `url("${video.thumbnail_url}")`
            : 'linear-gradient(135deg,#1a1040,#2d1b69)',
          ownedBadgeText: status === 'completed' ? 'DONE' : 'OWNED',
          ownedBadgeColor: status === 'completed' ? '#0F6E56' : '#534AB7',
          status: status,
          episodes: (video.episodes || []).map((ep: any) => ({
            number: ep.episodeNumber || 0,
            title: ep.title || `Episode ${ep.episodeNumber}`,
            duration: ep.duration ? `${Math.floor(ep.duration / 60)}:${String(ep.duration % 60).padStart(2, '0')}` : '0:00',
            watched: ep.watch_history?.completed || false,
            progress: ep.watch_history && ep.duration ? Math.round((ep.watch_history.watchDuration / ep.duration) * 100) : 0,
            currentTime: ep.watch_history ? `${Math.floor(ep.watch_history.watchDuration / 60)}:${String(ep.watch_history.watchDuration % 60).padStart(2, '0')}` : '0:00',
            totalTime: ep.duration ? `${Math.floor(ep.duration / 60)}:${String(ep.duration % 60).padStart(2, '0')}` : '0:00'
          }))
        };
      });

      setPurchases(mappedData);
      console.log('Mapped library data:', mappedData);
    } catch (err) {
      console.error('Failed to fetch library:', err);
      setError('Could not load your library. Please try again later.');
      toast.error('Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    } else {
      setLoading(false);
      setError('Please login to view your library.');
    }
  }, [isAuthenticated]);

  // Compute summary statistics
  const totalSeries = purchases.length;
  const totalEpisodes = purchases.reduce((sum, series) => sum + series.totalEpisodes, 0);
  const inProgressCount = purchases.filter(s => s.status === 'in-progress').length;
  const completedCount = purchases.filter(s => s.status === 'completed').length;
  const notStartedCount = purchases.filter(s => s.status === 'not-started').length;

  // Filter series based on selected tab
  const filteredSeries = purchases.filter(series => {
    if (selectedFilter === 'all') return true;
    return series.status === selectedFilter;
  });

  // Filter tabs configuration
  const filterTabs = [
    { id: 'all', label: 'All', count: totalSeries },
    { id: 'in-progress', label: 'In progress', count: inProgressCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'not-started', label: 'Not started', count: notStartedCount },
  ];

  const handleResumeEpisode = (seriesId: string, episodeNumber: number) => {
    navigate(`/play/${seriesId}/${episodeNumber}`);
  };

  const handleWatchAgain = (seriesId: string) => {
    navigate(`/play/${seriesId}/1`);
  };

  const handleDetails = (seriesId: string) => {
    navigate(`/library/${seriesId}`);
  };

  const handleDownload = (seriesId: string) => {
    alert(`Downloading series ${seriesId}`);
  };

  const EpisodeMiniRow = ({ episode, seriesStatus, isCurrent = false }: { episode: Episode; seriesStatus: string; isCurrent?: boolean }) => {
    const isWatched = episode.watched;
    const isPartiallyWatched = episode.progress && episode.progress > 0 && episode.progress < 100;

    let statusClass = '';
    let statusIcon = null;

    if (isWatched) {
      statusClass = 'bg-[#0F6E56] text-[#E1F5EE]';
      statusIcon = <CheckCircle sx={{ fontSize: 13, color: '#0F6E56' }} />;
    } else if (isPartiallyWatched || isCurrent) {
      statusClass = 'bg-[#534AB7] text-[#CECBF6]';
    } else {
      statusClass = 'bg-[#2a2a2e] text-[#666]';
    }

    return (
      <Box className={`flex items-center gap-3 py-2.5 ${!isWatched && !isPartiallyWatched && !isCurrent ? 'border-b border-[#222]' : ''}`}
        sx={isCurrent ? { bgcolor: '#1e1a2e', borderRadius: '8px', mx: -0.5, px: 1 } : {}}>
        <Box className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${statusClass}`}>
          {episode.number}
        </Box>
        <Box className="flex-1 min-w-0">
          <Typography variant="body2" className={`block truncate ${isCurrent ? 'text-[#AFA9EC]' : isWatched ? 'text-gray-300' : 'text-gray-400'}`} sx={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400 }}>
            {episode.title}
          </Typography>
          <Typography variant="caption" className={`block ${isPartiallyWatched ? 'text-[#534AB7]' : 'text-[#555]'}`} sx={{ fontSize: 11 }}>
            {isWatched ? `Watched · ${episode.duration}` :
              isPartiallyWatched ? `${episode.currentTime} / ${episode.totalTime} · ${episode.progress}% done` :
                `${episode.duration} min`}
          </Typography>
        </Box>
        <Box className="flex-shrink-0">
          {isWatched ? statusIcon :
            isPartiallyWatched ? (
              <Box className="w-16 h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                <Box className="h-full bg-[#534AB7] rounded-full" style={{ width: `${episode.progress}%` }} />
              </Box>
            ) : (
              <PlayArrow sx={{ fontSize: 16, color: '#555' }} />
            )}
        </Box>
      </Box>
    );
  };

  const SeriesCard = ({ series }: { series: Series }) => {
    const isCompleted = series.status === 'completed';
    const isInProgress = series.status === 'in-progress';
    const displayEpisodes = series.episodes.slice(0, 4);
    const remainingEpisodes = series.episodes.length - 4;
    const currentEpisode = isInProgress ? series.episodes.find(ep => ep.progress && ep.progress > 0 && ep.progress < 100) || series.episodes[2] : null;

    return (
      <Paper elevation={0} className="bg-[#1a1a1c] rounded-2xl overflow-hidden border border-[#2a2a2e] mb-5 cursor-pointer transition-all hover:border-[#534AB7] hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)]">
        <Box className="flex flex-row min-h-[160px] sm:min-h-[280px]">
          {/* Left Side: Poster Image - Fixed Width on Mobile, Larger on Desktop */}
          <Box className="w-[100px] sm:w-[200px] lg:w-[240px] shrink-0 relative bg-[#111] overflow-hidden">
            <Box
              className="w-full h-full"
              sx={{
                backgroundImage: series.thumbnailGradient,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Box className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </Box>
            
            <Chip
              label={series.ownedBadgeText}
              size="small"
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 16 },
                left: { xs: 8, sm: 16 },
                bgcolor: series.ownedBadgeColor,
                color: '#fff',
                fontSize: { xs: 8, sm: 11 },
                fontWeight: 800,
                height: { xs: 18, sm: 24 },
                px: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                '& .MuiChip-label': { px: { xs: 0.8, sm: 1.5 } }
              }}
            />
          </Box>

          {/* Right Side: Details & Content */}
          <Box className="flex-1 flex flex-col p-3 sm:p-6 lg:p-7 min-w-0">
            {/* Header: Title & Stats Pill Area */}
            <Box className="flex flex-col mb-4">
               <Typography variant="h6" className="font-bold text-[#f0ede8] mb-1 truncate" sx={{ fontSize: { xs: 16, sm: 24 } }}>
                  {series.title}
               </Typography>
               <Box className="flex gap-1.5 flex-wrap mb-3">
                  {series.categories.slice(0, 3).map(cat => (
                    <Chip
                      key={cat}
                      label={cat}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(83,74,183,0.1)',
                        color: '#AFA9EC',
                        fontSize: { xs: 9, sm: 12 },
                        height: { xs: 18, sm: 24 },
                        border: '1px solid rgba(83,74,183,0.2)',
                        '& .MuiChip-label': { px: { xs: 1, sm: 1.5 } }
                      }}
                    />
                  ))}
               </Box>

               {/* Stats Row - Compact on Mobile */}
               <Box className="flex gap-3 sm:gap-5 items-center bg-[#141415] w-fit px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-[#222]">
                  <Box className="flex items-center gap-1">
                    <Star sx={{ fontSize: { xs: 12, sm: 16 }, color: '#FAC775' }} />
                    <Typography variant="body2" sx={{ fontSize: { xs: 11, sm: 14 }, color: '#ccc', fontWeight: 500 }}>{series.rating}</Typography>
                  </Box>
                  <Box className="w-px h-2.5 bg-[#333]" />
                  <Box className="flex items-center gap-1">
                    <Theaters sx={{ fontSize: { xs: 12, sm: 16 }, color: '#888' }} />
                    <Typography variant="body2" sx={{ fontSize: { xs: 11, sm: 14 }, color: '#ccc', fontWeight: 500 }}>{series.episodeCount} eps</Typography>
                  </Box>
               </Box>
            </Box>

            {/* Progress Section */}
            <Box className="mb-4 sm:mb-6">
               <Box className="flex justify-between items-center mb-1.5">
                  <Typography variant="body2" sx={{ fontSize: { xs: 9, sm: 12 }, color: '#666', fontWeight: 700, letterSpacing: '0.5px' }}>PROGRESS</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: 10, sm: 13 }, color: isCompleted ? '#4ADE80' : '#534AB7', fontWeight: 700 }}>
                    {series.watchedEpisodes}/{series.totalEpisodes} DONE
                  </Typography>
               </Box>
               <LinearProgress
                variant="determinate"
                value={series.progressPercentage}
                sx={{
                  height: { xs: 4, sm: 8 },
                  borderRadius: 4,
                  bgcolor: '#222',
                  '& .MuiLinearProgress-bar': { bgcolor: isCompleted ? '#0F6E56' : '#534AB7', borderRadius: 4 }
                }}
              />
            </Box>

            {/* Episodes & Main Actions */}
            <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-auto">
                {/* Episode Preview - Hidden on tiny screens, show simplified on medium */}
                <Box className="hidden sm:block">
                  <Typography variant="overline" className="font-bold text-[#444] tracking-widest mb-1.5 block" sx={{ fontSize: 9 }}>
                    {isCompleted ? 'HISTORY' : 'CONTINUE'}
                  </Typography>
                  {displayEpisodes.slice(0, 2).map((ep) => (
                    <EpisodeMiniRow
                      key={ep.number}
                      episode={ep}
                      seriesStatus={series.status}
                      isCurrent={currentEpisode?.number === ep.number}
                    />
                  ))}
                </Box>

                {/* Primary Actions */}
                <Box className="flex flex-col justify-end gap-2 sm:gap-3">
                  <Box className="flex gap-2">
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PlayArrow sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                      onClick={() => isCompleted ? handleWatchAgain(series.id) : handleResumeEpisode(series.id, currentEpisode?.number || 1)}
                      sx={{
                        bgcolor: isCompleted ? '#0F6E56' : '#534AB7',
                        fontSize: { xs: 12, sm: 15 },
                        fontWeight: 700,
                        py: { xs: 1, sm: 1.5 },
                        borderRadius: { xs: '10px', sm: '14px' },
                        textTransform: 'none',
                        '&:hover': { bgcolor: isCompleted ? '#138166' : '#433a9e' }
                      }}
                    >
                      {isCompleted ? 'Watch again' : `Resume E${currentEpisode?.number || 1}`}
                    </Button>
                    <IconButton
                      onClick={() => handleDownload(series.id)}
                      sx={{
                        bgcolor: '#2a2a2e',
                        borderRadius: { xs: '10px', sm: '14px' },
                        p: { xs: 1, sm: 2 },
                        '&:hover': { bgcolor: '#3a3a3e' }
                      }}
                    >
                      <Download sx={{ fontSize: { xs: 18, sm: 22 }, color: '#aaa' }} />
                    </IconButton>
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleDetails(series.id)}
                    sx={{
                      borderColor: '#333',
                      color: '#666',
                      fontSize: { xs: 11, sm: 13 },
                      fontWeight: 600,
                      py: 0.8,
                      borderRadius: { xs: '8px', sm: '12px' },
                      textTransform: 'none',
                      '&:hover': { borderColor: '#534AB7', color: '#f0ede8', bgcolor: 'rgba(83,74,183,0.05)' }
                    }}
                  >
                    Series Details
                  </Button>
                </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer Payment Strip */}
        <Box className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-[#111] border-t border-[#222]">
          <Typography variant="caption" sx={{ fontSize: { xs: 9, sm: 12 }, color: '#444', fontWeight: 500 }}>
             {series.purchaseDate} · Pay
          </Typography>
          <Box className="flex items-center gap-1.5">
            <CheckCircle sx={{ fontSize: { xs: 10, sm: 14 }, color: '#2D6B4F' }} />
            <Typography sx={{ color: '#2D6B4F', fontSize: { xs: 8, sm: 10 }, fontWeight: 700, letterSpacing: '0.5px' }}>VERIFIED</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="min-h-screen bg-[#0f0f10]">
        {/* Main Content Container - normal page width */}
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
          {/* Page Header */}
          <Box className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <Box>
              <Typography variant="h5" sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 700, color: '#f0ede8' }}>
                My Library
              </Typography>
              <Typography variant="body2" sx={{ fontSize: 14, color: '#666' }}>
                {totalSeries} series purchased
              </Typography>
            </Box>
            <Button
              startIcon={<Sort sx={{ fontSize: 16, color: '#aaa' }} />}
              onClick={() => setSortOpen(!sortOpen)}
              sx={{
                bgcolor: '#1a1a1c',
                border: '1px solid #2a2a2e',
                borderRadius: 2,
                py: 1,
                px: 2,
                fontSize: 14,
                color: '#aaa',
                minWidth: 'auto',
                '&:hover': { bgcolor: '#2a2a2e' }
              }}
            >
              Sort
            </Button>
          </Box>

          {/* Summary Bar */}
          <Box className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
            {[
              { label: 'Purchased', value: totalSeries },
              { label: 'Episodes', value: totalEpisodes },
              { label: 'In progress', value: inProgressCount },
              { label: 'Completed', value: completedCount },
            ].map((item) => (
              <Box
                key={item.label}
                className="bg-[#1a1a1c] rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center border border-[#2a2a2e] min-w-0"
              >
                <Typography
                  sx={{
                    fontSize: { xs: 16, sm: 28 }, // smaller on phone
                    fontWeight: 700,
                    color: '#f0ede8',
                  }}
                >
                  {item.value}
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 13 }, // shrink label on mobile
                    color: '#888',
                    mt: 0.5,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                  className="truncate"
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Filter Tabs */}
          <Box className="flex gap-3 mb-6 overflow-x-auto pb-1 no-scrollbar">
            {filterTabs.map(tab => (
              <Chip
                key={tab.id}
                label={`${tab.label} (${tab.count})`}
                onClick={() => setSelectedFilter(tab.id)}
                sx={{
                  bgcolor: selectedFilter === tab.id ? '#534AB7' : 'transparent',
                  color: selectedFilter === tab.id ? '#fff' : '#888',
                  border: '1px solid #2a2a2e',
                  borderRadius: '12px',
                  fontSize: 13,
                  height: 36,
                  px: 1,
                  '& .MuiChip-label': { px: 1, fontSize: 13, fontWeight: selectedFilter === tab.id ? 600 : 400 },
                  '&:hover': { bgcolor: selectedFilter === tab.id ? '#534AB7' : 'rgba(83,74,183,0.1)' }
                }}
              />
            ))}
          </Box>

          {/* Series List */}
          <Box className="pb-20">
            {loading ? (
              <Box className="py-20 text-center">
                <CircularProgress size={40} sx={{ color: '#534AB7', mb: 2 }} />
                <Typography sx={{ color: '#666' }}>Fetching your collection...</Typography>
              </Box>
            ) : error ? (
              <Box className="py-12 px-5 text-center bg-[#1a1a1c] rounded-2xl border border-red-900/30">
                <Typography variant="subtitle1" sx={{ color: '#f0ede8', mb: 1 }}>Error</Typography>
                <Typography sx={{ color: '#666', mb: 3 }}>{error}</Typography>
                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchPurchases}>Try Again</Button>
              </Box>
            ) : filteredSeries.length === 0 ? (
              <Box className="py-12 px-5 text-center">
                <Box className="w-16 h-16 rounded-full bg-[#1a1a1c] flex items-center justify-center mx-auto mb-4">
                  <Theaters sx={{ fontSize: 32, color: '#555' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontSize: 16, fontWeight: 500, color: '#f0ede8', mb: 1 }}>
                  No series found
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 13, color: '#555', mb: 3, lineHeight: 1.5 }}>
                  Try changing your filter or browse our catalog
                </Typography>
                <Button variant="contained" onClick={() => navigate('/videos')} sx={{ bgcolor: '#534AB7', fontSize: 12, borderRadius: 2, px: 4 }}>
                  Browse Series
                </Button>
              </Box>
            ) : (
              filteredSeries.map(series => <SeriesCard key={series.id} series={series} />)
            )}
          </Box>
        </Container>

        {/* Bottom Navigation */}
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: '#111',
            borderTop: '0.5px solid #222',
            borderRadius: 0,
            zIndex: 10
          }}
        >
          <Container maxWidth="lg" disableGutters>
            <BottomNavigation
              value={value}
              onChange={(event, newValue) => setValue(newValue)}
              showLabels
              sx={{ bgcolor: '#111', height: 'auto', py: 0.5 }}
            >
              <BottomNavigationAction
                value="home"
                icon={<Home sx={{ fontSize: 22 }} />}
                label="Home"
                sx={{
                  color: '#555',
                  '&.Mui-selected': { color: '#534AB7' },
                  fontSize: 10,
                  py: 0.5
                }}
              />
              <BottomNavigationAction
                value="explore"
                icon={<Search sx={{ fontSize: 22 }} />}
                label="Explore"
                sx={{
                  color: '#555',
                  '&.Mui-selected': { color: '#534AB7' },
                  fontSize: 10,
                  py: 0.5
                }}
              />
              <BottomNavigationAction
                value="my-list"
                icon={<LibraryBooks sx={{ fontSize: 22 }} />}
                label="My List"
                sx={{
                  color: '#555',
                  '&.Mui-selected': { color: '#534AB7' },
                  fontSize: 10,
                  py: 0.5
                }}
              />
              <BottomNavigationAction
                value="profile"
                icon={<Person sx={{ fontSize: 22 }} />}
                label="Profile"
                sx={{
                  color: '#555',
                  '&.Mui-selected': { color: '#534AB7' },
                  fontSize: 10,
                  py: 0.5
                }}
              />
            </BottomNavigation>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default LibraryPage;