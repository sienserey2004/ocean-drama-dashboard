import React, { useEffect, useRef, useState } from "react";
import Hls, { Level } from "hls.js";
import {
  Play,
  Pause,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Settings,
  Check,
} from "lucide-react";
import { IconButton, Spinner } from "@/_ocean/ui";

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
  loop?: boolean;
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
  loop = false,
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  // "speed" | "quality" — which sub-panel is shown
  const [settingsView, setSettingsView] = useState<"main" | "speed" | "quality">("main");

  // Quality levels
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1); // -1 = Auto

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const binaryUrl = await episodeApi.getBinaryStreamUrl(ep, type);
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

    console.log("HLSPlayer init source:", { url, startTime, autoPlay });

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
        video.removeAttribute("src");
        video.load();
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

  // ─── Close settings menu on outside click ─────────────────────────────────
  useEffect(() => {
    if (!settingsOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (settingsPanelRef.current?.contains(target)) return;
      if (settingsBtnRef.current?.contains(target)) return;
      closeSettings();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [settingsOpen]);

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

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
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

  const openSettings = () => {
    setSettingsOpen(true);
    setSettingsView("main");
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setSettingsView("main");
  };

  /** Gets a label for the currently selected quality */
  const currentQualityLabel = () => {
    if (selectedLevel === -1) return "Auto";
    const found = qualityLevels.find((q) => q.index === selectedLevel);
    return found ? found.label : "Auto";
  };

  // Shared look for the seek/volume range inputs — a thin translucent track with a
  // small solid thumb, styled directly since there's no shared slider primitive yet.
  const rangeTrackClass =
    "h-1 cursor-pointer appearance-none rounded-full bg-white/25 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative h-full w-full overflow-hidden bg-black ${
        showControls && !hideControls ? "cursor-default" : "cursor-none"
      }`}
    >
      <video
        ref={videoRef}
        className={`h-full w-full outline-none ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
        loop={loop}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {loading && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/50">
          <Spinner size={40} className="text-primary" />
        </div>
      )}

      {!hideControls && (
        <div
          className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
        {/* Progress Bar */}
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className={`mb-2 w-full accent-primary ${rangeTrackClass} [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary`}
        />

        <div className="flex items-center justify-between gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-0.5">
            <IconButton plain className="text-white hover:bg-white/10" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </IconButton>

            <IconButton
              plain
              className="text-white hover:bg-white/10"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime -= 10;
              }}
            >
              <Rewind size={20} />
            </IconButton>

            <IconButton
              plain
              className="text-white hover:bg-white/10"
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime += 10;
              }}
            >
              <FastForward size={20} />
            </IconButton>

            <div className="ml-2 flex items-center gap-1">
              <IconButton plain className="text-white hover:bg-white/10" onClick={() => setIsMuted(!isMuted)}>
                {isMuted || volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
              </IconButton>
              <input
                type="range"
                aria-label="Volume"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className={`w-20 accent-white ${rangeTrackClass} [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white`}
              />
            </div>

            <span className="ml-2 hidden text-xs font-bold text-white sm:inline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-0.5">
            <div className="relative">
              <IconButton ref={settingsBtnRef} plain className="text-white hover:bg-white/10" onClick={openSettings}>
                <Settings size={20} />
              </IconButton>

              {/* ── Settings Menu ─────────────────────────────────────────── */}
              {settingsOpen && (
                <div
                  ref={settingsPanelRef}
                  className="absolute bottom-full right-0 z-20 mb-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.97)] py-1.5 text-white shadow-soft backdrop-blur-md"
                >
                  {/* ── Main view ───────────────────────────────────────── */}
                  {settingsView === "main" && (
                    <>
                      <button
                        onClick={() => setSettingsView("speed")}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-white/10"
                      >
                        <span>Playback Speed</span>
                        <span className="text-white/50">{playbackRate}x ›</span>
                      </button>

                      {qualityLevels.length > 0 && (
                        <>
                          <div className="my-1 border-t border-white/10" />
                          <button
                            onClick={() => setSettingsView("quality")}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-white/10"
                          >
                            <span>Quality</span>
                            <span className="text-white/50">{currentQualityLabel()} ›</span>
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* ── Playback Speed sub-panel ─────────────────────────── */}
                  {settingsView === "speed" && (
                    <>
                      <button
                        onClick={() => setSettingsView("main")}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-primary hover:bg-white/10"
                      >
                        ← Playback Speed
                      </button>
                      <div className="my-1 border-t border-white/10" />
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handlePlaybackRateChange(rate)}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-white/10"
                        >
                          <span>{rate}x</span>
                          {playbackRate === rate && <Check size={16} className="text-primary" />}
                        </button>
                      ))}
                    </>
                  )}

                  {/* ── Quality sub-panel ────────────────────────────────── */}
                  {settingsView === "quality" && (
                    <>
                      <button
                        onClick={() => setSettingsView("main")}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-primary hover:bg-white/10"
                      >
                        ← Quality
                      </button>
                      <div className="my-1 border-t border-white/10" />
                      {qualityLevels.map((lvl) => (
                        <button
                          key={lvl.index}
                          onClick={() => handleQualityChange(lvl.index)}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-white/10"
                        >
                          <span>{lvl.label}</span>
                          {selectedLevel === lvl.index && <Check size={16} className="text-primary" />}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <IconButton plain className="text-white hover:bg-white/10" onClick={toggleFullscreen}>
              <Maximize size={20} />
            </IconButton>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
