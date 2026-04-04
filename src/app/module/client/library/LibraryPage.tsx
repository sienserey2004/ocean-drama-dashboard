import React, { useState } from "react";
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
  CircularProgress,
} from "@mui/material";

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
  Refresh,
} from "@mui/icons-material";
import { videoApi } from "@/app/api/video.service";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/app/stores/authStore";

// Custom theme for dark mode
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#E50914",
      dark: "#B20710",
      light: "#FF4D4F",
    },
    secondary: {
      main: "#0F6E56",
    },
    background: {
      default: "#08090C",
      paper: "#111217",
    },
    text: {
      primary: "#F9FAFB",
      secondary: "#9CA3AF",
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
    fontSize: 14,
  },
  shape: {
    borderRadius: 16,
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
  status: "in-progress" | "completed" | "not-started";
}

// Mock Data
const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [value, setValue] = React.useState("my-list");
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

      const mappedData: Series[] = response.data.map((p) => {
        const video = (p.video || {}) as any;
        const totalEpisodes = video.episode_count || 0;
        const watchedEpisodes = video.watched_episodes_count || 0;
        const progressPercentage = video.progress_percentage || 0;

        let status: "in-progress" | "completed" | "not-started" = "not-started";
        if (progressPercentage === 100) status = "completed";
        else if (progressPercentage > 0) status = "in-progress";

        return {
          id: String(video.videoId || video.id || "N/A"),
          title: video.title || "Untitled Series",
          categories: video.categories || [],
          rating: 4.5,
          episodeCount: totalEpisodes,
          totalDuration: `~${Math.round((totalEpisodes * 10) / 60)}h total`,
          progressPercentage: progressPercentage,
          watchedEpisodes: watchedEpisodes,
          totalEpisodes: totalEpisodes,
          purchaseDate: p.purchaseDate
            ? format(new Date(p.purchaseDate), "MMM d, yyyy")
            : "Unknown Date",
          price: video.price ? `$${video.price}` : "$0.00",
          thumbnailGradient:
            video.thumbnail_url && video.thumbnail_url.trim() !== ""
              ? `url("${video.thumbnail_url}")`
              : "linear-gradient(135deg,#1a1040,#2d1b69)",
          ownedBadgeText: status === "completed" ? "DONE" : "OWNED",
          ownedBadgeColor: status === "completed" ? "#0F6E56" : "#E50914",
          status: status,
          episodes: (video.episodes || []).map((ep: any) => ({
            number: ep.episodeNumber || 0,
            title: ep.title || `Episode ${ep.episodeNumber}`,
            duration: ep.duration
              ? `${Math.floor(ep.duration / 60)}:${String(ep.duration % 60).padStart(2, "0")}`
              : "0:00",
            watched: ep.watch_history?.completed || false,
            progress:
              ep.watch_history && ep.duration
                ? Math.round(
                    (ep.watch_history.watchDuration / ep.duration) * 100,
                  )
                : 0,
            currentTime: ep.watch_history
              ? `${Math.floor(ep.watch_history.watchDuration / 60)}:${String(ep.watch_history.watchDuration % 60).padStart(2, "0")}`
              : "0:00",
            totalTime: ep.duration
              ? `${Math.floor(ep.duration / 60)}:${String(ep.duration % 60).padStart(2, "0")}`
              : "0:00",
          })),
        };
      });

      setPurchases(mappedData);
      console.log("Mapped library data:", mappedData);
    } catch (err) {
      console.error("Failed to fetch library:", err);
      setError("Could not load your library. Please try again later.");
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    } else {
      setLoading(false);
      setError("Please login to view your library.");
    }
  }, [isAuthenticated]);

  // Compute summary statistics
  const totalSeries = purchases.length;
  const totalEpisodes = purchases.reduce(
    (sum, series) => sum + series.totalEpisodes,
    0,
  );
  const inProgressCount = purchases.filter(
    (s) => s.status === "in-progress",
  ).length;
  const completedCount = purchases.filter(
    (s) => s.status === "completed",
  ).length;
  const notStartedCount = purchases.filter(
    (s) => s.status === "not-started",
  ).length;

  // Filter series based on selected tab
  const filteredSeries = purchases.filter((series) => {
    if (selectedFilter === "all") return true;
    return series.status === selectedFilter;
  });

  // Filter tabs configuration
  const filterTabs = [
    { id: "all", label: "All", count: totalSeries },
    { id: "in-progress", label: "In progress", count: inProgressCount },
    { id: "completed", label: "Completed", count: completedCount },
    { id: "not-started", label: "Not started", count: notStartedCount },
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

  const EpisodeMiniRow = ({
    episode,
    seriesStatus,
    isCurrent = false,
  }: {
    episode: Episode;
    seriesStatus: string;
    isCurrent?: boolean;
  }) => {
    const isWatched = episode.watched;
    const isPartiallyWatched =
      episode.progress && episode.progress > 0 && episode.progress < 100;

    let statusClass = "";
    let statusIcon = null;

    if (isWatched) {
      statusClass = "bg-[#0F6E56] text-[#E1F5EE]";
      statusIcon = <CheckCircle sx={{ fontSize: 13, color: "#0F6E56" }} />;
    } else if (isPartiallyWatched || isCurrent) {
      statusClass = "bg-[#E50914] text-white";
    } else {
      statusClass = "bg-[#262A33] text-[#9CA3AF]";
    }

    return (
      <Box
        className={`flex items-center gap-3 py-2.5 ${!isWatched && !isPartiallyWatched && !isCurrent ? "border-b border-[#262A33]" : ""}`}
        sx={
          isCurrent
            ? {
                bgcolor: "rgba(229,9,20,0.1)",
                borderRadius: "8px",
                mx: -0.5,
                px: 1,
                border: "1px solid rgba(229,9,20,0.2)",
              }
            : {}
        }
      >
        <Box
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${statusClass}`}
        >
          {episode.number}
        </Box>
        <Box className="flex-1 min-w-0">
          <Typography
            variant="body2"
            className={`block truncate ${isCurrent ? "text-[#F9FAFB]" : isWatched ? "text-gray-300" : "text-[#9CA3AF]"}`}
            sx={{ fontSize: 13, fontWeight: isCurrent ? 700 : 400 }}
          >
            {episode.title}
          </Typography>
          <Typography
            variant="caption"
            className={`block ${isPartiallyWatched ? "text-[#E50914]" : "text-[#9CA3AF]"}`}
            sx={{ fontSize: 11, opacity: 0.7 }}
          >
            {isWatched
              ? `Watched · ${episode.duration}`
              : isPartiallyWatched
                ? `${episode.currentTime} / ${episode.totalTime} · ${episode.progress}% done`
                : `${episode.duration} min`}
          </Typography>
        </Box>
        <Box className="flex-shrink-0">
          {isWatched ? (
            statusIcon
          ) : isPartiallyWatched ? (
            <Box className="w-16 h-1.5 bg-[#262A33] rounded-full overflow-hidden">
              <Box
                className="h-full bg-[#E50914] rounded-full shadow-glow"
                style={{ width: `${episode.progress}%` }}
              />
            </Box>
          ) : (
            <PlayArrow sx={{ fontSize: 16, color: "#9CA3AF" }} />
          )}
        </Box>
      </Box>
    );
  };

  const SeriesCard = ({ series }: { series: Series }) => {
    const isCompleted = series.status === "completed";
    const isInProgress = series.status === "in-progress";
    const displayEpisodes = series.episodes.slice(0, 4);
    const remainingEpisodes = series.episodes.length - 4;
    const currentEpisode = isInProgress
      ? series.episodes.find(
          (ep) => ep.progress && ep.progress > 0 && ep.progress < 100,
        ) || series.episodes[2]
      : null;

    return (
      <Paper
        elevation={0}
        className="bg-[#181A20] rounded-2xl overflow-hidden border border-[#262A33] mb-6 cursor-pointer transition-all duration-300 hover:border-[#E50914]/50 hover:shadow-glow hover:scale-[1.02]"
      >
        <Box className="flex flex-row min-h-[160px] sm:min-h-[280px]">
          {/* Left Side: Poster Image - Fixed Width on Mobile, Larger on Desktop */}
          <Box className="w-[100px] sm:w-[200px] lg:w-[240px] shrink-0 relative bg-[#08090C] overflow-hidden">
            <Box
              className="w-full h-full transition-transform duration-700 hover:scale-110"
              sx={{
                backgroundImage: series.thumbnailGradient,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <Box className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-transparent opacity-60" />
            </Box>

            <Chip
              label={series.ownedBadgeText}
              size="small"
              sx={{
                position: "absolute",
                top: { xs: 8, sm: 16 },
                left: { xs: 8, sm: 16 },
                bgcolor: series.ownedBadgeColor,
                color: "#fff",
                fontSize: { xs: 8, sm: 11 },
                fontWeight: 900,
                height: { xs: 18, sm: 24 },
                px: 0,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                "& .MuiChip-label": { px: { xs: 0.8, sm: 1.5 } },
              }}
            />
          </Box>

          {/* Right Side: Details & Content */}
          <Box className="flex-1 flex flex-col p-4 sm:p-8 lg:p-10 min-w-0">
            {/* Header: Title & Stats Pill Area */}
            <Box className="flex flex-col mb-5">
              <Typography
                variant="h6"
                className="font-black text-[#F9FAFB] mb-2 truncate uppercase italic tracking-tighter"
                sx={{ fontSize: { xs: 18, sm: 32 } }}
              >
                {series.title}
              </Typography>
              <Box className="flex gap-2 flex-wrap mb-4">
                {series.categories.slice(0, 3).map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    sx={{
                      bgcolor: "rgba(229,9,20,0.1)",
                      color: "#FF4D4F",
                      fontSize: { xs: 9, sm: 12 },
                      fontWeight: 700,
                      height: { xs: 20, sm: 28 },
                      border: "1px solid rgba(229,9,20,0.2)",
                      "& .MuiChip-label": { px: { xs: 1, sm: 2 } },
                    }}
                  />
                ))}
              </Box>

              {/* Stats Row - Compact on Mobile */}
              <Box className="flex gap-4 sm:gap-6 items-center bg-[#111217] w-fit px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-[#262A33]">
                <Box className="flex items-center gap-1.5">
                  <Star
                    sx={{ fontSize: { xs: 14, sm: 18 }, color: "#FAC775" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: 12, sm: 15 },
                      color: "#F9FAFB",
                      fontWeight: 700,
                    }}
                  >
                    {series.rating}
                  </Typography>
                </Box>
                <Box className="w-px h-3 bg-[#262A33]" />
                <Box className="flex items-center gap-1.5">
                  <Theaters
                    sx={{ fontSize: { xs: 14, sm: 18 }, color: "#9CA3AF" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: 12, sm: 15 },
                      color: "#F9FAFB",
                      fontWeight: 700,
                    }}
                  >
                    {series.episodeCount} eps
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Progress Section */}
            <Box className="mb-6 sm:mb-8">
              <Box className="flex justify-between items-center mb-2">
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: 10, sm: 13 },
                    color: "#9CA3AF",
                    fontWeight: 800,
                    letterSpacing: "1px",
                  }}
                >
                  PROGRESS
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: 11, sm: 14 },
                    color: isCompleted ? "#4ADE80" : "#E50914",
                    fontWeight: 900,
                  }}
                >
                  {series.watchedEpisodes}/{series.totalEpisodes} DONE
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={series.progressPercentage}
                sx={{
                  height: { xs: 5, sm: 10 },
                  borderRadius: 5,
                  bgcolor: "#262A33",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: isCompleted ? "#0F6E56" : "#E50914",
                    borderRadius: 5,
                    boxShadow: isCompleted ? "none" : "0 0 10px #E50914",
                  },
                }}
              />
            </Box>

            {/* Episodes & Main Actions */}
            <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-auto">
              {/* Episode Preview - Hidden on tiny screens, show simplified on medium */}
              <Box className="hidden sm:block">
                <Typography
                  variant="overline"
                  className="font-black text-[#9CA3AF] tracking-[0.2em] mb-2 block opacity-50"
                  sx={{ fontSize: 10 }}
                >
                  {isCompleted ? "HISTORY" : "CONTINUE"}
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
              <Box className="flex flex-col justify-end gap-3 sm:gap-4">
                <Box className="flex gap-3">
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={
                      <PlayArrow sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    }
                    onClick={() =>
                      isCompleted
                        ? handleWatchAgain(series.id)
                        : handleResumeEpisode(
                            series.id,
                            currentEpisode?.number || 1,
                          )
                    }
                    sx={{
                      bgcolor: isCompleted ? "#0F6E56" : "#E50914",
                      fontSize: { xs: 12, sm: 16 },
                      fontWeight: 900,
                      py: { xs: 1.2, sm: 1.8 },
                      borderRadius: 9999, // Pill shape
                      textTransform: "none",
                      boxShadow: isCompleted
                        ? "none"
                        : "0 0 20px rgba(229,9,20,0.4)",
                      "&:hover": {
                        bgcolor: isCompleted ? "#138166" : "#B20710",
                        transform: "translateY(-2px)",
                        boxShadow: isCompleted
                          ? "none"
                          : "0 0 30px rgba(229,9,20,0.6)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isCompleted
                      ? "Watch again"
                      : `Resume E${currentEpisode?.number || 1}`}
                  </Button>
                  <IconButton
                    onClick={() => handleDownload(series.id)}
                    sx={{
                      bgcolor: "#262A33",
                      borderRadius: 9999,
                      p: { xs: 1.2, sm: 2 },
                      border: "1px solid rgba(255,255,255,0.05)",
                      "&:hover": {
                        bgcolor: "#323741",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Download
                      sx={{ fontSize: { xs: 20, sm: 24 }, color: "#F9FAFB" }}
                    />
                  </IconButton>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleDetails(series.id)}
                  sx={{
                    borderColor: "#262A33",
                    color: "#9CA3AF",
                    fontSize: { xs: 11, sm: 14 },
                    fontWeight: 700,
                    py: 1,
                    borderRadius: 9999, // Pill shape
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#E50914",
                      color: "#F9FAFB",
                      bgcolor: "rgba(229,9,20,0.05)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Series details
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer Payment Strip */}
        <Box className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 bg-[#08090C] border-t border-[#262A33]">
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: 10, sm: 13 },
              color: "#9CA3AF",
              fontWeight: 600,
              opacity: 0.6,
            }}
          >
            Purchased on {series.purchaseDate}
          </Typography>
          <Box className="flex items-center gap-2">
            <CheckCircle
              sx={{ fontSize: { xs: 12, sm: 16 }, color: "#0F6E56" }}
            />
            <Typography
              sx={{
                color: "#0F6E56",
                fontSize: { xs: 9, sm: 11 },
                fontWeight: 800,
                letterSpacing: "1px",
              }}
            >
              VERIFIED ACCESS
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="min-h-screen pb-24 sm:pb-12"
        sx={{
          bgcolor: "#08090C",
          backgroundImage:
            "radial-gradient(circle at top, rgba(229,9,20,0.15), transparent 70%)",
          backgroundAttachment: "fixed",
        }}
      >
        <Box className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <Box className="flex items-center justify-between pt-8 sm:pt-12 pb-6 sm:pb-8">
            <Box>
              <Typography
                variant="h4"
                className="font-black text-white tracking-tighter uppercase italic"
                sx={{ fontSize: { xs: 28, sm: 48 } }}
              >
                My Library
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#9CA3AF", fontWeight: 600, letterSpacing: "1px" }}
              >
                {totalSeries} SERIES PURCHASED
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Star />}
              sx={{
                bgcolor: "#E50914",
                color: "white",
                fontWeight: 900,
                borderRadius: 9999, // Pill shape
                px: { xs: 2, sm: 4 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: 11, sm: 14 },
                textTransform: "none",
                boxShadow: "0 0 20px rgba(229,9,20,0.4)",
                "&:hover": {
                  bgcolor: "#B20710",
                  transform: "scale(1.05)",
                  boxShadow: "0 0 30px rgba(229,9,20,0.6)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Premium
            </Button>
          </Box>

          {/* Summary Bar - Stats Area */}
          <Box className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
            {[
              {
                label: "Purchased",
                value: totalSeries,
                icon: <Theaters sx={{ color: "#E50914" }} />,
              },
              {
                label: "Episodes",
                value: totalEpisodes,
                icon: <PlayArrow sx={{ color: "#E50914" }} />,
              },
              {
                label: "Completed",
                value: completedCount,
                icon: <CheckCircle sx={{ color: "#0F6E56" }} />,
              },
              {
                label: "Watching",
                value: inProgressCount,
                icon: <AccessTime sx={{ color: "#E50914" }} />,
              },
            ].map((stat, i) => (
              <Paper
                key={i}
                elevation={0}
                className="p-4 sm:p-6 rounded-2xl bg-[#111217] border border-[#262A33] flex items-center gap-3 sm:gap-4 hover:border-[#E50914]/30 transition-all duration-300"
              >
                <Box className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-[#181A20] flex items-center justify-center border border-[#262A33]">
                  {stat.icon}
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    className="font-black text-white"
                    sx={{ fontSize: { xs: 18, sm: 24 } }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="font-bold text-[#9CA3AF] tracking-wider uppercase opacity-60"
                    sx={{ fontSize: { xs: 9, sm: 11 } }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Filters & Content Area */}
          <Box className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <Box className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {filterTabs.map((tab) => {
                const isActive = selectedFilter === tab.id;
                return (
                  <Chip
                    key={tab.id}
                    label={`${tab.label} (${tab.count})`}
                    onClick={() => setSelectedFilter(tab.id)}
                    sx={{
                      bgcolor: isActive ? "#E50914" : "#111217",
                      color: isActive ? "white" : "#9CA3AF",
                      fontWeight: 700,
                      borderRadius: 9999,
                      border: isActive ? "none" : "1px solid #262A33",
                      px: { xs: 1, sm: 2 },
                      height: { xs: 32, sm: 40 },
                      fontSize: { xs: 12, sm: 14 },
                      boxShadow: isActive
                        ? "0 0 15px rgba(229,9,20,0.4)"
                        : "none",
                      "&:hover": {
                        bgcolor: isActive ? "#B20710" : "#181A20",
                        color: "white",
                      },
                      transition: "all 0.3s ease",
                    }}
                  />
                );
              })}
            </Box>

            <Box className="flex items-center gap-2 bg-[#111217] px-4 py-2 rounded-full border border-[#262A33]">
              <Search sx={{ color: "#9CA3AF", fontSize: 20 }} />
              <input
                type="text"
                placeholder="Search library..."
                className="bg-transparent border-none outline-none text-white text-sm w-32 sm:w-48 placeholder:text-[#9CA3AF]"
              />
            </Box>
          </Box>

          {/* Series List */}
          <Box className="pb-20">
            {loading ? (
              <Box className="py-20 text-center">
                <CircularProgress size={40} sx={{ color: "#E50914", mb: 2 }} />
                <Typography sx={{ color: "#9CA3AF" }}>
                  Fetching your collection...
                </Typography>
              </Box>
            ) : error ? (
              <Box className="py-12 px-5 text-center bg-[#111217] rounded-3xl border border-red-900/30">
                <Typography
                  variant="subtitle1"
                  sx={{ color: "#F9FAFB", mb: 1 }}
                >
                  Error
                </Typography>
                <Typography sx={{ color: "#9CA3AF", mb: 3 }}>
                  {error}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchPurchases}
                  sx={{ borderColor: "#E50914", color: "#E50914" }}
                >
                  Try Again
                </Button>
              </Box>
            ) : filteredSeries.length === 0 ? (
              <Box className="text-center py-20 bg-[#111217] rounded-3xl border border-dashed border-[#262A33]">
                <Theaters sx={{ fontSize: 60, color: "#262A33", mb: 2 }} />
                <Typography variant="h6" className="text-white font-bold mb-1">
                  No series found
                </Typography>
                <Typography variant="body2" className="text-[#9CA3AF]">
                  Try adjusting your filters or search
                </Typography>
              </Box>
            ) : (
              filteredSeries.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))
            )}
          </Box>
        </Box>

        {/* Bottom Nav - Mobile Only */}
        <Box className="fixed bottom-0 left-0 right-0 sm:hidden bg-[#08090C]/80 backdrop-blur-xl border-t border-[#262A33] px-6 py-3 flex justify-between items-center z-50">
          <IconButton
            sx={{ color: "#9CA3AF", "&:hover": { color: "#E50914" } }}
            onClick={() => navigate("/")}
          >
            <Home />
          </IconButton>
          <IconButton
            sx={{
              color: "#E50914",
              bgcolor: "rgba(229,9,20,0.1)",
              boxShadow: "0 0 15px rgba(229,9,20,0.2)",
            }}
          >
            <LibraryBooks />
          </IconButton>
          <IconButton
            sx={{ color: "#9CA3AF", "&:hover": { color: "#E50914" } }}
          >
            <Search />
          </IconButton>
          <IconButton
            sx={{ color: "#9CA3AF", "&:hover": { color: "#E50914" } }}
            onClick={() => navigate("/profile")}
          >
            <Person />
          </IconButton>
        </Box>
      </Box>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .shadow-glow {
          box-shadow: 0 0 20px rgba(229, 9, 20, 0.45);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </ThemeProvider>
  );
};

export default LibraryPage;
