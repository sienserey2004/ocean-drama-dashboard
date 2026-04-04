import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import Paper from "@mui/material/Paper";
import { videoApi } from "@/app/api/video.service";
import { Episode, Video } from "@/app/types";

const SeriesDetail: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#0B0B0F",
          backgroundImage:
            "radial-gradient(circle at top, rgba(255,45,45,0.15), transparent 70%)",
        }}
      >
        <CircularProgress sx={{ color: "#FF2D2D" }} size={48} />
      </Box>
    );
  }

  if (error || !video) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "#0B0B0F",
          height: "100vh",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "radial-gradient(circle at top, rgba(255,45,45,0.15), transparent 70%)",
        }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 2, fontWeight: 800, color: "#FF2D2D" }}
        >
          {error || "Series not found"}
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: "#FF2D2D",
            color: "white",
            borderRadius: 9999,
            px: 4,
            py: 1.5,
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { bgcolor: "#CC1F1F" },
          }}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#0B0B0F",
        minHeight: "100vh",
        color: "white",
        pb: 12,
        backgroundImage:
          "radial-gradient(circle at top, rgba(255,45,45,0.2), transparent 70%)",
        backgroundAttachment: "fixed",
        fontFamily: "'Inter', 'Poppins', sans-serif",
      }}
    >
      {/* ── Header Area with Logo ──────────────────────────── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: "rgba(11,11,15,0.85)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid #2A2A35",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: "white",
            bgcolor: "rgba(255,255,255,0.08)",
            borderRadius: "12px",
            transition: "all 300ms ease",
            "&:hover": {
              bgcolor: "rgba(255,45,45,0.15)",
              color: "#FF2D2D",
              transform: "scale(1.05)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: "'Oswald', sans-serif",
            textTransform: "uppercase",
            color: "white",
            textShadow: "2px 2px 0px #FF2D2D, 4px 4px 10px rgba(255,45,45,0.4)",
            letterSpacing: "1px",
          }}
        >
          OCEAN DRAMA
        </Typography>
        <Box sx={{ width: 40 }} /> {/* Spacer for centering logo */}
      </Box>

      {/* ── Hero Banner ────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          height: { xs: 300, md: 500 },
          width: "100%",
          mb: -8,
        }}
      >
        <CardMedia
          component="img"
          image={video.thumbnail_url || (video as any).thumbnailUrl}
          sx={{
            height: "100%",
            width: "100%",
            objectFit: "cover",
            opacity: 0.4,
            maskImage:
              "linear-gradient(to bottom, black 50%, transparent 100%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #0B0B0F 0%, transparent 80%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: 100,
            left: { xs: 24, md: 48 },
            right: 24,
            zIndex: 10,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              mb: 2,
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
              fontSize: { xs: "2.5rem", md: "4.5rem" },
              lineHeight: 1.1,
              fontFamily: "'Poppins', sans-serif",
              letterSpacing: "-1.5px",
            }}
          >
            {video.title}
          </Typography>

          <Stack direction="row" spacing={3} alignItems="center">
            <Paper
              elevation={0}
              sx={{
                bgcolor: "rgba(255,45,45,0.15)",
                color: "#FF2D2D",
                px: 2,
                py: 0.5,
                borderRadius: "8px",
                border: "1px solid rgba(255,45,45,0.3)",
                fontWeight: 800,
                fontSize: 14,
                backdropFilter: "blur(10px)",
              }}
            >
              {episodes.length} EPISODES
            </Paper>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="subtitle1"
                sx={{ opacity: 0.7, fontWeight: 700, color: "white" }}
              >
                CREATED BY
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: "#FF2D2D" }}
              >
                {video.creator?.name || "OCEAN DRAMA ORIGINAL"}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* ── Episodes List ──────────────────────────────────── */}
      <Box
        sx={{ px: { xs: 3, md: 6 }, py: 4, position: "relative", zIndex: 20 }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            mb: 4,
            letterSpacing: "-1px",
            color: "white",
            fontFamily: "'Poppins', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 2,
            "&::after": {
              content: '""',
              height: "4px",
              width: "60px",
              bgcolor: "#FF2D2D",
              borderRadius: "2px",
              boxShadow: "0 0 10px #FF2D2D",
            },
          }}
        >
          EPISODE LIST
        </Typography>

        <Grid container spacing={4}>
          {episodes.map((ep) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={ep.episode_id}>
              <Card
                sx={{
                  bgcolor: "rgba(26,26,34,0.7)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                  backdropFilter: "blur(12px)",
                  "&:hover": {
                    bgcolor: "rgba(30,30,40,0.9)",
                    borderColor: "rgba(255,45,45,0.3)",
                    transform: "scale(1.05)",
                    boxShadow:
                      "0 15px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,45,45,0.15)",
                    "& .play-icon": {
                      transform: "scale(1.1)",
                      color: "#FF2D2D",
                      filter: "drop-shadow(0 0 10px rgba(255,45,45,0.6))",
                    },
                  },
                }}
              >
                <CardActionArea
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                  }}
                  onClick={() =>
                    navigate(`../../play/${videoId}/${ep.episode_id}`)
                  }
                >
                  <Box
                    sx={{
                      position: "relative",
                      height: 180,
                      overflow: "hidden",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={video.thumbnail_url || (video as any).thumbnailUrl}
                      sx={{
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 500ms ease",
                        ".MuiCard-root:hover &": { transform: "scale(1.1)" },
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(0,0,0,0.3)",
                        transition: "background-color 0.3s",
                      }}
                    >
                      <PlayCircleFilledIcon
                        className="play-icon"
                        sx={{
                          color: "white",
                          fontSize: 56,
                          opacity: 0.9,
                          transition: "all 300ms ease",
                          filter: "drop-shadow(0 0 15px rgba(0,0,0,0.5))",
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        bgcolor: "rgba(255,45,45,0.9)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "8px",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 4px 10px rgba(255,45,45,0.3)",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 900,
                          color: "white",
                          letterSpacing: "0.5px",
                        }}
                      >
                        EP {ep.episode_number}
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 2.5, color: "white" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                        color: "white",
                        fontFamily: "'Poppins', sans-serif",
                        lineHeight: 1.3,
                      }}
                    >
                      {ep.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#FF2D2D",
                          boxShadow: "0 0 5px #FF2D2D",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.6,
                          fontWeight: 700,
                          color: "white",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {ep.duration
                          ? `${Math.floor(ep.duration / 60)}:${(ep.duration % 60).toString().padStart(2, "0")} MIN`
                          : "PREMIUM CONTENT"}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {episodes.length === 0 && (
          <Box sx={{ py: 15, textAlign: "center", opacity: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#A1A1AA" }}>
              No episodes available for this series yet.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SeriesDetail;
