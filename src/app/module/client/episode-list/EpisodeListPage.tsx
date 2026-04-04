import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Dialog,
  Avatar,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import IosShareIcon from "@mui/icons-material/IosShare";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import toast from "react-hot-toast";
import { episodeApi } from "@/app/api/episode.service";
import { videoApi } from "@/app/api/video.service";
import { paymentApi } from "@/app/api/payment.service";
import { Episode } from "@/app/types";
import QRPaymentCard from "../../shared/QRPaymentCard";

const EpisodeListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { videoId } = useParams();

  const numericVideoId = Number(videoId);

  // The video object is passed via router state from VideoCard
  const [video, setVideo] = useState<any>(location.state?.video || null);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Full screen player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // Payment state
  const [paymentInfo, setPaymentInfo] = useState<{
    qrCode?: string;
    qrString?: string;
    transactionId?: string;
    status?: string;
  } | null>(null);

  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchEpisodes = async (id: number) => {
    if (!id) {
      console.error("videoId is missing");
      return;
    }
    const res = await episodeApi.list(id, { page: 1, limit: 100 });
    const sortedEpisodes = [...res.data].sort(
      (a, b) => a.episode_number - b.episode_number,
    );
    setEpisodes(sortedEpisodes);
  };

  useEffect(() => {
    if (!numericVideoId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        if (!video) {
          try {
            const videoData = await videoApi.getById(numericVideoId);
            setVideo(videoData);
          } catch (e) {
            console.error("Failed to fetch video missing from state", e);
          }
        }

        await fetchEpisodes(numericVideoId);
      } catch (err: any) {
        console.error("Failed to fetch episodes", err);
        setError("Could not load episodes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [numericVideoId]);

  // Derived filtered episodes based on Tabs
  const displayedEpisodes = episodes.filter((ep) => {
    if (tabIndex === 1)
      return ep.has_access || ep.title.toLowerCase().includes("free");
    if (tabIndex === 2) return !ep.has_access;
    return true;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")} min`;
  };

  const handleEpisodeClick = (ep: Episode) => {
    if (ep.has_access) {
      setActiveVideoUrl(ep.full_video_url || ep.preview_video_url);
      setPlayerOpen(true);
    } else {
      // Locked -> open purchase modal
      setModalOpen(true);
    }
  };

  const startVerifyPolling = (transactionId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await paymentApi.verify(transactionId);

        if (res.status === "completed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setEpisodes((prev) =>
            prev.map((ep) => ({ ...ep, has_access: true })),
          );
          toast.success("Payment verified! Redirecting to your library...", {
            duration: 3000,
          });

          setModalOpen(false);
          setPaymentInfo(null);

          // Redirect to the newly purchased series
          setTimeout(() => {
            navigate(`/viewer/library/${numericVideoId}`, { replace: true });
          }, 1500);
        }
      } catch (err: any) {
        if (err.response?.status !== 400) {
          console.error("Verification error:", err.message);
        }
      }
    }, 5000);
  };

  const handlePurchase = async (vidId: number) => {
    try {
      setPurchasing(true);
      const res = await paymentApi.initiate({
        amount: video.price,
        video_id: vidId,
      });

      setPaymentInfo({
        qrCode: res.qr_code,
        qrString: res.qr_string,
        transactionId: res.transaction_id,
        status: res.status,
      });

      // Start polling for verification
      startVerifyPolling(res.transaction_id);
      toast("Payment initiated. Scan the QR code to pay.");
    } catch (err: any) {
      console.error("Initiation failed:", err);
      toast.error(
        err.response?.data?.message ||
          "Payment initiation failed. Please try again.",
      );
    } finally {
      setPurchasing(false);
    }
  };

  if (!video) return null;

  return (
    <Box
      sx={{
        bgcolor: "#0B0B0F",
        minHeight: "100vh",
        color: "white",
        pb: 14, // Extra padding for the sticky bottom button
        backgroundImage:
          "radial-gradient(circle at top, rgba(255,45,45,0.25), transparent 70%)",
        backgroundAttachment: "fixed",
        fontFamily: "'Inter', 'Poppins', sans-serif",
      }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: "rgba(11,11,15,0.85)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid #2A2A35",
          transition: "all 300ms ease",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              transition: "all 300ms ease",
             
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Box sx={{ flex: 1, textAlign: "center", px: 2 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "'Oswald', sans-serif",
                textTransform: "uppercase",
                color: "white",
                textShadow:
                  "2px 2px 0px #FF2D2D, 4px 4px 10px rgba(255,45,45,0.4)",
                letterSpacing: "1px",
              }}
            >
              OCEAN DRAMA
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#A1A1AA",
                fontWeight: 600,
                fontSize: 11,
                display: "block",
                mt: 0.2,
                opacity: 0.8,
              }}
              noWrap
            >
              {video.title}
            </Typography>
          </Box>

          <IconButton
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              transition: "all 300ms ease",
             
            }}
          >
            <IosShareIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* ── Series Info Card ──────────────────────────────────── */}
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: "20px",
            bgcolor: "rgba(20,20,26,0.7)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,45,45,0.5), transparent)",
            },
          }}
        >
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Avatar
              src={video.thumbnail_url || video.thumbnailUrl || undefined}
              variant="rounded"
              sx={{
                width: 110,
                height: 154,
                borderRadius: "16px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
                transition: "transform 300ms ease",
                "&:hover": { transform: "scale(1.05)" },
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 1,
                  fontFamily: "'Poppins', sans-serif",
                  letterSpacing: "-0.5px",
                }}
              >
                {video.title}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: "#A1A1AA" }}
                >
                  {video.creator?.name || "OceanDrama Creator"}
                </Typography>
                <CheckCircleIcon sx={{ fontSize: 16, color: "#FF2D2D" }} />
              </Stack>
              <Stack
                direction="row"
                alignItems="baseline"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: "#FF2D2D",
                    fontWeight: 900,
                    textShadow: "0 0 15px rgba(255,45,45,0.3)",
                  }}
                >
                  {video.price > 0 ? `$${video.price}` : "Free"}
                </Typography>
                {video.price > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#A1A1AA",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                    }}
                  >
                    USD · LIFETIME ACCESS
                  </Typography>
                )}
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  color: "#A1A1AA",
                  display: "block",
                  lineHeight: 1.5,
                  fontSize: 12,
                  opacity: 0.9,
                }}
              >
                Get unlimited access to the entire series with no hidden fees.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            bgcolor: "rgba(20,20,26,0.5)",
            borderRadius: "12px",
            p: 0.5,
            "& .MuiTabs-indicator": {
              display: "none",
            },
            "& .MuiTab-root": {
              color: "#A1A1AA",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 14,
              minHeight: 40,
              borderRadius: "10px",
              transition: "all 300ms ease",
              "&.Mui-selected": {
                color: "#fff !important",
                bgcolor: "#FF2D2D",
                boxShadow: "0 0 15px rgba(255,45,45,0.4)",
              },
            },
          }}
        >
          <Tab label={`All (${episodes.length || 0})`} disableRipple />
          <Tab label="Free" disableRipple />
          <Tab label="Locked" disableRipple />
        </Tabs>
      </Box>

      {/* ── Episode List ──────────────────────────────────────── */}
      <Box sx={{ p: 2 }}>
        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: "#FF2D2D" }} size={40} />
          </Box>
        )}

        {!loading && error && (
          <Typography color="error" textAlign="center" py={8} fontWeight="bold">
            {error}
          </Typography>
        )}

        {!loading && !error && displayedEpisodes.length === 0 && (
          <Box sx={{ textAlign: "center", py: 12, opacity: 0.5 }}>
            <PlayCircleOutlineIcon
              sx={{ fontSize: 60, mb: 2, color: "#FF2D2D" }}
            />
            <Typography fontWeight="bold" sx={{ color: "#A1A1AA" }}>
              No episodes found.
            </Typography>
          </Box>
        )}

        <Stack spacing={2}>
          {displayedEpisodes.map((ep, idx) => (
            <Paper
              key={ep.episode_id}
              elevation={0}
              onClick={() => handleEpisodeClick(ep)}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.5,
                bgcolor: "rgba(26,26,34,0.7)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "rgba(30,30,40,0.9)",
                  borderColor: "rgba(255,45,45,0.3)",
                  transform: "scale(1.05)",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.3), 0 0 20px rgba(255,45,45,0.15)",
                },
                "&:active": {
                  transform: "scale(0.98)",
                },
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 60,
                  bgcolor: "#0B0B0F",
                  borderRadius: "10px",
                  position: "relative",
                  mr: 2,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {(video.thumbnail_url || video.thumbnailUrl) && (
                  <img
                    src={video.thumbnail_url || video.thumbnailUrl}
                    alt="thumb"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.4,
                    }}
                  />
                )}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0,0,0,0.2)",
                  }}
                >
                  {ep.has_access ? (
                    <PlayCircleOutlineIcon
                      sx={{
                        color: "white",
                        fontSize: 28,
                        filter: "drop-shadow(0 0 8px rgba(255,45,45,0.4))",
                      }}
                    />
                  ) : (
                    <LockIcon sx={{ color: "#FF2D2D", fontSize: 22 }} />
                  )}
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    mb: 0.2,
                    fontSize: 15,
                    color: "white",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  EP {ep.episode_number} · {ep.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#A1A1AA",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: 11,
                    }}
                  >
                    {formatDuration(ep.duration)}
                  </Typography>
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      bgcolor: "rgba(255,255,255,0.1)",
                    }}
                  />
                  {ep.has_access ? (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#FF2D2D",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        fontSize: 10,
                        letterSpacing: "0.5px",
                      }}
                    >
                      Unlocked
                    </Typography>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#A1A1AA",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: 10,
                        letterSpacing: "0.5px",
                      }}
                    >
                      Premium
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* ── Sticky Bottom CTA ─────────────────────────────────── */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 3,
          bgcolor: "rgba(11,11,15,0.9)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          fullWidth
          onClick={() => setModalOpen(true)}
          sx={{
            bgcolor: "#FF2D2D",
            color: "white",
            py: 1.8,
            borderRadius: "100px",
            fontSize: 16,
            fontWeight: 800,
            textTransform: "none",
            boxShadow:
              "0 10px 10px rgba(255,45,45,0.4), 0 0 15px rgba(255,45,45,0.2)",
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: "#CC1F1F",
              boxShadow:
                "0 15px 15px rgba(255,45,45,0.6), 0 0 15px rgba(255,45,45,0.3)",
              transform: "translateY(-3px)",
            },
            "&:active": {
              transform: "translateY(-1px)",
            },
          }}
        >
          Unlock Full Series — {video.price > 0 ? `$${video.price}` : "Free"}
        </Button>
      </Box>

      {/* ── Purchase Modal ────────────────────────────────────── */}
      <Dialog
        open={modalOpen}
        onClose={() => {
          if (!purchasing) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setModalOpen(false);
            setPaymentInfo(null);
          }
        }}
        PaperProps={{
          sx: {
            bgcolor: "#14141A",
            color: "white",
            borderRadius: "24px",
            p: 1,
            minWidth: 320,
            border: "1px solid #2A2A35",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            backgroundImage:
              "radial-gradient(circle at top, rgba(255,45,45,0.1), transparent 70%)",
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 4, pb: 2 }}>
          {!paymentInfo ? (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,45,45,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 3,
                  border: "2px solid rgba(255,45,45,0.2)",
                  boxShadow: "0 0 20px rgba(255,45,45,0.1)",
                }}
              >
                <LockIcon sx={{ color: "#FF2D2D", fontSize: 36 }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  fontFamily: "'Poppins', sans-serif",
                  letterSpacing: "-0.5px",
                }}
              >
                Cinematic Pass
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#A1A1AA", mb: 4, px: 2, lineHeight: 1.6 }}
              >
                Get lifetime access to all episodes of{" "}
                <Box component="span" sx={{ color: "white", fontWeight: 700 }}>
                  {video.title}
                </Box>
              </Typography>
            </>
          ) : (
            <Box sx={{ mb: 3 }}>
              <QRPaymentCard
                name={video.creator?.name || "OceanDrama Premium"}
                amount={video.price}
                currency="USD"
                qrValue={paymentInfo.qrString || paymentInfo.qrCode || ""}
              />
            </Box>
          )}

          <Box sx={{ mb: 1 }}>
            <Typography
              variant="h3"
              sx={{
                color: "#FF2D2D",
                fontWeight: 900,
                mb: 0.5,
                letterSpacing: "-1.5px",
                textShadow: "0 0 20px rgba(255,45,45,0.2)",
              }}
            >
              ${video.price}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#A1A1AA",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontSize: 10,
              }}
            >
              {paymentInfo
                ? "Waiting for verification..."
                : "ONE-TIME PAYMENT · UNLIMITED ACCESS"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", p: 4, pt: 2, gap: 2 }}>
          <Button
            onClick={() => {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setModalOpen(false);
              setPaymentInfo(null);
            }}
            disabled={purchasing}
            sx={{
              color: "#A1A1AA",
              fontWeight: 700,
              textTransform: "none",
              px: 3,
              borderRadius: "12px",
              "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
            }}
          >
            Not now
          </Button>
          {!paymentInfo && (
            <Button
              variant="contained"
              onClick={() => handlePurchase(numericVideoId)}
              disabled={purchasing}
              sx={{
                bgcolor: "#FF2D2D",
                color: "white",
                fontWeight: 800,
                px: 4,
                py: 1.5,
                borderRadius: "100px",
                textTransform: "none",
                boxShadow: "0 0 20px rgba(255,45,45,0.3)",
                "&:hover": {
                  bgcolor: "#CC1F1F",
                  boxShadow: "0 0 30px rgba(255,45,45,0.5)",
                  transform: "translateY(-2px)",
                },
                "&:active": { transform: "translateY(0)" },
              }}
            >
              {purchasing ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Unlock Now"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Full Screen Video Player Modal ────────────────────── */}
      <Dialog
        fullScreen
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        PaperProps={{ sx: { bgcolor: "black" } }}
      >
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
            bgcolor: "black",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton
            onClick={() => setPlayerOpen(false)}
            sx={{
              position: "absolute",
              top: 30,
              left: 30,
              zIndex: 100,
              color: "white",
              bgcolor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,45,45,0.2)", color: "#FF2D2D" },
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
          {activeVideoUrl && (
            <video
              src={activeVideoUrl}
              controls
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "100vh",
                objectFit: "contain",
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default EpisodeListPage;
