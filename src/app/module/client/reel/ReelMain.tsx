import React, { useState } from "react";
import { Search, Volume2, VolumeX, Volume1 } from "lucide-react";
import { IconButton, Tooltip } from "@/_ocean/ui";
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

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setMuted(val === 0);
    resetHideTimer();
  };

  const VolumeIconComp = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

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
    <div className="relative h-full w-full overflow-hidden bg-[#08090C]">
      {/* ── Background Glow ────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-ocean-radial" />

      {/* ── Top Nav Bar ───────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-5 z-20 flex items-center justify-center gap-6 px-6 font-bold text-[#9CA3AF] md:top-[30px]">
        <div className="flex-1">
          {isAuthenticated && user && (
            <p className="hidden text-sm font-bold text-[#F9FAFB] opacity-80 md:block">
              Welcome back, {user.name} 👋
            </p>
          )}
        </div>

        <div className="flex items-center gap-8">
          {[
            { id: "following", label: "Following" },
            { id: "foryou", label: "For You" },
            { id: "nearby", label: "Near By" },
          ].map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative cursor-pointer pb-[5px] transition-all duration-300"
            >
              <span
                className={`text-[17px] font-extrabold transition-colors hover:text-white ${
                  activeTab === tab.id
                    ? "text-white [text-shadow:0_0_10px_rgba(14,165,233,0.3)]"
                    : "text-[#9CA3AF]"
                }`}
              >
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-[20%] right-[20%] h-[3px] rounded-[2px] bg-primary shadow-glow" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-4">
          <span className="hidden font-bebas text-2xl font-black tracking-wider text-white opacity-90 [text-shadow:1px_1px_0px_#0EA5E9,2px_2px_0px_#0284C7] md:block">
            OCEAN DRAMA
          </span>
          <IconButton
            plain
            onClick={() => setSearchOpen(true)}
            className="border border-white/10 bg-white/[0.08] text-white backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.15]"
          >
            <Search size={20} />
          </IconButton>
        </div>
      </div>

      {/* ── Search Component ───────────────────────────────────── */}
      <SearchVideo open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Volume Control ─────────────────────────────────────── */}
      <div
        className={`fixed left-6 top-6 z-30 flex items-center gap-2 overflow-hidden rounded-full border border-white/[0.08] bg-[#111217]/60 py-2 backdrop-blur-lg transition-all duration-[400ms] ease-in-out ${
          showVolumeSlider
            ? "px-4 shadow-[0_0_20px_rgba(14,165,233,0.2)]"
            : "px-2 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
        }`}
        style={{ maxWidth: showVolumeSlider ? 240 : 52 }}
      >
        <Tooltip title={muted ? "Unmute" : "Mute"} placement="right">
          <IconButton
            plain
            size="sm"
            onClick={handleVolumeIconClick}
            className="text-white transition-all duration-200 hover:scale-110 hover:text-primary"
          >
            <VolumeIconComp size={24} />
          </IconButton>
        </Tooltip>

        {showVolumeSlider && (
          <div className="flex w-[140px] items-center pr-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              onMouseEnter={resetHideTimer}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-primary"
            />
          </div>
        )}
      </div>

      {/* ── Active Content ────────────────────────────────────── */}
      <div className="h-full w-full">{renderContent()}</div>
    </div>
  );
};

export default ReelMain;
