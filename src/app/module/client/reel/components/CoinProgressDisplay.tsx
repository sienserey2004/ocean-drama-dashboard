import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import SavingsIcon from '@mui/icons-material/Savings';
import VideoCard from "../VideoCard";
import { FeedPreviewItem } from "@/app/api/video.service";
import { useNavigate } from "react-router-dom";

interface CoinProgressDisplayProps {
  isAuthenticated: boolean;
  pos: { x: number; y: number };
  isDragging: boolean;
  handleTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchMove: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchEnd: () => void;
  watchSeconds: number;
  totalCoins: number | null;
  showEarnedEffect: boolean;
  feedItems: FeedPreviewItem[];
  activeIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  muted: boolean;
  volume: number;
  setIsPlaying: (playing: boolean) => void;
}

const CoinProgressDisplay: React.FC<CoinProgressDisplayProps> = ({
  isAuthenticated,
  pos,
  isDragging,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  watchSeconds,
  totalCoins,
  showEarnedEffect,
  feedItems,
  activeIndex,
  containerRef,
  handleScroll,
  muted,
  volume,
  setIsPlaying,
}) => {

  const navigate = useNavigate();
  return (

    <Box sx={{ height: "100%", width: "100%", position: "relative", overflow: "hidden" }}>
      {/* Coin Progress Display - Fixed Floating over scroll content */}
      {isAuthenticated && (
        <Box
        onClick={()=>navigate("/coins")}
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
            <SavingsIcon
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "#FFD700",
                fontSize: 28,
                zIndex: 2,
                pointerEvents: "none",
                filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))",
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

export default CoinProgressDisplay;