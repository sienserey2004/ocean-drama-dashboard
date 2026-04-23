import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Slider from "@mui/material/Slider";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import { Search } from "@mui/icons-material";
import { useAuthStore } from "@/app/stores/authStore";
import SearchVideo from "../search-video/SearchVideo";
import ForYou from "./components/ForYou";
import Following from "./components/Following";
import NearBy from "./components/NearBy";

const ReelMain: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"following" | "foryou" | "nearby">("foryou");
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Shared Audio state ────────────────────────────────────────
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVolumeIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showVolumeSlider) {
      setMuted((prev) => !prev);
    } else {
      setShowVolumeSlider(true);
      resetHideTimer();
    }
  };

  const resetHideTimer = () => {
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 3000);
  };

  const handleVolumeChange = (_: Event, val: number | number[]) => {
    const v = val as number;
    setVolume(v);
    setMuted(v === 0);
    resetHideTimer();
  };

  const VolumeIcon = muted || volume === 0 ? VolumeOffIcon : volume < 0.5 ? VolumeDownIcon : VolumeUpIcon;

  const renderContent = () => {
    switch (activeTab) {
      case "following":
        return <Following />;
      case "foryou":
        return <ForYou muted={muted} volume={volume} />;
      case "nearby":
        return <NearBy />;
      default:
        return <ForYou muted={muted} volume={volume} />;
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        bgcolor: "#08090C",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Background Glow ────────────────────────────────────── */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at top, rgba(229,9,20,0.15), transparent 70%)",
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
          position: "absolute",
          top: { xs: 20, md: 30 },
          left: 0,
          right: 0,
          zIndex: 20,
          color: "#9CA3AF",
          fontWeight: "bold",
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
                opacity: 0.8,
              }}
            >
              Welcome back, {user.name} 👋
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={4}>
          {[
            { id: "following", label: "Following" },
            { id: "foryou", label: "For You" },
            { id: "nearby", label: "Near By" },
          ].map((tab) => (
            <Box
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              sx={{
                cursor: "pointer",
                paddingBottom: "5px",
                position: "relative",
                transition: "all 0.3s ease",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: activeTab === tab.id ? "white" : "#9CA3AF",
                  textShadow: activeTab === tab.id ? "0 0 10px rgba(229,9,20,0.3)" : "none",
                  "&:hover": { color: "white" },
                }}
              >
                {tab.label}
              </Typography>
              {activeTab === tab.id && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: "20%",
                    right: "20%",
                    height: "3px",
                    bgcolor: "#E50914",
                    borderRadius: "2px",
                    boxShadow: "0 0 10px #E50914",
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              display: { xs: "none", md: "block" },
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
          <IconButton
            onClick={() => setSearchOpen(true)}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" },
            }}
          >
            <Search />
          </IconButton>
        </Box>
      </Stack>

      {/* ── Search Component ───────────────────────────────────── */}
      <SearchVideo open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Volume Control ─────────────────────────────────────── */}
      <Box
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
          boxShadow: showVolumeSlider ? "0 0 20px rgba(229,9,20,0.2)" : "0 4px 24px rgba(0,0,0,0.4)",
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
              p: 0.75,
              transition: "all 0.2s ease",
              "&:hover": { color: "#E50914", transform: "scale(1.1)" },
            }}
          >
            <VolumeIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Tooltip>

        {showVolumeSlider && (
          <Box sx={{ width: 140, display: "flex", alignItems: "center", pr: 1 }}>
            <Slider
              size="small"
              value={muted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onChange={handleVolumeChange}
              onMouseEnter={resetHideTimer}
              sx={{
                color: "#E50914",
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  bgcolor: "white",
                  boxShadow: "0 0 10px rgba(229,9,20,0.5)",
                },
                "& .MuiSlider-rail": { opacity: 0.2, bgcolor: "white" },
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── Active Content ────────────────────────────────────── */}
      <Box sx={{ height: "100%", width: "100%" }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default ReelMain;
