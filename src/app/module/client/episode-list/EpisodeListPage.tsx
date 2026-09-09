import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, PlayCircle, Lock, CheckCircle, Coins } from "lucide-react";
import toast from "@/app/utils/toast";
import { episodeApi } from "@/app/api/episode.service";
import { videoApi } from "@/app/api/video.service";
import { paymentApi } from "@/app/api/payment.service";
import { Episode } from "@/app/types";
import QRPaymentCard from "../../shared/QRPaymentCard";
import HLSPlayer from "../library/components/HLSPlayer";
import { useAuthStore } from "@/app/stores/authStore";
import { coinApi } from "@/app/api/coin.service";
import { coinsBalance } from "../Coins/services/balance.service";
import { Button, IconButton, Card, CardContent, Spinner, Modal, ModalBody } from "@/_ocean/ui";

interface EpisodeListPageProps {
  videoIdProp?: string;
  onClose?: () => void;
  /** Skip the episode list and jump straight into the purchase modal (used by the reel's "Buy Full Season" button) */
  autoOpenPurchase?: boolean;
}

const EpisodeListPage: React.FC<EpisodeListPageProps> = ({ videoIdProp, onClose, autoOpenPurchase }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { videoId: paramVideoId } = useParams();
  const videoId = videoIdProp || paramVideoId;
  const { user, isAuthenticated } = useAuthStore();
  const [userCoins, setUserCoins] = useState(0);

  const numericVideoId = Number(videoId);

  // The video object is passed via router state from VideoCard
  const [video, setVideo] = useState<any>(location.state?.video || null);
  console.log("Current video state:", video);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(!!autoOpenPurchase);
  const [purchasing, setPurchasing] = useState(false);

  // Full screen player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [activeVideoType, setActiveVideoType] = useState<"preview" | "full">("preview");

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
      return [];
    }
    const res = await episodeApi.list(id, { page: 1, limit: 100 });
    const sortedEpisodes = [...res.data].sort(
      (a, b) => a.episode_number - b.episode_number,
    );
    setEpisodes(sortedEpisodes);
    console.log("Episodes fetched:", sortedEpisodes);
    return sortedEpisodes;
  };

  useEffect(() => {
    if (!numericVideoId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        if (!video || video.price === undefined) {
          try {
            const videoData = await videoApi.getById(numericVideoId);
            console.log("Fetched full video data:", videoData);
            setVideo(videoData);
          } catch (e) {
            console.error("Failed to fetch video missing from state", e);
          }
        }

        if (isAuthenticated) {
          try {
            const balance = await coinsBalance();
            if (balance) setUserCoins(balance.coins);
          } catch (e) {
            console.error("Failed to fetch user coins", e);
          }
        }

        const fetched = await fetchEpisodes(numericVideoId);
        if (autoOpenPurchase && fetched.length > 0 && fetched.every((ep) => ep.has_access)) {
          // Nothing left to buy — series is already fully unlocked
          setModalOpen(false);
        }
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
    setActiveEpisode(ep);
    if (ep.has_access) {
      setActiveVideoType("full");
      setPlayerOpen(true);
    } else {
      // Locked -> can still watch preview
      setActiveVideoType("preview");
      setPlayerOpen(true);
    }
  };

  const openPurchaseModal = (ep: Episode) => {
    setActiveEpisode(ep);
    setModalOpen(true);
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
          videoApi.clearCache();
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
        amount: Number(video.price) || 0,
        currency: 'USD',
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
  const handleUnlockWithCoins = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to unlock with coins");
      navigate('/login');
      return;
    }

    const coinPrice = Math.round((Number(video.price) || 0) * 10000);

    if (userCoins < coinPrice) {
      toast.error(`Insufficient coins! You need ${coinPrice.toLocaleString()} coins.`);
      return;
    }

    if (!window.confirm(`Unlock this entire series for ${coinPrice.toLocaleString()} coins?`)) return;

    try {
      setPurchasing(true);
      const res = await coinApi.unlockVideo(numericVideoId, coinPrice);
      toast.success(res.data?.message || "Video unlocked successfully!");

      // Update local state
      setEpisodes(prev => prev.map(ep => ({ ...ep, has_access: true })));
      videoApi.clearCache();

      // Refresh balance
      const balance = await coinsBalance();
      if (balance) setUserCoins(balance.coins);

      setModalOpen(false);

      // Redirect or refresh
      setTimeout(() => {
        navigate(`/viewer/library/${numericVideoId}`, { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error("Unlock failed:", err);
      toast.error(err.response?.data?.message || "Failed to unlock with coins");
    } finally {
      setPurchasing(false);
    }
  };

  const closePurchaseModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setModalOpen(false);
    setPaymentInfo(null);
  };

  if (!video) return null;

  return (
    <div className="min-h-screen bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial bg-fixed pb-[calc(var(--tab-bar-h)+112px)] text-ocean-text-primary-light dark:text-ocean-text-primary-dark md:pb-28">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-[100] border-b border-ocean-border-light dark:border-ocean-border-dark bg-ocean-background-light/85 dark:bg-ocean-background-dark/85 backdrop-blur-2xl transition-all duration-300">
        <div className="flex items-center justify-between p-4">
          <IconButton
            plain
            onClick={() => (onClose ? onClose() : navigate(-1))}
            className="rounded-xl bg-black/5 text-ocean-text-primary-light dark:bg-white/10 dark:text-ocean-text-primary-dark"
          >
            <ArrowLeft size={18} />
          </IconButton>

          <div className="flex-1 px-2 text-center">
            <p
              className="text-sm font-extrabold uppercase tracking-wide text-ocean-text-primary-light [text-shadow:2px_2px_0px_#0EA5E9] dark:text-ocean-text-primary-dark"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              OCEAN DRAMA
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-ocean-text-secondary-light opacity-80 dark:text-ocean-text-secondary-dark">
              {video.title}
            </p>
          </div>

          <IconButton
            plain
            className="rounded-xl bg-black/5 text-ocean-text-primary-light dark:bg-white/10 dark:text-ocean-text-primary-dark"
          >
            <Share2 size={18} />
          </IconButton>
        </div>
      </div>

      {/* ── Series Info Card ──────────────────────────────────── */}
      <div className="p-3">
        <Card>
          <CardContent className="flex items-start gap-4">
            <div className="h-[154px] w-[110px] shrink-0 overflow-hidden rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-background-light dark:bg-ocean-background-dark shadow-soft">
              {(video.thumbnail_url || video.thumbnailUrl) && (
                <img
                  src={video.thumbnail_url || video.thumbnailUrl}
                  alt={video.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="mb-1 text-xl font-extrabold leading-tight tracking-tight text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                {video.title}
              </h1>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-sm font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                  {video.creator?.name || "OceanDrama Creator"}
                </span>
                <CheckCircle size={16} className="text-primary" />
              </div>
              <div className="mb-1.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-primary [text-shadow:0_0_15px_rgba(14,165,233,0.3)]">
                  {video.price > 0 ? `$${video.price}` : "Free"}
                </span>
                {video.price > 0 && (
                  <span className="text-[11px] font-bold tracking-wide text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                    USD · LIFETIME ACCESS
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-ocean-text-secondary-light opacity-90 dark:text-ocean-text-secondary-dark">
                Get unlimited access to the entire series with no hidden fees.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="mb-1 px-4">
        <div className="flex gap-1 rounded-xl bg-ocean-card-light dark:bg-ocean-card-dark p-1">
          {[`All (${episodes.length || 0})`, "Free", "Locked"].map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setTabIndex(idx)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all duration-300 ${
                tabIndex === idx
                  ? "bg-primary text-white shadow-glow"
                  : "text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Episode List ──────────────────────────────────────── */}
      <div className="p-2">
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size={40} className="text-primary" />
          </div>
        )}

        {!loading && error && (
          <p className="py-16 text-center font-bold text-danger">{error}</p>
        )}

        {!loading && !error && displayedEpisodes.length === 0 && (
          <div className="py-24 text-center opacity-50">
            <PlayCircle size={60} className="mx-auto mb-2 text-primary" />
            <p className="font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              No episodes found.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {displayedEpisodes.map((ep) => (
            <div
              key={ep.episode_id}
              onClick={() => handleEpisodeClick(ep)}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-card-light dark:bg-ocean-card-dark p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft active:scale-[0.98]"
            >
              <div className="relative h-[60px] w-[100px] shrink-0 overflow-hidden rounded-xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-background-light dark:bg-ocean-background-dark">
                {(video.thumbnail_url || video.thumbnailUrl) && (
                  <img
                    src={video.thumbnail_url || video.thumbnailUrl}
                    alt="thumb"
                    className="h-full w-full object-cover opacity-40"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  {ep.has_access ? (
                    <PlayCircle size={28} className="text-white drop-shadow" />
                  ) : (
                    <Lock size={22} className="text-primary" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 truncate text-[15px] font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                  EP {ep.episode_number} · {ep.title}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                    {formatDuration(ep.duration)}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-ocean-border-light dark:bg-ocean-border-dark" />
                  {ep.has_access ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-primary">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                      Premium
                    </span>
                  )}
                </div>
              </div>

              {!ep.has_access && (
                <Button
                  size="sm"
                  variant="outlined"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPurchaseModal(ep);
                  }}
                >
                  Buy
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky Bottom CTA ─────────────────────────────────── */}
      {/* Sits above the floating tab bar on mobile (--tab-bar-h, index.css); the
          bar is md:hidden, so on desktop the CTA drops back to the bottom edge. */}
      <div className="fixed inset-x-0 bottom-[var(--tab-bar-h)] z-[1000] flex justify-center border-t border-ocean-border-light dark:border-ocean-border-dark bg-ocean-background-light/90 dark:bg-ocean-background-dark/90 p-4 backdrop-blur-2xl md:bottom-0">
        <Button fullWidth size="lg" color="primary" onClick={() => setModalOpen(true)}>
          Unlock Full Series — {video.price > 0 ? `$${video.price}` : "Free"}
        </Button>
      </div>

      {/* ── Purchase Modal ────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!purchasing) closePurchaseModal();
        }}
        maxWidth="sm"
      >
        <ModalBody className="max-h-[85vh] overflow-y-auto px-6 pb-4 pt-8 text-center">
          {!paymentInfo ? (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/15 shadow-glow">
                <Lock size={36} className="text-primary" />
              </div>
              <h3 className="mb-1 text-xl font-extrabold tracking-tight text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                Cinematic Pass
              </h3>
              <p className="mb-6 px-2 text-sm leading-relaxed text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                Get lifetime access to all episodes of{" "}
                <span className="font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                  {video.title}
                </span>
              </p>
            </>
          ) : (
            <div className="mb-3">
              <QRPaymentCard
                name={video.creator?.name || "OceanDrama Premium"}
                amount={video.price}
                currency="USD"
                qrValue={paymentInfo.qrString || paymentInfo.qrCode || ""}
              />
            </div>
          )}

          <div className="mb-1">
            <p className="mb-0.5 text-3xl font-black tracking-tight text-primary">
              ${video.price}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              {paymentInfo
                ? "Waiting for verification..."
                : "ONE-TIME PAYMENT · UNLIMITED ACCESS"}
            </p>
          </div>
        </ModalBody>

        <div className="flex flex-col gap-3 px-6 pb-6 pt-2">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="text"
              color="default"
              fullWidth
              disabled={purchasing}
              onClick={closePurchaseModal}
            >
              Not now
            </Button>
            {!paymentInfo && (
              <Button
                type="button"
                color="primary"
                fullWidth
                loading={purchasing}
                onClick={() => handlePurchase(numericVideoId)}
              >
                Pay USD
              </Button>
            )}
          </div>

          {!paymentInfo && (
            <Button
              type="button"
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<Coins size={18} />}
              disabled={purchasing}
              onClick={handleUnlockWithCoins}
            >
              Unlock with {Math.round((Number(video.price) || 0) * 10000).toLocaleString()} Coins
            </Button>
          )}

          {isAuthenticated && !paymentInfo && (
            <p className="text-center text-xs font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              Your Balance: {userCoins.toLocaleString()} Coins
            </p>
          )}
        </div>
      </Modal>

      {/* ── Full Screen Video Player Modal ────────────────────── */}
      {playerOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black">
          <IconButton
            plain
            onClick={() => setPlayerOpen(false)}
            className="absolute left-6 top-6 z-[100] rounded-full border border-white/10 bg-black/60 text-white backdrop-blur hover:bg-primary/20 hover:text-primary"
          >
            <ArrowLeft size={20} />
          </IconButton>

          {activeEpisode && (
            <div className="flex h-full w-full items-center justify-center">
              <HLSPlayer
                key={activeEpisode.episode_id + activeVideoType}
                episodeId={activeEpisode.episode_id}
                url={activeVideoType === 'full' ? activeEpisode.full_video_url : activeEpisode.preview_video_url}
                type={activeVideoType}
                autoPlay
                objectFit="contain"
              />

              {!activeEpisode.has_access && activeVideoType === 'preview' && (
                <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-center">
                  <p className="mb-4 text-sm font-semibold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                    You are watching a preview. Unlock the full series to continue.
                  </p>
                  <Button
                    color="primary"
                    onClick={() => {
                      setPlayerOpen(false);
                      setModalOpen(true);
                    }}
                  >
                    Unlock Full Series
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EpisodeListPage;
