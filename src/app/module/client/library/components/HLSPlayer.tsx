import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Box,
  IconButton,
  Slider,
  Stack,
  Typography,
  Menu,
  MenuItem,
  Fade,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import SettingsIcon from "@mui/icons-material/Settings";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";

interface HLSPlayerProps {
  url: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  startTime?: number;
  autoPlay?: boolean;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({
  url,
  onTimeUpdate,
  onEnded,
  startTime = 0,
  autoPlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    console.log("HLSPlayer init", { url, startTime, autoPlay });

    let hls: Hls | null = null;

    const handleVideoError = () => {
      const error = video.error;
      console.error("❌ HTMLVideoElement error:", error, "on URL:", url);
    };

    video.addEventListener("error", handleVideoError);

    /**
     * Determine if this is an HLS manifest.
     * We check for .m3u8 but also allow for blob URLs or cloud URLs that might 
     * use HLS but don't strictly end in .m3u8 (though rare).
     */
    const isHls = url.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      const tokenMatch = url.match(/[?&]token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      hls = new Hls({
        xhrSetup: (xhr, _reqUrl) => {
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("📽️ HLS manifest parsed for URL:", url);
        if (startTime > 0) video.currentTime = startTime;
        if (autoPlay)
          video
            .play()
            .catch((err) => console.error("⚠️ Video autoplay failed:", err));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error("❌ HLS error event:", data);
      });
    } else {
      // Direct playback for MP4 or native HLS (Safari)
      console.log("📽️ Direct/Native playback for URL:", url);
      
      const onLoadedMetadata = () => {
        console.log("✅ Video metadata loaded");
        if (startTime > 0) video.currentTime = startTime;
        if (autoPlay)
          video
            .play()
            .catch((err) => console.error("⚠️ Video autoplay failed:", err));
      };

      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.crossOrigin = "anonymous";
      video.src = url;
      video.load();

      return () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", handleVideoError);
        if (hls) hls.destroy();
      };
    }

    return () => {
      video.removeEventListener("error", handleVideoError);
      if (hls) {
        hls.destroy();
        console.log("HLS destroyed");
      }
    };
  }, [url, startTime, autoPlay]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => {
          console.log("Video play started");
        })
        .catch((err) => console.error("Play button failed:", err));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      console.log("Video paused");
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
      console.log(
        "Video metadata loaded, duration:",
        videoRef.current.duration,
      );
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
    setAnchorEl(null);
  };

  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        bgcolor: "black",
        overflow: "hidden",
        cursor: showControls ? "default" : "none",
      }}
    >
      <video
        ref={videoRef}
        style={{ width: "100%", height: "100%", outline: "none" }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      <Fade in={showControls}>
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

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={togglePlay} sx={{ color: "white" }}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              <IconButton
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime -= 10;
                }}
                sx={{ color: "white" }}
              >
                <FastRewindIcon />
              </IconButton>

              <IconButton
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime += 10;
                }}
                sx={{ color: "white" }}
              >
                <FastForwardIcon />
              </IconButton>

              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ ml: 2 }}
              >
                <IconButton
                  onClick={() => setIsMuted(!isMuted)}
                  sx={{ color: "white" }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeOffIcon />
                  ) : (
                    <VolumeUpIcon />
                  )}
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

              <Typography
                variant="caption"
                sx={{ color: "white", ml: 2, fontWeight: "bold" }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ color: "white" }}
              >
                <SettingsIcon />
              </IconButton>
              <IconButton onClick={toggleFullscreen} sx={{ color: "white" }}>
                <FullscreenIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Fade>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { bgcolor: "#1A1A1D", color: "white" } }}
      >
        <Typography variant="overline" sx={{ px: 2, color: "gray" }}>
          Playback Speed
        </Typography>
        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
          <MenuItem
            key={rate}
            onClick={() => handlePlaybackRateChange(rate)}
            selected={playbackRate === rate}
          >
            {rate}x
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default HLSPlayer;
