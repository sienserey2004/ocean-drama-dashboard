import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Avatar,
  Button,
  Divider,
  TextField,
  Card,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HLSPlayer from "@/ocean/components/client/HLSPlayer";
import { episodeApi } from "@/ocean/api/episode.service";
import { videoApi } from "@/ocean/api/video.service";
import { historyApi } from "@/ocean/api/history.service";
import { commentApi, Comment } from "@/ocean/api/comment.service";
import { Episode, Video } from "@/ocean/types";
import toast from "react-hot-toast";

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

  const saveProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

        // Set active episode
        const activeEp = episodeId
          ? eData.data.find((e: Episode) => e.episode_id === Number(episodeId))
          : eData.data[0];

        if (activeEp) {
          console.log("Selected episode:", activeEp);
          setCurrentEpisode(activeEp);
          // Fetch watch progress
          const progress = await historyApi
            .getProgress(activeEp.episode_id)
            .catch(() => ({ currentTime: 0 }));
          setInitialTime(progress.currentTime);
          console.log("Initial playback time:", progress.currentTime);
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
      }, 30000); // Save every 30 seconds
    }
    return () => {
      if (saveProgressTimer.current) clearInterval(saveProgressTimer.current);
    };
  }, [currentEpisode, isPlaying]);

  const saveProgress = async () => {
    if (currentEpisode) {
      // Logic for saving progress...
    }
  };

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
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#0F0F0F",
        }}
      >
        <CircularProgress sx={{ color: "#FE2C55" }} size={60} />
      </Box>
    );
  }

  if (!currentEpisode || !video) return null;

  return (
    <Box
      sx={{
        bgcolor: "#0F0F0F",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <Grid container spacing={0}>
        {/* Main Section (Player + Info + Comments) */}
        <Grid item xs={12} lg={9}>
          {/* AppBar */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              top: 0,
              zIndex: 200,
              bgcolor: 'rgba(15,15,15,0.92)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Toolbar sx={{ gap: 1.5 }}>
              <IconButton
                edge="start"
                onClick={() => navigate(-1)}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                }}
                size="small"
              >
                <ArrowBackIcon />
              </IconButton>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="900"
                  noWrap
                  sx={{ color: 'white', lineHeight: 1.2 }}
                >
                  {video?.title ?? 'Series'}
                </Typography>
                {currentEpisode && (
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: '#FE2C55', fontWeight: 700, display: 'block' }}
                  >
                    EP {currentEpisode.episode_number}: {currentEpisode.title}
                  </Typography>
                )}
              </Box>
            </Toolbar>
          </AppBar>
          <Box
            sx={{
              position: { xs: "static", lg: "sticky" },
              top: { lg: 0 },
              zIndex: 100,
            }}
          >
            {(currentEpisode.full_video_url || currentEpisode.preview_video_url) ? (
              <HLSPlayer
                url={currentEpisode.has_access && currentEpisode.full_video_url ? currentEpisode.full_video_url : currentEpisode.preview_video_url}
                startTime={initialTime}
                onEnded={() => {
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
              <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="rgba(255,255,255,0.4)" fontWeight={700}>🎬 Video source not available yet</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* Episode Info */}
            <Typography variant="h5" fontWeight="900" sx={{ mb: 1 }}>
              EP {currentEpisode.episode_number}: {currentEpisode.title}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Avatar
                src={video.creator?.profile_image}
                sx={{ width: 48, height: 48 }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {video.creator?.name || "OceanDrama Original"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Series: {video.title}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined"
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.2)",
                  borderRadius: 50,
                  px: 3,
                }}
              >
                Subscribe
              </Button>
            </Stack>

            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.05)",
                p: 2,
                borderRadius: 3,
                mb: 4,
              }}
            >
              <Typography
                variant="body2"
                sx={{ lineHeight: 1.6, opacity: 0.9 }}
              >
                {showFullDescription
                  ? video.description
                  : video.description?.substring(0, 150) +
                    ((video.description?.length ?? 0) > 150 ? "..." : "")}
              </Typography>
              {video.description && (video.description?.length ?? 0) > 150 && (
                <Button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  sx={{
                    color: "#FE2C55",
                    fontWeight: "bold",
                    textTransform: "none",
                    mt: 1,
                    p: 0,
                  }}
                  endIcon={
                    showFullDescription ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )
                  }
                >
                  {showFullDescription ? "Show less" : "Show more"}
                </Button>
              )}
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 4 }} />

            {/* Comments Section */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              {comments.length} Comments
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
              <Avatar sx={{ width: 40, height: 40 }} />
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{
                    "& .MuiInput-underline:before": {
                      borderBottomColor: "rgba(255,255,255,0.2)",
                    },
                    "& input": { color: "white" },
                  }}
                />
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim()}
                    endIcon={<SendIcon />}
                    sx={{ color: "#FE2C55", fontWeight: "bold" }}
                  >
                    Post
                  </Button>
                </Stack>
              </Box>
            </Stack>

            <Stack spacing={3}>
              {comments.map((comment) => (
                <Stack key={comment.comment_id} direction="row" spacing={2}>
                  <Avatar
                    src={comment.user_image}
                    sx={{ width: 40, height: 40 }}
                  />
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {comment.user || "User"}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.5 }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                      {comment.text}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Grid>

        {/* Sidebar (Episode List) */}
        <Grid item xs={12} lg={3}>
          <Box
            sx={{
              p: 2,
              maxHeight: { lg: "calc(100vh - 64px)" },
              overflowY: { xs: "visible", lg: "auto" },
              borderLeft: { lg: "1px solid rgba(255,255,255,0.1)" },
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, px: 1 }}>
              Up Next
            </Typography>

            <Stack spacing={1}>
              {episodes.map((ep) => {
                const isActive = ep.episode_id === currentEpisode?.episode_id;
                return (
                  <Card
                    key={ep.episode_id}
                    onClick={() => handleEpisodeSelect(ep)}
                    sx={{
                      display: "flex",
                      bgcolor: isActive
                        ? "rgba(254,44,85,0.15)"
                        : "transparent",
                      color: "white",
                      border: isActive
                        ? "1px solid #FE2C55"
                        : "1px solid transparent",
                      cursor: "pointer",
                      borderRadius: 2,
                      transition: "all 0.2s",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: isActive
                          ? "rgba(254,44,85,0.2)"
                          : "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        aspectRatio: "16/9",
                        position: "relative",
                        borderRadius: 1,
                        overflow: "hidden",
                        m: 1,
                      }}
                    >
                      <img
                        src={video.thumbnail_url || (video as any).thumbnailUrl}
                        alt={ep.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {isActive && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PlayCircleFilledIcon sx={{ color: "#FE2C55" }} />
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        p: 1,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#FE2C55", fontWeight: "bold" }}
                      >
                        Episode {ep.episode_number}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: isActive ? "900" : "bold",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.2,
                        }}
                      >
                        {ep.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.5, mt: 0.5 }}
                      >
                        {ep.duration
                          ? `${Math.floor(ep.duration / 60)}:00`
                          : "24:00"}
                      </Typography>
                    </Box>
                  </Card>
                );
              })}
            </Stack>

            <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.1)" }} />

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, px: 1 }}>
              Related Content
            </Typography>
            <Grid container spacing={2}>
              {/* Dummy related cards */}
              {[1, 2].map((i) => (
                <Grid item xs={6} lg={12} key={i}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <Box sx={{ aspectRatio: "16/9", bgcolor: "#333" }} />
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 1, fontWeight: "bold" }}
                    >
                      Recommended Series {i}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeriesPlayerPage;
