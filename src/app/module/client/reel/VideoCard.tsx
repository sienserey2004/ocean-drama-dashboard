import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Music2,
  CheckCircle,
  Plus,
  X,
  Send,
} from "lucide-react";
import { Avatar, IconButton, Spinner } from "@/_ocean/ui";
import { engagementApi } from "@/app/api/engagement.service";
import { commentApi, Comment } from "@/app/api/comment.service";
import { episodeApi } from "@/app/api/episode.service";
import { useAuthStore } from "@/app/stores/authStore";
import toast from "@/app/utils/toast";
import HLSPlayer from "../library/components/HLSPlayer";
import EpisodeListPage from "../episode-list/EpisodeListPage";

interface VideoCardProps {
  video: any;
  episodeId?: number;
  videoUrl: string;
  username: string;
  description: string;
  likes: string;
  comments: string;
  favorites: string;
  shares: string;
  music: string;
  profilePic: string;
  active: boolean;
  /** Global mute state from parent */
  muted: boolean;
  /** Global volume 0–1 from parent */
  volume: number;
  /** Callback for play/pause state */
  onTogglePlay?: (playing: boolean) => void;
}

// Overlay offsets clear the floating tab bar via --tab-bar-h (index.css).
// The bar is md:hidden, so md: drops back to the screen edge.

interface ActionProps {
  icon: React.ReactNode;
  count?: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

/** Bare icon over the video, the way short-video apps do it — no chip, no border,
 *  no blur layer. A drop shadow keeps it legible over bright frames instead. */
const ActionButton = ({ icon, count, label, active, onClick }: ActionProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    className="flex flex-col items-center gap-1 transition-transform duration-150 active:scale-90"
  >
    <span className={active ? "text-primary" : "text-white"}>{icon}</span>
    {count !== undefined && (
      <span className="text-[11px] font-semibold tabular-nums text-white">{count}</span>
    )}
  </button>
);

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  episodeId,
  videoUrl,
  username,
  description,
  likes,
  comments,
  favorites,
  shares,
  music,
  profilePic,
  active,
  muted,
  volume,
  onTogglePlay,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [isPlaying, setIsPlaying] = useState(true);

  // Notify parent of initial state
  useEffect(() => {
    if (active && onTogglePlay) {
      onTogglePlay(isPlaying);
    }
  }, [active, isPlaying]);

  // Engagement states
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(parseInt(likes));
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(parseInt(favorites));

  // Comments states
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<Comment[]>([]);
  const [commentCountState, setCommentCountState] = useState(
    parseInt(comments),
  );
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<number, Comment[]>
  >({});
  const [loadingReplies, setLoadingReplies] = useState<Record<number, boolean>>(
    {},
  );
  const [heartLikes, setHeartLikes] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const lastTapRef = useRef<number>(0);

  const [showEpisodes, setShowEpisodes] = useState(false);

  // Drives the hairline progress bar that replaces the player's "0:06 / 0:10" readout.
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initial fetch for user engagement status
  useEffect(() => {
    if (isAuthenticated && video?.videoId) {
      engagementApi
        .getLikes(video.videoId)
        .then((res) => {
          setLiked(res.user_liked);
          setLikeCount(res.like_count);
        })
        .catch(console.error);

      // Assume we might need a getFavoriteStatus if available,
      // for now let's just use the props or wait for backend update.
    }
  }, [isAuthenticated, video?.videoId]);

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) return toast.error("Please login to like");

    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic UI
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));

    try {
      if (prevLiked) {
        const res = await engagementApi.unlike(video.videoId);
        setLikeCount(res.like_count);
      } else {
        const res = await engagementApi.like(video.videoId);
        setLikeCount(res.like_count);
      }
    } catch (err) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Failed to update like");
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const delay = now - lastTapRef.current;
    if (delay < 300) {
      // Heart animation
      const newHeart = { id: Date.now(), x: e.clientX, y: e.clientY };
      setHeartLikes((prev) => [...prev, newHeart]);
      setTimeout(() => {
        setHeartLikes((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 1000);

      // Trigger like if not already liked
      if (!liked) {
        handleLike();
      }
    }
    lastTapRef.current = now;
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Please login to favorite");

    const prevFavorited = favorited;
    const prevCount = favoriteCount;

    setFavorited(!prevFavorited);
    setFavoriteCount(prevCount + (prevFavorited ? -1 : 1));

    try {
      if (prevFavorited) {
        await engagementApi.removeFavorite(video.videoId);
      } else {
        await engagementApi.addFavorite(video.videoId);
      }
    } catch (err) {
      setFavorited(prevFavorited);
      setFavoriteCount(prevCount);
      toast.error("Failed to update favorite");
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await commentApi.listByVideo(video.videoId);
      setCommentList(res.data);
      setCommentCountState(res.total);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(true);
    fetchComments();
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!isAuthenticated) return toast.error("Please login to comment");

    setIsPostingComment(true);
    try {
      await commentApi.create(video.videoId, {
        comment_text: newComment,
        episode_id: episodeId,
        parent_id: replyingTo?.comment_id,
      });
      setNewComment("");
      if (replyingTo) {
        // Refresh replies for this specific parent
        fetchReplies(replyingTo.comment_id);
        setReplyingTo(null);
      } else {
        fetchComments();
      }
      toast.success(replyingTo ? "Reply posted" : "Comment posted");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  const fetchReplies = async (commentId: number) => {
    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await commentApi.listReplies(commentId);
      setExpandedReplies((prev) => ({ ...prev, [commentId]: res.data }));
    } catch (err) {
      console.error("Failed to fetch replies", err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplies = (commentId: number) => {
    if (expandedReplies[commentId]) {
      const { [commentId]: _, ...rest } = expandedReplies;
      setExpandedReplies(rest);
    } else {
      fetchReplies(commentId);
    }
  };

  const togglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (onTogglePlay) onTogglePlay(nextPlaying);
  };

  return (
    <div
      className="relative flex h-full w-full snap-start items-center justify-center overflow-hidden bg-ocean-background-dark"
      onClick={(e) => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          handleDoubleTap(e);
        } else {
          togglePlay();
        }
        lastTapRef.current = now;
      }}
    >
      {/* Height-driven 9:16 frame — on desktop's wide viewport this keeps the
          vertical video centered at its native aspect ratio instead of
          object-cover stretching it edge-to-edge and cropping most of the frame */}
      <div className="relative h-full w-full overflow-hidden md:aspect-[9/16] md:w-auto md:max-w-full">
      <HLSPlayer
        episodeId={episodeId}
        type="preview"
        url={videoUrl}
        playing={active && isPlaying}
        muted={muted}
        volume={volume}
        hideControls={true}
        objectFit="cover"
        autoPlay={active}
        loop
        onEnded={() => {
          if (isAuthenticated && episodeId) {
            episodeApi.saveProgress(episodeId, 0, true).catch(console.error);
          }
        }}
        onDurationChange={setDuration}
        onTimeUpdate={(time) => {
          setProgress(duration > 0 ? Math.min(1, time / duration) : 0);
          // Save progress every 10 seconds or so
          if (isAuthenticated && episodeId && Math.floor(time) % 10 === 0 && Math.floor(time) > 0) {
            episodeApi.saveProgress(episodeId, Math.floor(time), false).catch(console.error);
          }
        }}
      />

      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <Play size={80} fill="currentColor" className="text-white opacity-50" />
        </div>
      )}

      {/* Heart Animations */}
      {heartLikes.map((heart) => (
        <Heart
          key={heart.id}
          size={80}
          fill="currentColor"
          className="animate-heart-pop pointer-events-none fixed z-[100] text-primary [filter:drop-shadow(0_0_20px_rgba(14,165,233,0.6))]"
          style={{ left: heart.x - 40, top: heart.y - 40 }}
        />
      ))}

      {/* Bottom Gradient Overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      {/* Playback progress — a hairline bar is the mobile convention here; the
          player's numeric "0:06 / 0:10" readout is desktop chrome and stays hidden. */}
      <div className="absolute inset-x-0 bottom-[var(--tab-bar-h)] z-10 h-[3px] bg-white/20 md:bottom-0">
        <div
          className="h-full origin-left bg-primary transition-transform duration-200 ease-linear"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* Overlay UI. One layer holds the meta column, the CTA and the action rail so
          they share a single tab-bar-safe inset instead of three hand-tuned offsets. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end gap-3 px-4 pb-[calc(var(--tab-bar-h)+16px)] md:pb-6">
        {/* ── Meta + CTA ─────────────────────────────────────── */}
        <div className="min-w-0 flex-1 text-white [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.6))]">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold">@{username}</span>
            <CheckCircle size={15} className="shrink-0 text-primary" />
          </div>

          <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/90">{description}</p>

          <div className="mt-2 flex items-center gap-1.5 text-white/70">
            <Music2 size={13} className="shrink-0" />
            <span className="truncate text-xs">{music}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEpisodes(true);
            }}
            className="pointer-events-auto mt-3 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-150 active:scale-95"
          >
            Buy Full Season
          </button>
        </div>

        {/* ── Action rail ────────────────────────────────────── */}
        <div className="pointer-events-auto flex shrink-0 flex-col items-center gap-5 pb-1 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.6))]">
          <button
            type="button"
            aria-label={`View ${username}'s profile`}
            onClick={(e) => e.stopPropagation()}
            className="relative mb-1 transition-transform duration-150 active:scale-90"
          >
            <Avatar src={profilePic} className="h-11 w-11 border-2 border-white" />
            <span className="absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white">
              <Plus size={13} strokeWidth={3} />
            </span>
          </button>

          <ActionButton
            label="Like"
            active={liked}
            count={likeCount}
            onClick={handleLike}
            icon={<Heart size={29} fill={liked ? "currentColor" : "none"} strokeWidth={1.8} />}
          />

          <ActionButton
            label="Comments"
            count={commentCountState}
            onClick={handleCommentClick}
            icon={<MessageCircle size={29} strokeWidth={1.8} />}
          />

          <ActionButton
            label="Save"
            active={favorited}
            count={favoriteCount}
            onClick={handleFavorite}
            icon={<Bookmark size={29} fill={favorited ? "currentColor" : "none"} strokeWidth={1.8} />}
          />

          <ActionButton
            label="Share"
            count={shares}
            onClick={(e) => {
              e.stopPropagation();
              toast.success("Link copied!");
            }}
            icon={<Share2 size={29} strokeWidth={1.8} />}
          />

          <div
            className="mt-1 h-9 w-9 rounded-full border-4 border-white/15 bg-ocean-card-dark bg-cover"
            style={{ backgroundImage: `url(${profilePic})`, animation: "spin 6s linear infinite" }}
          />
        </div>
      </div>
      </div>

      {/* Episodes Bottom Sheet */}
      {showEpisodes &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-end justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-0 animate-fade-in bg-black/60"
              onClick={() => setShowEpisodes(false)}
            />
            <div className="animate-slide-up relative h-[85%] w-full overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-ocean-background-dark text-white">
              <EpisodeListPage
                videoIdProp={video.videoId?.toString()}
                onClose={() => setShowEpisodes(false)}
                autoOpenPurchase
              />
            </div>
          </div>,
          // Tailwind's `important: '#root'` scoping (tailwind.config.js) strips all
          // utility classes from anything portaled outside #root — must mount here,
          // not document.body, or this renders as an unstyled block with no overlay.
          document.getElementById("root")!,
        )}

      {/* Comments Bottom Sheet */}
      {showComments &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-end justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-0 animate-fade-in bg-black/60"
              onClick={() => setShowComments(false)}
            />
            <div className="animate-slide-up relative flex h-[70%] w-full flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-ocean-surface-dark/95 text-white [backdrop-filter:blur(20px)]">
              <div className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h6 className="text-lg font-extrabold tracking-[-0.5px]">
                    {commentCountState} Comments
                  </h6>
                  <IconButton
                    plain
                    onClick={() => setShowComments(false)}
                    className="bg-white/5 text-white transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <X size={20} />
                  </IconButton>
                </div>

                <div className="no-scrollbar mb-4 flex-1 overflow-y-auto px-0.5">
                  {loadingComments ? (
                    <div className="flex justify-center p-8">
                      <Spinner size={28} className="text-primary" />
                    </div>
                  ) : commentList.length === 0 ? (
                    <div className="py-16 text-center opacity-50">
                      <MessageCircle size={48} className="mx-auto mb-4" />
                      <p className="font-semibold">No comments yet</p>
                      <p className="text-sm">Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {commentList.map((c) => (
                        <div key={c.comment_id}>
                          <div className="flex gap-4">
                            <Avatar src={c.user_image} className="h-10 w-10 border border-white/10" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white">
                                {c.user || "Anonymous"}
                              </p>
                              <p className="mt-1 leading-relaxed text-[#E5E7EB]">{c.text}</p>
                              <div className="mt-3 flex items-center gap-6">
                                <span className="text-xs font-medium text-[#A1A1AA]">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </span>
                                <button
                                  type="button"
                                  className="text-xs font-bold text-[#A1A1AA] transition-colors hover:text-primary"
                                  onClick={() => {
                                    setReplyingTo(c);
                                    setNewComment(`@${c.user} `);
                                  }}
                                >
                                  Reply
                                </button>
                              </div>

                              {/* Replies Section */}
                              {(c.reply_count || 0) > 0 && (
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleReplies(c.comment_id)}
                                    className="flex items-center gap-2 text-xs font-extrabold text-primary transition-opacity hover:opacity-80"
                                  >
                                    <span className="h-[1.5px] w-6 bg-primary opacity-30" />
                                    {expandedReplies[c.comment_id]
                                      ? "Hide replies"
                                      : `View ${c.reply_count} replies`}
                                  </button>

                                  {expandedReplies[c.comment_id] && (
                                    <div className="ml-1 mt-3 flex flex-col gap-4 border-l-2 border-primary/10 pl-4">
                                      {expandedReplies[c.comment_id].map((reply) => (
                                        <div key={reply.comment_id} className="flex gap-3">
                                          <Avatar src={reply.user_image} className="h-7 w-6" />
                                          <div className="flex-1">
                                            <p className="text-[13px] font-bold text-white">
                                              {reply.user || "Anonymous"}
                                            </p>
                                            <p className="text-[13px] leading-relaxed text-[#E5E7EB]">
                                              {reply.text}
                                            </p>
                                            <div className="mt-2 flex items-center gap-4">
                                              <span className="text-[11px] text-[#A1A1AA]">
                                                {new Date(reply.created_at).toLocaleDateString()}
                                              </span>
                                              <button
                                                type="button"
                                                className="text-[11px] font-bold text-[#A1A1AA] transition-colors hover:text-primary"
                                                onClick={() => {
                                                  setReplyingTo(c);
                                                  setNewComment(`@${reply.user} `);
                                                }}
                                              >
                                                Reply
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {loadingReplies[c.comment_id] && (
                                    <div className="flex justify-center py-2">
                                      <Spinner size={18} className="text-primary" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                  <Avatar src={user?.profile_image} className="h-10 w-10 border border-primary/20" />
                  <input
                    type="text"
                    autoFocus={!!replyingTo}
                    placeholder={
                      replyingTo ? `Reply to @${replyingTo.user}...` : "Add a comment..."
                    }
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      if (!e.target.value && replyingTo) setReplyingTo(null);
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handlePostComment()}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary"
                  />
                  <IconButton
                    plain
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || isPostingComment}
                    className="bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:bg-transparent disabled:text-white/20"
                  >
                    {isPostingComment ? <Spinner size={22} /> : <Send size={20} />}
                  </IconButton>
                </div>
              </div>
            </div>
          </div>,
          document.getElementById("root")!,
        )}
    </div>
  );
};

export default VideoCard;
