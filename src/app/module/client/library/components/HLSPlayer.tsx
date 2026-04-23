import React, { useEffect, useRef, useState } from "react";
import Hls, { Level } from "hls.js";
import {
  Box,
  Divider,
  IconButton,
  Slider,
  Stack,
  Typography,
  Menu,
  MenuItem,
  Fade,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import SettingsIcon from "@mui/icons-material/Settings";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import CheckIcon from "@mui/icons-material/Check";

import { episodeApi } from "@/app/api/episode.service";

interface HLSPlayerProps {
  url?: string;
  episodeId?: number;
  type?: "full" | "preview";
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  startTime?: number;
  autoPlay?: boolean;
  hideControls?: boolean;
  objectFit?: "cover" | "contain";
  playing?: boolean;
  muted?: boolean;
  volume?: number;
}

/** A single selectable quality level in the menu */
interface QualityLevel {
  index: number; // hls.js level index, -1 = auto
  label: string; // e.g. "Auto", "1080p", "720p"
  height: number;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
  url: initialUrl,
  episodeId,
  type = "full",
  onTimeUpdate,
  onDurationChange,
  onEnded,
  startTime: initialStartTime = 0,
  autoPlay = true,
  hideControls = false,
  objectFit = "contain",
  playing,
  muted: externalMuted,
  volume: externalVolume,
}) => {
  const [url, setUrl] = useState<string | undefined>(initialUrl);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [loading, setLoading] = useState(!!episodeId && !initialUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null); // Keep HLS instance accessible for quality switching

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(externalVolume ?? 1);
  const [isMuted, setIsMuted] = useState(externalMuted ?? false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Settings menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // "speed" | "quality" — which sub-panel is shown
  const [settingsView, setSettingsView] = useState<"main" | "speed" | "quality">("main");

  // Quality levels
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1); // -1 = Auto

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUrlRef = useRef<string>("");

  // ─── Fetch stream URL when episodeId is provided ─────────────────────────
  useEffect(() => {
    if (!episodeId) {
      if (initialUrl) setUrl(initialUrl);
      return;
    }

    const fetchStreamUrl = async () => {
      try {
        setLoading(true);
        console.log(`📽️ Fetching stream URL for episode ${episodeId} (${type})...`);
        const streamData = await episodeApi.getStreamUrl(episodeId);
        const ep = await episodeApi.getById(episodeId);
        const binaryUrl = episodeApi.getBinaryStreamUrl(ep, type);
        console.log("📽️ Stream URL acquired:", binaryUrl);
        setUrl(binaryUrl);
        if (initialStartTime === 0 && streamData.resume_at) {
          setStartTime(streamData.resume_at);
        }
      } catch (err) {
        console.error("❌ Failed to fetch stream URL:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreamUrl();
  }, [episodeId, type, initialUrl, initialStartTime]);

  // ─── Init / reinit HLS when URL changes ──────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (lastUrlRef.current === url) {
      console.log("📽️ Source already set for URL, skipping re-init:", url);
      return;
    }

    console.log("HLSPlayer init source:", { url, startTime, autoPlay });
    lastUrlRef.current = url;

    // Destroy any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset quality state for the new source
    setQualityLevels([]);
    setSelectedLevel(-1);

    const handleVideoError = () => {
      const error = video.error;
      console.error("❌ HTMLVideoElement error:", error, "on URL:", url);
    };

    video.addEventListener("error", handleVideoError);

    const isHls =
      url.split("?")[0].toLowerCase().endsWith(".m3u8") || url.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      const tokenMatch = url.match(/[?&]token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      const hls = new Hls({
        xhrSetup: (xhr, _reqUrl) => {
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        console.log("📽️ HLS manifest parsed:", data.levels.length, "quality levels");

        // Build quality menu entries
        const levels: QualityLevel[] = [
          { index: -1, label: "Auto", height: 0 },
          ...data.levels.map((lvl: Level, idx: number) => ({
            index: idx,
            label: lvl.height ? `${lvl.height}p` : `Level ${idx}`,
            height: lvl.height ?? 0,
          })),
        ];
        // Sort descending (highest quality first) after Auto
        levels.sort((a, b) => {
          if (a.index === -1) return -1;
          if (b.index === -1) return 1;
          return b.height - a.height;
        });
        setQualityLevels(levels);

        if (startTime > 0) video.currentTime = startTime;
        if (autoPlay) {
          video.play().catch((err) => {
            if (err.name !== "AbortError") console.error("⚠️ HLS autoplay failed:", err);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error("❌ HLS error event:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Fatal network error, trying to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Fatal media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Direct playback (native HLS on Safari or plain MP4)
      console.log("📽️ Direct/Native playback for URL:", url);

      const onLoadedMetadata = () => {
        console.log("✅ Video metadata loaded");
        if (startTime > 0 && Math.abs(video.currentTime - startTime) > 1) {
          video.currentTime = startTime;
        }
        if (autoPlay) {
          video.play().catch((err) => {
            if (err.name !== "AbortError") console.error("⚠️ Video autoplay failed:", err);
          });
        }
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.crossOrigin = "anonymous";
      video.src = url;
      video.load();

      return () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", handleVideoError);
      };
    }

    return () => {
      video.removeEventListener("error", handleVideoError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        console.log("HLS destroyed");
      }
    };
  }, [url]);

  // ─── Apply startTime separately to avoid reloading source ────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || startTime <= 0) return;

    const handleInitialSeek = () => {
      if (Math.abs(video.currentTime - startTime) > 1) {
        console.log("📽️ Applying startTime seek:", startTime);
        video.currentTime = startTime;
      }
    };

    if (video.readyState >= 1) {
      handleInitialSeek();
    } else {
      video.addEventListener("loadedmetadata", handleInitialSeek, { once: true });
    }
  }, [startTime]);

  // ─── External play/pause sync ─────────────────────────────────────────────
  useEffect(() => {
    if (playing === undefined || !videoRef.current) return;
    if (playing) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [playing]);

  // ─── External volume/muted sync ──────────────────────────────────────────
  useEffect(() => {
    if (externalMuted !== undefined) setIsMuted(externalMuted);
    if (externalVolume !== undefined) setVolume(externalVolume);
  }, [externalMuted, externalVolume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => {
        if (err.name !== "AbortError") console.error("Play button failed:", err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      onDurationChange?.(videoRef.current.duration);
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value as number;
      setCurrentTime(value as number);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
    closeSettings();
  };

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex; // -1 = auto
      setSelectedLevel(levelIndex);
      console.log(`📽️ Quality switched to level ${levelIndex}`);
    }
    closeSettings();
  };

  const openSettings = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    setSettingsView("main");
  };

  const closeSettings = () => {
    setAnchorEl(null);
    setSettingsView("main");
  };

  /** Gets a label for the currently selected quality */
  const currentQualityLabel = () => {
    if (selectedLevel === -1) return "Auto";
    const found = qualityLevels.find((q) => q.index === selectedLevel);
    return found ? found.label : "Auto";
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        bgcolor: "black",
        overflow: "hidden",
        cursor: showControls && !hideControls ? "default" : "none",
      }}
    >
      <video
        ref={videoRef}
        style={{ width: "100%", height: "100%", outline: "none", objectFit }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: 5,
          }}
        >
          <CircularProgress sx={{ color: "#FE2C55" }} />
        </Box>
      )}

      <Fade in={showControls && !hideControls}>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
            zIndex: 10,
          }}
        >
          {/* Progress Bar */}
          <Slider
            size="small"
            value={currentTime}
            max={duration}
            onChange={handleSeek}
            sx={{
              color: "#FE2C55",
              mb: 1,
              "& .MuiSlider-thumb": { width: 12, height: 12 },
              "& .MuiSlider-rail": { opacity: 0.3 },
            }}
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            {/* Left controls */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={togglePlay} sx={{ color: "white" }}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              <IconButton
                onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                sx={{ color: "white" }}
              >
                <FastRewindIcon />
              </IconButton>

              <IconButton
                onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                sx={{ color: "white" }}
              >
                <FastForwardIcon />
              </IconButton>

              <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2 }}>
                <IconButton onClick={() => setIsMuted(!isMuted)} sx={{ color: "white" }}>
                  {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <Slider
                  size="small"
                  value={isMuted ? 0 : volume}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(_, val) => setVolume(val as number)}
                  sx={{ width: 80, color: "white" }}
                />
              </Stack>

              <Typography variant="caption" sx={{ color: "white", ml: 2, fontWeight: "bold" }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            </Stack>

            {/* Right controls */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={openSettings} sx={{ color: "white" }}>
                <SettingsIcon />
              </IconButton>
              <IconButton onClick={toggleFullscreen} sx={{ color: "white" }}>
                <FullscreenIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Fade>

      {/* ── Settings Menu ─────────────────────────────────────────────────── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeSettings}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          sx: {
            bgcolor: "rgba(20,20,20,0.97)",
            color: "white",
            minWidth: 200,
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 2,
          },
        }}
      >
        {/* ── Main view ───────────────────────────────────────────────── */}
        {settingsView === "main" && [
          <MenuItem
            key="speed-row"
            onClick={() => setSettingsView("speed")}
            sx={{ justifyContent: "space-between", py: 1.25 }}
          >
            <Typography variant="body2">Playback Speed</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
              {playbackRate}x ›
            </Typography>
          </MenuItem>,

          ...(qualityLevels.length > 0
            ? [
                <Divider key="divider" sx={{ borderColor: "rgba(255,255,255,0.08)" }} />,
                <MenuItem
                  key="quality-row"
                  onClick={() => setSettingsView("quality")}
                  sx={{ justifyContent: "space-between", py: 1.25 }}
                >
                  <Typography variant="body2">Quality</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                    {currentQualityLabel()} ›
                  </Typography>
                </MenuItem>,
              ]
            : []),
        ]}

        {/* ── Playback Speed sub-panel ─────────────────────────────────── */}
        {settingsView === "speed" && [
          <MenuItem
            key="back-speed"
            onClick={() => setSettingsView("main")}
            sx={{ color: "#FE2C55", py: 1 }}
          >
            ← Playback Speed
          </MenuItem>,
          <Divider key="d1" sx={{ borderColor: "rgba(255,255,255,0.08)" }} />,
          ...[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <MenuItem
              key={rate}
              onClick={() => handlePlaybackRateChange(rate)}
              sx={{ justifyContent: "space-between", py: 1.1 }}
            >
              <Typography variant="body2">{rate}x</Typography>
              {playbackRate === rate && <CheckIcon sx={{ fontSize: 16, color: "#FE2C55" }} />}
            </MenuItem>
          )),
        ]}

        {/* ── Quality sub-panel ────────────────────────────────────────── */}
        {settingsView === "quality" && [
          <MenuItem
            key="back-quality"
            onClick={() => setSettingsView("main")}
            sx={{ color: "#FE2C55", py: 1 }}
          >
            ← Quality
          </MenuItem>,
          <Divider key="d2" sx={{ borderColor: "rgba(255,255,255,0.08)" }} />,
          ...qualityLevels.map((lvl) => (
            <MenuItem
              key={lvl.index}
              onClick={() => handleQualityChange(lvl.index)}
              sx={{ justifyContent: "space-between", py: 1.1 }}
            >
              <Typography variant="body2">{lvl.label}</Typography>
              {selectedLevel === lvl.index && (
                <CheckIcon sx={{ fontSize: 16, color: "#FE2C55" }} />
              )}
            </MenuItem>
          )),
        ]}
      </Menu>
    </Box>
  );
};

export default HLSPlayer;
