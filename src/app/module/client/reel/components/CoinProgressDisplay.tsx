import React from "react";
import { Coins } from "lucide-react";
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

// Geometry for the circular "watch to earn" progress ring.
const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  const ringPercent = Math.min(100, Math.max(0, (watchSeconds / 10) * 100));
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringPercent / 100);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Coin Progress Display - Fixed Floating over scroll content */}
      {isAuthenticated && (
        <div
          onClick={() => navigate("/coins")}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`absolute z-[2000] flex select-none flex-col items-center gap-2 [touch-action:none] ${
            isDragging
              ? "scale-110 cursor-grabbing transition-none"
              : "scale-100 cursor-grab transition-all duration-150 ease-out"
          }`}
          style={{ top: pos.y, left: pos.x }}
        >
          <div className="relative grid h-[54px] w-[54px] place-items-center rounded-full border border-white/10 bg-ocean-surface-dark/60 shadow-[0_4px_15px_rgba(0,0,0,0.3)] backdrop-blur-md transition-transform duration-300 hover:scale-105">
            <svg width={50} height={50} viewBox="0 0 50 50" className="[grid-area:1/1] origin-center -rotate-90">
              <circle cx={25} cy={25} r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
              <circle
                cx={25}
                cy={25}
                r={RING_RADIUS}
                fill="none"
                stroke="#FBBF24"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                style={{
                  transition: "stroke-dashoffset 0.3s ease",
                  filter: "drop-shadow(0 0 5px rgba(251,191,36,0.5))",
                }}
              />
            </svg>
            <Coins
              size={28}
              className="pointer-events-none [grid-area:1/1] z-[2] text-amber-400"
              style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.4))" }}
            />
          </div>

          {/* Current Balance Running */}
          {totalCoins !== null && (
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-ocean-surface-dark/60 px-4 py-1 shadow-[0_4px_15px_rgba(0,0,0,0.2)] backdrop-blur-md">
              <span className="text-sm font-black tracking-[0.5px] text-white">
                {totalCoins.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold uppercase text-amber-400">Coins</span>
            </div>
          )}

          {/* Floating Earned Text */}
          {showEarnedEffect && (
            <span
              className="animate-float-up text-base font-black text-amber-400"
              style={{ textShadow: "0 0 10px rgba(251,191,36,0.8)" }}
            >
              +10
            </span>
          )}
        </div>
      )}

      {/* Scrollable Video Content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="no-scrollbar relative h-full w-full snap-y snap-mandatory overflow-y-scroll bg-[#08090C]"
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
      </div>
    </div>
  );
};

export default CoinProgressDisplay;
