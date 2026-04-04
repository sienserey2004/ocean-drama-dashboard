import React, { useRef, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { IconButtonProps } from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import CommentIcon from "@mui/icons-material/Comment";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { Drawer, TextField, CircularProgress } from "@mui/material";
import { engagementApi } from "@/app/api/engagement.service";
import { commentApi, Comment } from "@/app/api/comment.service";
import { useAuthStore } from "@/app/stores/authStore";
import toast from "react-hot-toast";

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
}

const InteractionButton = (props: IconButtonProps) => (
  <IconButton
    {...props}
    sx={{
      color: "white",
      p: 1.2,
      mb: 0.5,
      bgcolor: "rgba(20, 20, 26, 0.6)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      transition: "all 300ms ease",
      "&:hover": {
        bgcolor: "rgba(255, 45, 45, 0.2)",
        borderColor: "rgba(255, 45, 45, 0.4)",
        boxShadow: "0 0 20px rgba(255, 45, 45, 0.4)",
        transform: "scale(1.1)",
      },
      "& svg": {
        fontSize: 28,
      },
      ...props.sx,
    }}
  />
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
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Play / pause when active changes
  useEffect(() => {
    if (!videoRef.current) return;
    if (active) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [active]);

  // Apply volume imperatively (avoids remounting video element)
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = muted;
    videoRef.current.volume = volume;
  }, [muted, volume]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch((error) => {
        if (error.name !== "AbortError")
          console.error("Video play failed:", error);
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        scrollSnapAlign: "start",
        position: "relative",
        bgcolor: "#0B0B0F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
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
      {/* Video Background */}
      <video
        ref={videoRef}
        loop
        playsInline
        style={{ height: "100%", width: "100%", objectFit: "cover" }}
        key={videoUrl}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {!isPlaying && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <PlayArrowIcon sx={{ fontSize: 80, color: "white", opacity: 0.5 }} />
        </Box>
      )}

      {/* Heart Animations */}
      {heartLikes.map((heart) => (
        <FavoriteIcon
          key={heart.id}
          sx={{
            position: "fixed",
            left: heart.x - 40,
            top: heart.y - 40,
            fontSize: 80,
            color: "#FF2D2D",
            zIndex: 100,
            filter: "drop-shadow(0 0 20px rgba(255, 45, 45, 0.6))",
            animation: "heartPop 0.8s ease-out forwards",
            pointerEvents: "none",
            "@keyframes heartPop": {
              "0%": { transform: "scale(0) rotate(-20deg)", opacity: 0 },
              "20%": { transform: "scale(1.2) rotate(0deg)", opacity: 1 },
              "80%": { transform: "scale(1) rotate(0deg)", opacity: 0.8 },
              "100%": { transform: "scale(1.5) rotate(20deg)", opacity: 0 },
            },
          }}
        />
      ))}

      {/* Bottom Gradient Overlay */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40%",
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Episode List Button */}
      <Button
        variant="contained"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`episodes/${video.videoId}`, { state: { video } });
        }}
        sx={{
          position: "absolute",
          bottom: { xs: 90, md: 30 },
          zIndex: 30,
          left: 20,
          bgcolor: "#FF2D2D",
          borderRadius: 9999,
          px: 4,
          py: 1.5,
          fontWeight: 800,
          textTransform: "none",
          boxShadow: "0 0 20px rgba(255, 45, 45, 0.4)",
          transition: "all 300ms ease",
          "&:hover": {
            bgcolor: "#CC1F1F",
            boxShadow: "0 0 30px rgba(255, 45, 45, 0.6)",
            transform: "translateY(-2px)",
          },
        }}
      >
        Buy Full Season
      </Button>

      {/* Content Bottom Info */}
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: 140, md: 90 },
          left: 20,
          right: 80,
          zIndex: 10,
          color: "white",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            fontWeight="900"
            sx={{
              letterSpacing: "0.05em",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            @{username}
          </Typography>
          <CheckCircleIcon sx={{ fontSize: 16, color: "#FF2D2D" }} />
        </Stack>
        <Typography
          variant="body1"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.4,
            mb: 2,
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {description}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ opacity: 0.8 }}
        >
          <MusicNoteIcon sx={{ fontSize: 16 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, letterSpacing: "0.02em" }}
          >
            {music}
          </Typography>
        </Stack>
      </Box>

      {/* Right Side Buttons */}
      <Stack
        spacing={2.5}
        alignItems="center"
        sx={{
          position: "absolute",
          bottom: { xs: 150, md: 100 },
          right: 15,
          zIndex: 10,
        }}
      >
        {/* Profile */}
        <Box position="relative" sx={{ mb: 2 }}>
          <Avatar
            src={profilePic}
            sx={{
              width: 52,
              height: 52,
              border: "2px solid white",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              transition: "all 300ms ease",
              cursor: "pointer",
              "&:hover": { transform: "scale(1.1)" },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: "#FF2D2D",
              borderRadius: "50%",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              border: "2px solid #0B0B0F",
              boxShadow: "0 0 10px rgba(255, 45, 45, 0.4)",
            }}
          >
            +
          </Box>
        </Box>

        <Box textAlign="center">
          <InteractionButton onClick={handleLike}>
            <FavoriteIcon sx={{ color: liked ? "#FF2D2D" : "white" }} />
          </InteractionButton>
          <Typography
            variant="caption"
            fontWeight="800"
            sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
          >
            {likeCount}
          </Typography>
        </Box>

        <Box textAlign="center">
          <InteractionButton onClick={handleCommentClick}>
            <CommentIcon />
          </InteractionButton>
          <Typography
            variant="caption"
            fontWeight="800"
            sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
          >
            {commentCountState}
          </Typography>
        </Box>

        <Box textAlign="center">
          <InteractionButton onClick={handleFavorite}>
            <BookmarkIcon sx={{ color: favorited ? "#FFD700" : "white" }} />
          </InteractionButton>
          <Typography
            variant="caption"
            fontWeight="800"
            sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
          >
            {favoriteCount}
          </Typography>
        </Box>

        <Box textAlign="center">
          <InteractionButton
            onClick={(e) => {
              e.stopPropagation();
              toast.success("Link copied!");
            }}
          >
            <ShareIcon />
          </InteractionButton>
          <Typography
            variant="caption"
            fontWeight="800"
            sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
          >
            {shares}
          </Typography>
        </Box>

        {/* Spinning Music Record */}
        <Box
          sx={{
            mt: 2,
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "#1A1A22",
            backgroundImage: `url(${profilePic})`,
            backgroundSize: "cover",
            border: "8px solid #14141A",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            animation: "spin 4s linear infinite",
            "@keyframes spin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(360deg)" },
            },
          }}
        />
      </Stack>

      {/* Comments Drawer */}
      <Drawer
        anchor="bottom"
        open={showComments}
        onClose={() => setShowComments(false)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            height: "70%",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            bgcolor: "rgba(20, 20, 26, 0.95)",
            backdropFilter: "blur(20px)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderBottom: "none",
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Typography
              variant="h6"
              fontWeight="800"
              sx={{ letterSpacing: "-0.5px" }}
            >
              {commentCountState} Comments
            </Typography>
            <IconButton
              onClick={() => setShowComments(false)}
              sx={{
                color: "white",
                bgcolor: "rgba(255,255,255,0.05)",
                "&:hover": {
                  bgcolor: "rgba(255,45,45,0.1)",
                  color: "#FF2D2D",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          <Box sx={{ flex: 1, overflowY: "auto", mb: 2, px: 0.5 }}>
            {loadingComments ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={28} sx={{ color: "#FF2D2D" }} />
              </Box>
            ) : commentList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8, opacity: 0.5 }}>
                <CommentIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography fontWeight="600">No comments yet</Typography>
                <Typography variant="body2">
                  Be the first to share your thoughts!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {commentList.map((c) => (
                  <Box key={c.comment_id}>
                    <Stack direction="row" spacing={2}>
                      <Avatar
                        src={c.user_image}
                        sx={{
                          width: 40,
                          height: 40,
                          border: "1.5px solid rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: "white", fontSize: 14, fontWeight: 700 }}
                        >
                          {c.user || "Anonymous"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ lineHeight: 1.5, mt: 0.5, color: "#E5E7EB" }}
                        >
                          {c.text}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={3}
                          sx={{ mt: 1.5 }}
                          alignItems="center"
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: "#A1A1AA", fontWeight: 500 }}
                          >
                            {new Date(c.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#A1A1AA",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": { color: "#FF2D2D" },
                            }}
                            onClick={() => {
                              setReplyingTo(c);
                              setNewComment(`@${c.user} `);
                            }}
                          >
                            Reply
                          </Typography>
                        </Stack>

                        {/* Replies Section */}
                        {(c.reply_count || 0) > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#FF2D2D",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                "&:hover": { opacity: 0.8 },
                              }}
                              onClick={() => toggleReplies(c.comment_id)}
                            >
                              <Box
                                sx={{
                                  width: 24,
                                  height: 1.5,
                                  bgcolor: "#FF2D2D",
                                  opacity: 0.3,
                                }}
                              />
                              {expandedReplies[c.comment_id]
                                ? "Hide replies"
                                : `View ${c.reply_count} replies`}
                            </Typography>

                            {expandedReplies[c.comment_id] && (
                              <Stack
                                spacing={2.5}
                                sx={{
                                  mt: 2.5,
                                  ml: 1,
                                  borderLeft: "2px solid rgba(255,45,45,0.1)",
                                  pl: 2,
                                }}
                              >
                                {expandedReplies[c.comment_id].map((reply) => (
                                  <Stack
                                    key={reply.comment_id}
                                    direction="row"
                                    spacing={1.5}
                                  >
                                    <Avatar
                                      src={reply.user_image}
                                      sx={{ width: 28, height: 24 }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{
                                          color: "white",
                                          fontSize: 13,
                                          fontWeight: 700,
                                        }}
                                      >
                                        {reply.user || "Anonymous"}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          lineHeight: 1.5,
                                          fontSize: 13,
                                          color: "#E5E7EB",
                                        }}
                                      >
                                        {reply.text}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={2}
                                        sx={{ mt: 1 }}
                                        alignItems="center"
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: "#A1A1AA",
                                            fontSize: 11,
                                          }}
                                        >
                                          {new Date(
                                            reply.created_at,
                                          ).toLocaleDateString()}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: "#A1A1AA",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            fontSize: 11,
                                            "&:hover": { color: "#FF2D2D" },
                                          }}
                                          onClick={() => {
                                            setReplyingTo(c);
                                            setNewComment(`@${reply.user} `);
                                          }}
                                        >
                                          Reply
                                        </Typography>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                ))}
                              </Stack>
                            )}

                            {loadingReplies[c.comment_id] && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  py: 1,
                                }}
                              >
                                <CircularProgress
                                  size={18}
                                  sx={{ color: "#FF2D2D" }}
                                />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ pt: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Avatar
              src={user?.profile_image}
              sx={{
                width: 40,
                height: 40,
                border: "1.5px solid rgba(255,45,45,0.2)",
              }}
            />
            <TextField
              fullWidth
              autoFocus={!!replyingTo}
              size="small"
              placeholder={
                replyingTo
                  ? `Reply to @${replyingTo.user}...`
                  : "Add a comment..."
              }
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (!e.target.value && replyingTo) setReplyingTo(null);
              }}
              onKeyPress={(e) => e.key === "Enter" && handlePostComment()}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  color: "white",
                  fontWeight: 500,
                  transition: "all 0.3s",
                  "& fieldset": {
                    border: "1px solid rgba(255,255,255,0.1)",
                  },
                  "&:hover fieldset": { borderColor: "rgba(255,45,45,0.3)" },
                  "&.Mui-focused fieldset": { borderColor: "#FF2D2D" },
                },
              }}
            />
            <IconButton
              onClick={handlePostComment}
              disabled={!newComment.trim() || isPostingComment}
              sx={{
                color: "#FF2D2D",
                bgcolor: "rgba(255,45,45,0.1)",
                "&:hover": { bgcolor: "rgba(255,45,45,0.2)" },
                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.2)",
                  bgcolor: "transparent",
                },
              }}
            >
              {isPostingComment ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
};

export default VideoCard;
