import React, { useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Tooltip from "@mui/material/Tooltip";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VideoCard from "../VideoCard";
import { videoApi, FeedPreviewItem } from "@/app/api/video.service";
import { useAuthStore } from "@/app/stores/authStore";

const TikTokLanding: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Audio state ────────────────────────────────────────────────
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await videoApi.feedPreview({ limit: 20, offset: 0 });
        setFeedItems(response.data);
        console.log("feedItems", response.data);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
        setError("Failed to load feed. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / e.currentTarget.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const handleVolumeIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showVolumeSlider) {
      // Toggle mute when slider is already showing
      setMuted((prev) => !prev);
    } else {
      setShowVolumeSlider(true);
      resetHideTimer();
    }
  };

  const resetHideTimer = () => {
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(
      () => setShowVolumeSlider(false),
      3000,
    );
  };

  const handleVolumeChange = (_: Event, val: number | number[]) => {
    const v = val as number;
    setVolume(v);
    if (v === 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }
    resetHideTimer();
  };

  const VolumeIcon =
    muted || volume === 0
      ? VolumeOffIcon
      : volume < 0.5
        ? VolumeDownIcon
        : VolumeUpIcon;

  // ── Loading / Error / Empty ────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          bgcolor: "#08090C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: "#E50914" }} size={48} />
          <Typography
            sx={{
              color: "#9CA3AF",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "1px",
            }}
          >
            Diving into the ocean...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          bgcolor: "#08090C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <Typography
            sx={{
              color: "#E50914",
              fontWeight: 900,
              fontSize: 24,
              fontStyle: "italic",
            }}
          >
            Oops!
          </Typography>
          <Typography sx={{ color: "#9CA3AF", fontSize: 14 }}>
            {error}
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (feedItems.length === 0) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          bgcolor: "#08090C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ color: "#9CA3AF", fontSize: 16, fontWeight: 700 }}>
          No dramas found in this ocean
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        height: "100%",
        width: "100%",
        bgcolor: "#08090C",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        position: "relative",
        "&::-webkit-scrollbar": { display: "none" },
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {/* ── Background Glow ────────────────────────────────────── */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(circle at top, rgba(229,9,20,0.15), transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Top Nav Bar ───────────────────────────────────────── */}
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={3}
        sx={{
          position: "fixed",
          top: { xs: 20, md: 30 },
          left: 0,
          right: 0,
          zIndex: 20,
          color: "#9CA3AF",
          fontWeight: "bold",
          pointerEvents: "none",
          px: 3,
        }}
      >
        <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }}>
          {isAuthenticated && user && (
            <Typography
              sx={{
                color: "#F9FAFB",
                fontSize: 14,
                fontWeight: "700",
                pointerEvents: "auto",
                opacity: 0.8,
              }}
            >
              Welcome back, {user.name} 👋
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={4} sx={{ pointerEvents: "auto" }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: 17,
              fontWeight: "800",
              cursor: "pointer",
              color: "#9CA3AF",
              transition: "all 0.3s ease",
              "&:hover": { color: "white" },
            }}
          >
            Following
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: 17,
              fontWeight: "800",
              color: "white",
              borderBottom: "3px solid #E50914",
              paddingBottom: "5px",
              cursor: "pointer",
              textShadow: "0 0 10px rgba(229,9,20,0.3)",
            }}
          >
            For You
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: { xs: "none", md: "flex" },
            justifyContent: "flex-end",
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24,
              fontWeight: 900,
              color: "white",
              letterSpacing: "0.05em",
              textShadow: "1px 1px 0px #E50914, 2px 2px 0px #B20710",
              opacity: 0.9,
            }}
          >
            OCEAN DRAMA
          </Typography>
        </Box>
      </Stack>

      {/* ── Volume Control — top-left */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "fixed",
          top: 24,
          left: 24,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: "rgba(17, 18, 23, 0.6)",
          backdropFilter: "blur(16px)",
          borderRadius: "99px",
          px: showVolumeSlider ? 2 : 1,
          py: 1,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: showVolumeSlider
            ? "0 0 20px rgba(229,9,20,0.2)"
            : "0 4px 24px rgba(0,0,0,0.4)",
          transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          maxWidth: showVolumeSlider ? 240 : 52,
        }}
      >
        <Tooltip title={muted ? "Unmute" : "Mute"} placement="right">
          <IconButton
            size="small"
            onClick={handleVolumeIconClick}
            sx={{
              color: "white",
              flexShrink: 0,
              p: 0.75,
              transition: "all 0.2s ease",
              "&:hover": { color: "#E50914", transform: "scale(1.1)" },
            }}
          >
            <VolumeIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Tooltip>

        {showVolumeSlider && (
          <Box
            sx={{ width: 140, display: "flex", alignItems: "center", pr: 1 }}
          >
            <Slider
              size="small"
              value={muted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onChange={handleVolumeChange}
              onMouseEnter={resetHideTimer}
              aria-label="Volume"
              sx={{
                color: "#E50914",
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  bgcolor: "white",
                  boxShadow: "0 0 10px rgba(229,9,20,0.5)",
                  "&:hover": { boxShadow: "0 0 15px rgba(229,9,20,0.8)" },
                },
                "& .MuiSlider-rail": { opacity: 0.2, bgcolor: "white" },
                "& .MuiSlider-track": { border: "none" },
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── Video Feed ────────────────────────────────────────── */}
      {/* Video Feed */}
      {feedItems.map((item, index) => (
        <VideoCard
          key={item.episodeId}
          episodeId={item.episodeId}
          video={item.video}
          videoUrl={item.previewVideoUrl ?? ""}
          username={item.video.creator?.name ?? "Unknown"}
          description={item.video.title ?? "No title"}
          likes={String(item.video.like_count ?? 0)}
          comments={String(item.video.comment_count ?? 0)}
          favorites={String(item.video.save_count ?? 0)}
          shares={String(item.video.share_count ?? 0)}
          music={item.video.title ?? "Original Sound"}
          profilePic={item.video.thumbnailUrl ?? ""}
          active={index === activeIndex}
          muted={muted}
          volume={volume}
        />
      ))}
    </Box>
  );
};

export default TikTokLanding;
