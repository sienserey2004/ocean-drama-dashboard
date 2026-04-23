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
import { userApi } from "@/app/api/user.service";
import { coinApi } from "@/app/api/coin.service";
import { coinsBalance } from "../../Coins/services/balance.service";
import { useAuthStore } from "@/app/stores/authStore";
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';

interface ForYouProps {
  muted: boolean;
  volume: number;
}

const ForYou: React.FC<ForYouProps> = ({ muted, volume }) => {
  const { isAuthenticated } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coin earning state
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [showEarnedEffect, setShowEarnedEffect] = useState(false);
  const [totalCoins, setTotalCoins] = useState<number | null>(null);

  // Draggable state
  const [pos, setPos] = useState({ x: 20, y: 25 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragOffset.current = {
      x: clientX - pos.x,
      y: clientY - pos.y
    };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Boundary checks (keep within screen)
    const newX = Math.max(10, Math.min(window.innerWidth - 70, clientX - dragOffset.current.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 150, clientY - dragOffset.current.y));
    
    setPos({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Fetch initial balance
  useEffect(() => {
    if (isAuthenticated) {
      coinsBalance().then(res => {
        if (res && typeof res.coins !== 'undefined') setTotalCoins(res.coins);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  // Timer for coin earning
  useEffect(() => {
    if (!isAuthenticated || !isPlaying) return;

    const timer = setInterval(() => {
      setWatchSeconds((prev) => {
        const next = prev + 1;
        
        // Optimistically increment local coin balance every second
        setTotalCoins(current => current !== null ? current + 1 : current);

        if (next >= 10) {
          // Trigger API call every 10 seconds to persist earnings
          coinApi.earnWatchTime(10).then(() => {
            setShowEarnedEffect(true);
            setTimeout(() => setShowEarnedEffect(false), 2000);
            // Refresh total balance from server to stay in sync
            coinsBalance().then(res => {
              if (res && typeof res.coins !== 'undefined') setTotalCoins(res.coins);
            }).catch(console.error);
          }).catch(console.error);
          return 0; // Reset for next 10s cycle
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, isPlaying]);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch the base feed
        const feedResponse = await videoApi.feedPreview({ limit: 40, offset: 0 });
        let items = feedResponse.data;

        // 2. If authenticated, apply the "Last Played" & "Avoid Watched" logic
        if (isAuthenticated) {
          try {
            const historyResponse = await userApi.getWatchHistory({ limit: 100 });
            if (historyResponse && historyResponse.data) {
              const history = historyResponse.data;

              // Create a set for quick lookup and a map for recency
              // Assuming history items have 'episode_id' and are sorted by most recent first
              const historyMap = new Map(history.map((h: any, index: number) => [h.episode_id, index]));

              const res: FeedPreviewItem[] = [];
              const fresh: FeedPreviewItem[] = [];
              const watched: FeedPreviewItem[] = [];

              items.forEach(item => {
                const historyIndex = historyMap.get(item.episodeId);
                if (historyIndex === undefined) {
                  fresh.push(item);
                } else if (historyIndex === 0) {
                  // This is the absolute latest play, keep it at the very top
                  res.push(item);
                } else {
                  // It's been watched before, move towards the end
                  watched.push(item);
                }
              });

              // Combine: Resuming (Latest) + Fresh (New) + Watched (Old)
              items = [...res, ...fresh, ...watched];
            }
          } catch (historyErr) {
            console.error("Failed to fetch history for sorting:", historyErr);
            // Fallback to original order if history fails
          }
        }

        setFeedItems(items);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
        setError("Failed to load feed. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [isAuthenticated]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / e.currentTarget.clientHeight);
    if (index !== activeIndex) setActiveIndex(index);
  };

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
    <Box sx={{ height: "100%", width: "100%", position: "relative", overflow: "hidden" }}>
      {/* Coin Progress Display - Fixed Floating over scroll content */}
      {isAuthenticated && (
        <Box
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{
            position: "absolute",
            top: pos.y,
            left: pos.x,
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "none",
            transition: isDragging ? "none" : "all 0.15s ease-out",
            transform: isDragging ? "scale(1.1)" : "scale(1)",
          }}
        >
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 54,
              height: 54,
              borderRadius: "50%",
              bgcolor: "rgba(20, 20, 26, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.05)" },
            }}
          >
            <CircularProgress
              variant="determinate"
              value={(watchSeconds / 10) * 100}
              size={50}
              thickness={4}
              sx={{
                color: "#FFD700",
                position: "absolute",
                filter: "drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))",
                transition: "all 0.3s ease",
              }}
            />
            <CircularProgress
              variant="determinate"
              value={100}
              size={50}
              thickness={4}
              sx={{
                color: "rgba(255, 255, 255, 0.05)",
              }}
            />
            <CurrencyExchangeIcon 
              sx={{ 
                color: "#FFD700", 
                fontSize: 28, 
                zIndex: 1,
                filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))"
              }} 
            />
          </Box>

          {/* Current Balance Running */}
          {totalCoins !== null && (
            <Box
              sx={{
                bgcolor: "rgba(20, 20, 26, 0.6)",
                backdropFilter: "blur(12px)",
                px: 2,
                py: 0.5,
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.5px",
                }}
              >
                {totalCoins.toLocaleString()}
              </Typography>
              <Typography
                sx={{
                  color: "#FFD700",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Coins
              </Typography>
            </Box>
          )}
          
          {/* Floating Earned Text */}
          {showEarnedEffect && (
            <Typography
              sx={{
                color: "#FFD700",
                fontWeight: 900,
                fontSize: 16,
                textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
                animation: "floatUp 1.5s ease-out forwards",
                "@keyframes floatUp": {
                  "0%": { transform: "translateY(0)", opacity: 0 },
                  "20%": { transform: "translateY(-10px)", opacity: 1 },
                  "80%": { transform: "translateY(-20px)", opacity: 0.8 },
                  "100%": { transform: "translateY(-30px)", opacity: 0 },
                },
              }}
            >
              +10
            </Typography>
          )}
        </Box>
      )}

      {/* Scrollable Video Content */}
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
            onTogglePlay={(playing) => {
              if (index === activeIndex) setIsPlaying(playing);
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ForYou;
