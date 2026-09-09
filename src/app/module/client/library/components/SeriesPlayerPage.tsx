import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PlayCircle, ArrowLeft, Send, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { episodeApi } from "@/app/api/episode.service";
import { videoApi } from "@/app/api/video.service";
import { historyApi } from "@/app/api/history.service";
import { commentApi, Comment } from "@/app/api/comment.service";
import { Episode, Video } from "@/app/types";
import toast from "@/app/utils/toast";
import HLSPlayer from "./HLSPlayer";
import { Avatar, Button, Divider, TextField, Card, Spinner } from "@/_ocean/ui";

const SeriesPlayerPage: React.FC = () => {
  const { videoId, episodeId } = useParams<{
    videoId: string;
    episodeId?: string;
  }>();

  const navigate = useNavigate();
  const location = useLocation();

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [episodeQuery, setEpisodeQuery] = useState("");

  const saveProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  useEffect(() => {
    const initPage = async () => {
      if (!videoId) return;
      try {
        setLoading(true);
        // Check access
        console.log("Checking access for videoId:", videoId);
        const accessRes = await videoApi.checkAccess(Number(videoId));
        console.log("Access response:", accessRes);
        if (!accessRes.hasAccess && !(accessRes as any).has_access) {
          console.warn("Access denied, hasAccess is falsy");
          toast.error("You don't have access to this series.");
          navigate(`/viewer/library/${videoId}`);
          return;
        }
        setHasAccess(true);

        // Fetch video and episodes
        const [vData, eData] = await Promise.all([
          videoApi.getById(Number(videoId)),
          episodeApi.list(Number(videoId), { page: 1, limit: 100 }),
        ]);

        setVideo(vData);
        setEpisodes(
          eData.data.sort((a: Episode, b: Episode) => a.episode_number - b.episode_number),
        );

        // Set active episode. An id that matches nothing (a stale link, or an
        // episode number mistaken for an id) falls back to the first episode
        // rather than rendering an empty page.
        const activeEp =
          (episodeId
            ? eData.data.find((e: Episode) => e.episode_id === Number(episodeId))
            : undefined) ?? eData.data[0];

        if (activeEp) {
          console.log("Selected episode:", activeEp);
          setCurrentEpisode(activeEp);

          // Reset refs for new episode
          currentTimeRef.current = 0;
          durationRef.current = 0;

          // Fetch watch progress
          try {
            const streamData = await episodeApi.getStreamUrl(activeEp.episode_id);
            if (streamData.resume_at) {
              setInitialTime(streamData.resume_at);
              setCurrentTime(streamData.resume_at);
              currentTimeRef.current = streamData.resume_at;
              console.log("Resuming from:", streamData.resume_at);
            }
          } catch (e) {
            console.log("No previous progress found or failed to fetch stream data");
          }
          // Fetch comments
          const cData = await commentApi
            .listByEpisode(activeEp.episode_id)
            .catch(() => ({ data: [], total: 0 }));
          setComments(cData.data);
          console.log("Comments:", cData.data);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
        toast.error("Failed to load player.");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [videoId, episodeId]);

  useEffect(() => {
    if (currentEpisode && isPlaying) {
      saveProgressTimer.current = setInterval(() => {
        saveProgress();
      }, 15000); // Save every 15 seconds for better accuracy
    }
    return () => {
      if (saveProgressTimer.current) clearInterval(saveProgressTimer.current);
      // Final save on unmount or episode change
      saveProgress();
    };
  }, [currentEpisode, isPlaying]);

  const saveProgress = async () => {
    const time = currentTimeRef.current;
    const dur = durationRef.current;
    if (currentEpisode && time > 0) {
      try {
        // Consider completed if watched more than 95%
        const isCompleted = dur > 0 && (time / dur) > 0.95;
        await episodeApi.saveProgress(
          currentEpisode.episode_id,
          Math.floor(time),
          isCompleted
        );
      } catch (err) {
        console.error("Failed to save watch progress", err);
      }
    }
  };

  // Filter the "Up Next" list by episode number or title.
  const query = episodeQuery.trim().toLowerCase();
  const filteredEpisodes = query
    ? episodes.filter(
        (ep) =>
          ep.title?.toLowerCase().includes(query) ||
          String(ep.episode_number).includes(query) ||
          `ep ${ep.episode_number}`.includes(query) ||
          `episode ${ep.episode_number}`.includes(query),
      )
    : episodes;

  const handleEpisodeSelect = (ep: Episode) => {
    navigate(`/viewer/play/${videoId}/${ep.episode_id}`);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !currentEpisode || !video) return;
    try {
      await commentApi.create(video.video_id, {
        episode_id: currentEpisode.episode_id,
        comment_text: newComment,
      });
      setNewComment("");
      // Refresh comments
      const cData = await commentApi.listByEpisode(currentEpisode.episode_id);
      setComments(cData.data);
      toast.success("Comment posted!");
    } catch (err) {
      toast.error("Failed to post comment.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0F0F0F]">
        <Spinner size={60} className="text-primary" />
      </div>
    );
  }

  if (!currentEpisode || !video) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0F0F0F] px-6 text-center text-white">
        <PlayCircle size={56} className="text-white/25" />
        <div>
          <p className="font-bold">Episode unavailable</p>
          <p className="mt-1 text-sm text-white/60">
            This series has no episodes ready to play yet.
          </p>
        </div>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Main Section (Player + Info + Comments) */}
        <div className="col-span-1 lg:col-span-9">
          {/* AppBar */}
          <div className="sticky top-0 z-[200] bg-[#0F0F0F]/92 backdrop-blur-md border-b border-white/[0.08] flex items-center gap-3 px-4 py-2.5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-black truncate leading-tight">
                {video?.title ?? 'Series'}
              </p>
              {currentEpisode && (
                <p className="text-xs font-bold truncate text-primary">
                  EP {currentEpisode.episode_number}: {currentEpisode.title}
                </p>
              )}
            </div>
          </div>
          <div className="static lg:sticky lg:top-0 z-[100]">
            {(currentEpisode.full_video_url || currentEpisode.preview_video_url) ? (
              <HLSPlayer
                episodeId={currentEpisode.episode_id}
                type={currentEpisode.has_access && currentEpisode.full_video_url ? "full" : "preview"}
                startTime={initialTime}
                onTimeUpdate={(t) => {
                  setCurrentTime(t);
                  currentTimeRef.current = t;
                }}
                onDurationChange={(d) => {
                  setDuration(d);
                  durationRef.current = d;
                }}
                onEnded={async () => {
                  // Mark as completed explicitly on end
                  await episodeApi.saveProgress(currentEpisode.episode_id, Math.floor(durationRef.current), true);

                  const nextIdx =
                    episodes.findIndex(
                      (e) => e.episode_id === currentEpisode.episode_id,
                    ) + 1;
                  if (nextIdx < episodes.length) {
                    handleEpisodeSelect(episodes[nextIdx]);
                  }
                }}
              />
            ) : (
              <div className="w-full flex items-center justify-center bg-black" style={{ aspectRatio: '16/9' }}>
                <p className="font-bold text-white/40">🎬 Video source not available yet</p>
              </div>
            )}
          </div>

          <div className="p-4 md:p-8">
            {/* Episode Info */}
            <h1 className="font-black text-xl mb-1">
              EP {currentEpisode.episode_number}: {currentEpisode.title}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <Avatar src={video.creator?.profile_image} size="lg" />
              <div>
                <p className="font-bold">
                  {video.creator?.name || "OceanDrama Original"}
                </p>
                <p className="text-xs opacity-60">
                  Series: {video.title}
                </p>
              </div>
              <div className="flex-1" />
              <Button variant="outlined" color="default" className="!text-white !border-white/20">
                Subscribe
              </Button>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl mb-8">
              <p className="text-sm leading-relaxed opacity-90">
                {showFullDescription
                  ? video.description
                  : video.description?.substring(0, 150) +
                    ((video.description?.length ?? 0) > 150 ? "..." : "")}
              </p>
              {video.description && (video.description?.length ?? 0) > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2 inline-flex items-center gap-1 font-bold text-primary text-sm"
                >
                  {showFullDescription ? "Show less" : "Show more"}
                  {showFullDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>

            <Divider className="!border-white/10 mb-8" />

            {/* Comments Section */}
            <h2 className="font-bold text-lg mb-4">
              {comments.length} Comments
            </h2>

            <div className="flex gap-3 mb-6">
              <Avatar size="md" />
              <div className="flex-1">
                <TextField
                  fullWidth
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="!text-white"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="text"
                    color="primary"
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim()}
                    endIcon={<Send size={16} />}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {comments.map((comment) => (
                <div key={comment.comment_id} className="flex gap-3">
                  <Avatar src={comment.user_image} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">
                        {comment.user || "User"}
                      </p>
                      <p className="text-xs opacity-50">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm mt-1 opacity-90">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (Episode List) */}
        <div className="col-span-1 lg:col-span-3">
          {/* Extra bottom padding on mobile clears the floating tab bar. */}
          <div className="p-2 pb-32 lg:pb-2 lg:max-h-[calc(100vh-64px)] lg:overflow-y-auto lg:border-l lg:border-white/10">
            <div className="flex items-center justify-between gap-2 mb-3 px-1">
              <h2 className="font-bold text-lg">
                Up Next
              </h2>
              <span className="text-xs font-bold opacity-50">
                {filteredEpisodes.length}/{episodes.length}
              </span>
            </div>

            {/* Episode search */}
            <div className="mb-4 px-1">
              <label htmlFor="episode-search" className="sr-only">
                Search episodes
              </label>
              <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] px-3 py-2.5 transition-colors focus-within:border-primary focus-within:bg-white/[0.08] focus-within:ring-4 focus-within:ring-primary/10">
                <Search size={17} aria-hidden="true" className="shrink-0 text-white/40" />
                <input
                  id="episode-search"
                  type="text"
                  autoComplete="off"
                  placeholder="Search episodes..."
                  value={episodeQuery}
                  onChange={(e) => setEpisodeQuery(e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-white outline-none placeholder:text-white/35"
                />
                {episodeQuery && (
                  <button
                    type="button"
                    onClick={() => setEpisodeQuery("")}
                    aria-label="Clear episode search"
                    className="flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {filteredEpisodes.length === 0 && (
              <p className="px-1 py-6 text-sm text-center opacity-50">
                No episodes match "{episodeQuery}"
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              {filteredEpisodes.map((ep) => {
                const isActive = ep.episode_id === currentEpisode?.episode_id;
                return (
                  <div
                    key={ep.episode_id}
                    onClick={() => handleEpisodeSelect(ep)}
                    className={`flex cursor-pointer rounded-xl transition-colors ${
                      isActive
                        ? "bg-primary/15 border border-primary hover:bg-primary/20"
                        : "bg-transparent border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="relative m-1 w-[120px] rounded-lg overflow-hidden shrink-0" style={{ aspectRatio: '16/9' }}>
                      <img
                        src={video.thumbnail_url || (video as any).thumbnailUrl}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <PlayCircle className="text-primary" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="p-1 flex-1 flex flex-col justify-center min-w-0">
                      <p className="text-xs font-bold text-primary">
                        Episode {ep.episode_number}
                      </p>
                      <p
                        className={`text-sm leading-tight line-clamp-2 ${isActive ? "font-black" : "font-bold"}`}
                      >
                        {ep.title}
                      </p>
                      <p className="text-xs opacity-50 mt-0.5">
                        {ep.duration
                          ? `${Math.floor(ep.duration / 60)}:00`
                          : "24:00"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Divider className="!border-white/10 my-8" />

            <h2 className="font-bold text-lg mb-4 px-1">
              Related Content
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {/* Dummy related cards */}
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden cursor-pointer">
                  <div className="bg-[#333]" style={{ aspectRatio: '16/9' }} />
                  <p className="block mt-2 font-bold text-xs">
                    Recommended Series {i}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesPlayerPage;
