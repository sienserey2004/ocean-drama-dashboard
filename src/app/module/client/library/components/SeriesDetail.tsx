import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PlayCircle,
  Play,
  Eye,
  Heart,
  Clock,
  Layers,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { videoApi } from "@/app/api/video.service";
import { commentApi, Comment } from "@/app/api/comment.service";
import { Episode, Video } from "@/app/types";
import { useAuthStore } from "@/app/stores/authStore";
import toast from "@/app/utils/toast";
import { Avatar, Button, Card, CardContent, Chip, Spinner, TextArea } from "@/_ocean/ui";

const COMMENT_MAX = 500;

/** Section heading with the shared azure accent, used by every block below the hero. */
const SectionHeading: React.FC<{
  icon: React.ReactNode;
  title: string;
  count?: number;
}> = ({ icon, title, count }) => (
  <div className="mb-6 flex items-center gap-3">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </span>
    <h2 className="text-xl md:text-2xl font-black tracking-tight">{title}</h2>
    {count !== undefined && (
      <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary">
        {count}
      </span>
    )}
    <span className="ml-1 h-px flex-1 bg-ocean-border-light dark:bg-ocean-border-dark" />
  </div>
);

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatCount = (n?: number | null) => {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const timeAgo = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
};

const SeriesDetail: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!videoId) return;
      try {
        setLoading(true);
        const [epResponse, videoData] = await Promise.all([
          videoApi.getEpisodesByVideoId(Number(videoId), {
            page: 1,
            limit: 50,
          }),
          videoApi.getById(Number(videoId)),
        ]);
        // Sort episodes by episode_number just in case
        const sorted = [...epResponse.data].sort(
          (a, b) => a.episode_number - b.episode_number,
        );
        setEpisodes(sorted);
        setVideo(videoData);
      } catch (err) {
        console.error("Failed to fetch series details:", err);
        setError("Failed to load episodes list.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  // Comments load separately so a failure here never blocks the episode list.
  useEffect(() => {
    const fetchComments = async () => {
      if (!videoId) return;
      try {
        setLoadingComments(true);
        const res = await commentApi.listByVideo(Number(videoId), { page: 1, limit: 20 });
        setComments(res.data);
        setCommentTotal(res.total);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [videoId]);

  const handlePlay = (episodeId?: number) => {
    const target = episodeId ?? episodes[0]?.episode_id;
    if (!target) {
      toast.error("No episodes available yet.");
      return;
    }
    navigate(`/play/${videoId}/${target}`);
  };

  const handleCommentSubmit = async () => {
    const text = newComment.trim();
    if (!text || !videoId) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      setPosting(true);
      await commentApi.create(Number(videoId), { comment_text: text });
      setNewComment("");
      const res = await commentApi.listByVideo(Number(videoId), { page: 1, limit: 20 });
      setComments(res.data);
      setCommentTotal(res.total);
      toast.success("Comment posted!");
    } catch (err) {
      console.error("Failed to post comment:", err);
      toast.error("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial">
        <Spinner size={48} className="text-primary" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="p-8 text-center h-screen text-ocean-text-primary-light dark:text-ocean-text-primary-dark flex flex-col items-center justify-center bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial">
        <h2 className="mb-4 font-extrabold text-2xl text-danger">
          {error || "Series not found"}
        </h2>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const thumbnail = video.thumbnail_url || (video as any).thumbnailUrl;
  const description = video.description?.trim();
  const isLongDescription = (description?.length ?? 0) > 220;
  const visibleDescription =
    !isLongDescription || showFullDescription
      ? description
      : `${description?.slice(0, 220)}...`;

  return (
    <div className="min-h-screen pb-32 md:pb-16 bg-ocean-background-light dark:bg-ocean-background-dark text-ocean-text-primary-light dark:text-ocean-text-primary-dark bg-ocean-radial bg-fixed">
      {/* App bar */}
      <div className="sticky top-0 z-[100] flex items-center gap-3 border-b border-ocean-border-light dark:border-ocean-border-dark bg-ocean-background-light/85 dark:bg-ocean-background-dark/85 px-4 md:px-10 py-3 backdrop-blur-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10 transition-colors hover:bg-primary/15 hover:text-primary"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <p className="min-w-0 flex-1 truncate font-extrabold tracking-tight">
          {video.title}
        </p>
        <span className="hidden shrink-0 text-sm font-extrabold uppercase tracking-wide text-primary sm:block">
          Ocean Drama
        </span>
      </div>

      {/* Hero */}
      <div className="relative">
        {/* Backdrop layer, fades into the page background behind the hero content. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] md:h-[420px] overflow-hidden">
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover opacity-25"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ocean-background-light/70 to-ocean-background-light dark:via-ocean-background-dark/70 dark:to-ocean-background-dark" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 md:px-10 pt-8 md:pt-14">
          <div className="flex flex-col gap-6 md:flex-row md:gap-10">
            {/* Poster */}
            <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark shadow-soft md:w-[340px]">
              <img
                src={thumbnail}
                alt={video.title}
                className="aspect-video h-full w-full object-cover"
              />
            </div>

            {/* Meta */}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight">
                {video.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                <span className="flex items-center gap-1.5">
                  <Layers size={15} className="text-primary" />
                  {episodes.length} Episodes
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={15} className="text-primary" />
                  {formatCount(video.view_count)} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart size={15} className="text-primary" />
                  {formatCount(video.like_count)} likes
                </span>
                <Chip
                  size="sm"
                  color={video.is_free ? "success" : "primary"}
                  label={video.is_free ? "FREE" : `${video.currency} ${video.price}`}
                />
              </div>

              {/* Creator */}
              <button
                onClick={() => video.creator?.user_id && navigate(`/creator/${video.creator.user_id}`)}
                className="mt-5 flex items-center gap-3 rounded-xl text-left transition-opacity hover:opacity-80"
              >
                <Avatar src={video.creator?.profile_image} alt={video.creator?.name} size="lg" />
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wide text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                    Created by
                  </span>
                  <span className="block font-extrabold text-primary">
                    {video.creator?.name || "Ocean Drama Original"}
                  </span>
                </span>
              </button>

              {/* Categories and tags */}
              {((video.categories?.length ?? 0) > 0 || (video.tags?.length ?? 0) > 0) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {video.categories?.map((c) => (
                    <Chip key={`c-${c.category_id}`} size="sm" color="default" label={c.name} />
                  ))}
                  {video.tags?.map((t) => (
                    <Chip key={`t-${t.tag_id}`} size="sm" color="default" label={`#${t.name}`} />
                  ))}
                </div>
              )}

              {/* Description */}
              {description && (
                <div className="mt-5 rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-surface-light/70 dark:bg-ocean-surface-dark/70 p-4">
                  <p className="text-sm leading-relaxed opacity-90">{visibleDescription}</p>
                  {isLongDescription && (
                    <button
                      onClick={() => setShowFullDescription((v) => !v)}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary"
                    >
                      {showFullDescription ? "Show less" : "Show more"}
                      {showFullDescription ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  )}
                </div>
              )}

              {/* Primary action */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  startIcon={<Play size={18} />}
                  disabled={episodes.length === 0}
                  onClick={() => handlePlay()}
                >
                  {episodes.length > 0 ? `Play EP ${episodes[0].episode_number}` : "No episodes yet"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="relative mx-auto max-w-[1200px] px-5 md:px-10 pt-12 md:pt-16">
        <SectionHeading icon={<Layers size={18} />} title="Episodes" count={episodes.length} />

        {episodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ocean-border-light dark:border-ocean-border-dark py-16 text-center">
            <p className="font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              No episodes available for this series yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {episodes.map((ep) => (
              <Card
                key={ep.episode_id}
                hoverable
                className="group cursor-pointer overflow-hidden"
                onClick={() => handlePlay(ep.episode_id)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={thumbnail}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={ep.title}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <PlayCircle size={48} className="text-white drop-shadow-lg" />
                  </div>
                  <span className="absolute left-3 top-3 rounded-sm bg-primary px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white">
                    EP {ep.episode_number}
                  </span>
                  {formatDuration(ep.duration) && (
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-sm bg-black/70 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
                      <Clock size={11} />
                      {formatDuration(ep.duration)}
                    </span>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="line-clamp-2 font-extrabold leading-snug">{ep.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="relative mx-auto max-w-[860px] px-5 md:px-10 pt-14 md:pt-20">
        <SectionHeading icon={<MessageCircle size={18} />} title="Comments" count={commentTotal} />

        {/* Composer */}
        {isAuthenticated ? (
          <div className="mb-8 flex gap-3">
            <Avatar src={user?.profile_image} alt={user?.name} size="md" className="mt-1" />
            <div className="min-w-0 flex-1">
              <TextArea
                fullWidth
                rows={3}
                maxLength={COMMENT_MAX}
                placeholder="Share what you thought of this series..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                  {newComment.length}/{COMMENT_MAX}
                </span>
                <div className="flex items-center gap-2">
                  {newComment && (
                    <Button variant="text" color="default" size="sm" onClick={() => setNewComment("")}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    endIcon={<Send size={15} />}
                    loading={posting}
                    disabled={!newComment.trim()}
                    onClick={handleCommentSubmit}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-surface-light/70 dark:bg-ocean-surface-dark/70 p-5">
            <p className="text-sm font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              Sign in to join the conversation.
            </p>
            <Button size="sm" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          </div>
        )}

        {/* List */}
        {loadingComments ? (
          <div className="flex justify-center py-10">
            <Spinner size={28} className="text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ocean-border-light dark:border-ocean-border-dark py-12 text-center">
            <p className="font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              No comments yet. Be the first to say something.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {comments.map((comment) => (
              <div key={comment.comment_id} className="flex gap-3">
                <Avatar src={comment.user_image} alt={comment.user} size="md" className="mt-0.5" />
                <div className="min-w-0 flex-1 rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-surface-light/70 dark:bg-ocean-surface-dark/70 px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-extrabold">{comment.user || "User"}</p>
                    <p className="text-xs font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                      {timeAgo(comment.created_at)}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed opacity-90">
                    {comment.text}
                  </p>
                  {!!comment.reply_count && comment.reply_count > 0 && (
                    <p className="mt-2 text-xs font-bold text-primary">
                      {comment.reply_count} {comment.reply_count === 1 ? "reply" : "replies"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesDetail;
