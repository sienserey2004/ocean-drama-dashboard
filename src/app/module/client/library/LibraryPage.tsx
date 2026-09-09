import React, { useState } from "react";
import {
  Star,
  Film,
  Search,
  Play,
  Download,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { videoApi } from "@/app/api/video.service";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "@/app/utils/toast";
import { useAuthStore } from "@/app/stores/authStore";
import {
  Button,
  IconButton,
  Card,
  Chip,
  LinearProgressBar,
  Spinner,
} from "@/_ocean/ui";

// Types
interface Episode {
  /** episode_id — what /play/:videoId/:episodeId resolves against. */
  id: number;
  number: number;
  title: string;
  duration: string;
  watched: boolean;
  progress?: number; // For partially watched episodes
  currentTime?: string;
  totalTime?: string;
}

interface Series {
  id: string;
  title: string;
  categories: string[];
  rating: number;
  episodeCount: number;
  totalDuration: string;
  progressPercentage: number;
  watchedEpisodes: number;
  totalEpisodes: number;
  purchaseDate: string;
  price: string;
  thumbnailGradient: string;
  ownedBadgeText: string;
  ownedBadgeColor: "primary" | "success";
  episodes: Episode[];
  status: "in-progress" | "completed" | "not-started";
}

// Mock Data
const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [purchases, setPurchases] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await videoApi.getPurchases();

      if (!response || !response.data) {
        setPurchases([]);
        return;
      }

      const mappedData: Series[] = response.data.map((p) => {
        const video = (p.video || {}) as any;
        const totalEpisodes = video.episode_count || 0;
        const watchedEpisodes = video.watched_episodes_count || 0;
        const progressPercentage = video.progress_percentage || 0;

        let status: "in-progress" | "completed" | "not-started" = "not-started";
        if (progressPercentage === 100) status = "completed";
        else if (progressPercentage > 0) status = "in-progress";

        return {
          id: String(video.videoId || video.id || "N/A"),
          title: video.title || "Untitled Series",
          categories: video.categories || [],
          rating: 4.5,
          episodeCount: totalEpisodes,
          totalDuration: `~${Math.round((totalEpisodes * 10) / 60)}h total`,
          progressPercentage: progressPercentage,
          watchedEpisodes: watchedEpisodes,
          totalEpisodes: totalEpisodes,
          purchaseDate: p.purchaseDate
            ? format(new Date(p.purchaseDate), "MMM d, yyyy")
            : "Unknown Date",
          price: video.price ? `$${video.price}` : "$0.00",
          thumbnailGradient:
            video.thumbnail_url && video.thumbnail_url.trim() !== ""
              ? `url("${video.thumbnail_url}")`
              : "linear-gradient(135deg,#1a1040,#2d1b69)",
          ownedBadgeText: status === "completed" ? "DONE" : "OWNED",
          ownedBadgeColor: status === "completed" ? "success" : "primary",
          status: status,
          episodes: (video.episodes || []).map((ep: any) => ({
            id: ep.episodeId ?? ep.episode_id ?? 0,
            number: ep.episodeNumber || 0,
            title: ep.title || `Episode ${ep.episodeNumber}`,
            duration: ep.duration
              ? `${Math.floor(ep.duration / 60)}:${String(ep.duration % 60).padStart(2, "0")}`
              : "0:00",
            watched: ep.watch_history?.completed || false,
            progress:
              ep.watch_history && ep.duration
                ? Math.round(
                    (ep.watch_history.watchDuration / ep.duration) * 100,
                  )
                : 0,
            currentTime: ep.watch_history
              ? `${Math.floor(ep.watch_history.watchDuration / 60)}:${String(ep.watch_history.watchDuration % 60).padStart(2, "0")}`
              : "0:00",
            totalTime: ep.duration
              ? `${Math.floor(ep.duration / 60)}:${String(ep.duration % 60).padStart(2, "0")}`
              : "0:00",
          })),
        };
      });

      setPurchases(mappedData);
      console.log("Mapped library data:", mappedData);
    } catch (err) {
      console.error("Failed to fetch library:", err);
      setError("Could not load your library. Please try again later.");
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    } else {
      setLoading(false);
      setError("Please login to view your library.");
    }
  }, [isAuthenticated]);

  // Compute summary statistics
  const totalSeries = purchases.length;
  const totalEpisodes = purchases.reduce(
    (sum, series) => sum + series.totalEpisodes,
    0,
  );
  const inProgressCount = purchases.filter(
    (s) => s.status === "in-progress",
  ).length;
  const completedCount = purchases.filter(
    (s) => s.status === "completed",
  ).length;
  const notStartedCount = purchases.filter(
    (s) => s.status === "not-started",
  ).length;

  // Filter series by status and title/category search.
  const filteredSeries = purchases.filter((series) => {
    const matchesFilter =
      selectedFilter === "all" || series.status === selectedFilter;
    const query = searchQuery.trim().toLocaleLowerCase();
    const searchableText = [series.title, ...series.categories]
      .join(" ")
      .toLocaleLowerCase();

    return matchesFilter && (!query || searchableText.includes(query));
  });

  // Filter tabs configuration
  const filterTabs = [
    { id: "all", label: "All", count: totalSeries },
    { id: "in-progress", label: "In progress", count: inProgressCount },
    { id: "completed", label: "Completed", count: completedCount },
    { id: "not-started", label: "Not started", count: notStartedCount },
  ];

  // The route segment is an episode_id. Passing an episode_number here used to
  // send /play/1/1 for an episode whose real id is 9, which resolved to nothing.
  // With no id to hand, omit the segment and let the player open episode one.
  const handleResumeEpisode = (seriesId: string, episodeId?: number) => {
    navigate(episodeId ? `/play/${seriesId}/${episodeId}` : `/play/${seriesId}`);
  };

  const handleWatchAgain = (seriesId: string) => {
    navigate(`/play/${seriesId}`);
  };

  const handleDetails = (seriesId: string) => {
    navigate(`/library/${seriesId}`);
  };

  const handleDownload = (seriesId: string) => {
    alert(`Downloading series ${seriesId}`);
  };

  const EpisodeMiniRow = ({
    episode,
    seriesStatus,
    isCurrent = false,
  }: {
    episode: Episode;
    seriesStatus: string;
    isCurrent?: boolean;
  }) => {
    const isWatched = episode.watched;
    const isPartiallyWatched =
      episode.progress && episode.progress > 0 && episode.progress < 100;

    let statusClass = "";

    if (isWatched) {
      statusClass = "bg-success/15 text-success";
    } else if (isPartiallyWatched || isCurrent) {
      statusClass = "bg-primary text-white";
    } else {
      statusClass =
        "bg-ocean-border-light dark:bg-ocean-border-dark text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark";
    }

    return (
      <div
        className={`flex items-center gap-3 py-2.5 ${
          isCurrent
            ? "rounded-xl -mx-0.5 px-1 bg-primary/10 border border-primary/20"
            : !isWatched && !isPartiallyWatched
              ? "border-b border-ocean-border-light dark:border-ocean-border-dark"
              : ""
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${statusClass}`}
        >
          {episode.number}
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={`block truncate text-[13px] ${
              isCurrent
                ? "font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark"
                : isWatched
                  ? "font-normal text-ocean-text-primary-light dark:text-ocean-text-primary-dark"
                  : "font-normal text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
            }`}
          >
            {episode.title}
          </span>
          <span
            className={`block text-[11px] opacity-70 ${
              isPartiallyWatched
                ? "text-primary"
                : "text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
            }`}
          >
            {isWatched
              ? `Watched · ${episode.duration}`
              : isPartiallyWatched
                ? `${episode.currentTime} / ${episode.totalTime} · ${episode.progress}% done`
                : `${episode.duration} min`}
          </span>
        </div>
        <div className="shrink-0">
          {isWatched ? (
            <CheckCircle size={13} className="text-success" />
          ) : isPartiallyWatched ? (
            <LinearProgressBar value={episode.progress ?? 0} color="primary" className="w-16" />
          ) : (
            <Play size={16} className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark" />
          )}
        </div>
      </div>
    );
  };

  const SeriesCard = ({ series }: { series: Series }) => {
    const isCompleted = series.status === "completed";
    const isInProgress = series.status === "in-progress";
    const displayEpisodes = series.episodes.slice(0, 4);
    // Resume target: the part-watched episode, else the first unwatched, else the
    // first. The old fallback was a hardcoded episodes[2], which is undefined for
    // any series with fewer than three episodes.
    const currentEpisode = isInProgress
      ? series.episodes.find(
          (ep) => ep.progress && ep.progress > 0 && ep.progress < 100,
        ) ||
        series.episodes.find((ep) => !ep.watched) ||
        series.episodes[0]
      : null;

    // One truncated line replaces the chip row and the boxed stats pill, which
    // together ate most of a phone-width card without adding scannable detail.
    const metaLine = [
      `\u2605 ${series.rating}`,
      `${series.episodeCount} eps`,
      ...series.categories.slice(0, 2),
    ].join(" \u00b7 ");

    return (
      <Card className="mb-3 overflow-hidden sm:mb-6 sm:hover:border-primary">
        <div className="flex flex-row">
          {/* Poster doubles as the details tap target on mobile, where there is no
              room for a separate "Series details" button. */}
          <button
            type="button"
            aria-label={`${series.title} details`}
            onClick={() => handleDetails(series.id)}
            className="relative w-[108px] shrink-0 self-stretch overflow-hidden bg-ocean-background-light dark:bg-ocean-background-dark sm:w-[200px] lg:w-[240px]"
          >
            <div
              className="h-full w-full transition-transform duration-700 sm:hover:scale-110"
              style={{
                backgroundImage: series.thumbnailGradient,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-background-light via-transparent to-transparent opacity-60 dark:from-ocean-background-dark" />
            </div>

            <Chip
              label={series.ownedBadgeText}
              color={series.ownedBadgeColor}
              size="sm"
              className="absolute left-2 top-2 shadow-soft sm:left-4 sm:top-4"
            />
          </button>

          {/* Right Side: Details & Content */}
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3 sm:gap-0 sm:p-8 lg:p-10">
            <div className="min-w-0">
              {/* Sentence case at phone sizes — uppercase italic with tight
                  tracking is hard to read at 15px. Restored from sm: up. */}
              <h3 className="truncate text-[15px] font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark sm:mb-2 sm:text-3xl sm:font-black sm:uppercase sm:italic sm:tracking-tighter">
                {series.title}
              </h3>

              <p className="mt-0.5 truncate text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark sm:hidden">
                {metaLine}
              </p>

              {/* Desktop keeps the roomier chips + stats pill treatment. */}
              <div className="mb-4 hidden sm:block">
                <div className="mb-4 flex flex-wrap gap-2">
                  {series.categories.slice(0, 3).map((cat) => (
                    <Chip key={cat} label={cat} size="sm" />
                  ))}
                </div>
                <div className="flex w-fit max-w-full items-center gap-6 rounded-xl border border-ocean-border-light bg-ocean-background-light px-5 py-2.5 dark:border-ocean-border-dark dark:bg-ocean-background-dark">
                  <div className="flex items-center gap-1.5">
                    <Star size={18} className="shrink-0 text-warning" />
                    <span className="text-[15px] font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                      {series.rating}
                    </span>
                  </div>
                  <div className="h-3 w-px bg-ocean-border-light dark:bg-ocean-border-dark" />
                  <div className="flex items-center gap-1.5">
                    <Film size={18} className="shrink-0 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark" />
                    <span className="whitespace-nowrap text-[15px] font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                      {series.episodeCount} eps
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="sm:mb-8">
              <div className="mb-1.5 flex items-center justify-between gap-2 sm:mb-2">
                <span className="text-[11px] font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark sm:text-[13px] sm:font-bold sm:uppercase sm:tracking-wide">
                  {series.watchedEpisodes}/{series.totalEpisodes} episodes
                </span>
                <span
                  className={`text-[11px] font-bold tabular-nums sm:text-sm sm:font-extrabold ${
                    isCompleted ? "text-success" : "text-primary"
                  }`}
                >
                  {series.progressPercentage}%
                </span>
              </div>
              <LinearProgressBar
                value={series.progressPercentage}
                color={isCompleted ? "success" : "primary"}
              />
            </div>

            {/* Episodes & Main Actions */}
            <div className="mt-auto grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Episode Preview - Hidden on tiny screens, show simplified on medium */}
              <div className="hidden sm:block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-ocean-text-secondary-light opacity-50 dark:text-ocean-text-secondary-dark">
                  {isCompleted ? "HISTORY" : "CONTINUE"}
                </span>
                {displayEpisodes.slice(0, 2).map((ep) => (
                  <EpisodeMiniRow
                    key={ep.number}
                    episode={ep}
                    seriesStatus={series.status}
                    isCurrent={currentEpisode?.number === ep.number}
                  />
                ))}
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col justify-end gap-2 sm:gap-4">
                <div className="flex min-w-0 gap-2 sm:gap-3">
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="sm"
                    className="!min-w-0 !px-2 sm:!px-6"
                    startIcon={<Play size={16} className="sm:h-6 sm:w-6" />}
                    onClick={() =>
                      isCompleted
                        ? handleWatchAgain(series.id)
                        : handleResumeEpisode(series.id, currentEpisode?.id)
                    }
                  >
                    {isCompleted
                      ? "Watch again"
                      : `Resume E${currentEpisode?.number || 1}`}
                  </Button>
                  <IconButton
                    aria-label={`Download ${series.title}`}
                    onClick={() => handleDownload(series.id)}
                    className="shrink-0 border border-ocean-border-light bg-ocean-background-light dark:border-ocean-border-dark dark:bg-ocean-background-dark"
                  >
                    <Download size={18} className="sm:h-6 sm:w-6" />
                  </IconButton>
                </div>
                {/* On mobile the poster is the details affordance instead. */}
                <Button
                  variant="outlined"
                  color="default"
                  fullWidth
                  size="sm"
                  className="hidden !px-2 sm:!inline-flex sm:!px-6"
                  onClick={() => handleDetails(series.id)}
                >
                  Series details
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Payment Strip — desktop only; the purchase date is reference
            detail that does not earn a row on a phone. */}
        <div className="hidden items-center justify-between gap-3 border-t border-ocean-border-light bg-ocean-background-light px-8 py-4 dark:border-ocean-border-dark dark:bg-ocean-background-dark sm:flex">
          <span className="min-w-0 truncate text-[13px] font-semibold text-ocean-text-secondary-light opacity-60 dark:text-ocean-text-secondary-dark">
            Purchased on {series.purchaseDate}
          </span>
          <div className="flex shrink-0 items-center gap-1.5" title="Verified access">
            <CheckCircle size={16} className="text-success" />
            <span className="text-[11px] font-extrabold tracking-wide text-success">
              VERIFIED ACCESS
            </span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-ocean-background-light bg-ocean-radial bg-fixed pb-[calc(var(--tab-bar-h)+16px)] dark:bg-ocean-background-dark md:pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-3 pb-5 pt-5 sm:pb-8 sm:pt-12">
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-ocean-text-primary-light dark:text-ocean-text-primary-dark sm:text-5xl">
              My Library
            </h1>
            {/* Carries the two counts worth knowing at a glance, so the stat grid
                below can stay off a phone screen entirely. */}
            <p className="mt-0.5 truncate text-xs font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark sm:text-sm sm:tracking-wide">
              {totalSeries} series &middot; {totalEpisodes} episodes
            </p>
          </div>
          <Button
            variant="contained"
            color="primary"
            size="sm"
            className="shrink-0"
            startIcon={<Star size={16} />}
          >
            Premium
          </Button>
        </div>

        {/* Summary Bar - Stats Area */}
        {/* Purchased / Completed / Watching duplicate the filter tab counts, and
            four cards push the actual library below the fold on a phone. */}
        <div className="mb-8 hidden gap-6 sm:mb-12 sm:grid sm:grid-cols-2 md:grid-cols-4">
          {[
            {
              label: "Purchased",
              value: totalSeries,
              icon: <Film className="text-primary" />,
            },
            {
              label: "Episodes",
              value: totalEpisodes,
              icon: <Play className="text-primary" />,
            },
            {
              label: "Completed",
              value: completedCount,
              icon: <CheckCircle className="text-success" />,
            },
            {
              label: "Watching",
              value: inProgressCount,
              icon: <Clock className="text-primary" />,
            },
          ].map((stat, i) => (
            <Card key={i} className="flex min-w-0 items-center gap-2 p-3 hover:border-primary/30 sm:gap-4 sm:p-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ocean-border-light bg-ocean-background-light dark:border-ocean-border-dark dark:bg-ocean-background-dark sm:h-14 sm:w-14">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-ocean-text-primary-light dark:text-ocean-text-primary-dark sm:text-2xl">
                  {stat.value}
                </p>
                <p className="truncate text-[9px] font-bold uppercase tracking-wide text-ocean-text-secondary-light opacity-60 dark:text-ocean-text-secondary-dark sm:text-[11px]">
                  {stat.label}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters & Content Area */}
        <section
          aria-label="Library filters"
          className="mb-5 sm:mb-8 sm:rounded-2xl sm:border sm:border-ocean-border-light sm:bg-ocean-surface-light sm:p-3 sm:shadow-soft sm:dark:border-ocean-border-dark sm:dark:bg-ocean-surface-dark"
        >
          <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* A 2x2 grid of filters cost two rows before any content; one
                horizontally scrolling row of chips is the phone convention. */}
            <div
              role="tablist"
              aria-label="Filter library series"
              className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:gap-1 sm:overflow-visible sm:px-0 sm:pb-0"
            >
              {filterTabs.map((tab) => {
                const isActive = selectedFilter === tab.id;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200 sm:rounded-xl sm:px-4 sm:text-sm sm:font-bold ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-ocean-border-light text-ocean-text-secondary-light hover:bg-ocean-card-light hover:text-ocean-text-primary-light dark:border-ocean-border-dark dark:text-ocean-text-secondary-dark dark:hover:bg-ocean-card-dark dark:hover:text-ocean-text-primary-dark"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-ocean-border-light text-ocean-text-secondary-light dark:bg-ocean-border-dark dark:text-ocean-text-secondary-dark"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:max-w-xs">
              <label htmlFor="library-search" className="sr-only">
                Search your library
              </label>
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
              />
              <input
                id="library-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search your library"
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-ocean-border-light bg-ocean-card-light pl-10 pr-10 text-sm text-ocean-text-primary-light outline-none transition-colors placeholder:text-ocean-text-secondary-light focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-ocean-border-dark dark:bg-ocean-card-dark dark:text-ocean-text-primary-dark dark:placeholder:text-ocean-text-secondary-dark"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear library search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ocean-text-secondary-light transition-colors hover:bg-ocean-border-light hover:text-ocean-text-primary-light dark:text-ocean-text-secondary-dark dark:hover:bg-ocean-border-dark dark:hover:text-ocean-text-primary-dark"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
          <div className="hidden px-2 pt-2 text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark sm:block">
            Showing {filteredSeries.length} of {purchases.length} series
          </div>
        </section>

        {/* Series List */}
        <div>
          {loading ? (
            <div className="py-20 text-center">
              <Spinner size={40} className="text-primary mb-2 mx-auto" />
              <p className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                Fetching your collection...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 px-5 text-center bg-ocean-card-light dark:bg-ocean-card-dark rounded-3xl border border-danger/30">
              <p className="mb-1 font-semibold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                Error
              </p>
              <p className="mb-3 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                {error}
              </p>
              <Button variant="outlined" color="primary" startIcon={<RefreshCw size={16} />} onClick={fetchPurchases}>
                Try Again
              </Button>
            </div>
          ) : filteredSeries.length === 0 ? (
            <div className="text-center py-20 bg-ocean-card-light dark:bg-ocean-card-dark rounded-3xl border border-dashed border-ocean-border-light dark:border-ocean-border-dark">
              <Film size={60} className="mx-auto mb-2 text-ocean-border-light dark:text-ocean-border-dark" />
              <p className="font-bold mb-1 text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                No series found
              </p>
              <p className="text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                {searchQuery
                  ? `No matches for “${searchQuery}”. Try another title or category.`
                  : "Try adjusting your filters or search"}
              </p>
            </div>
          ) : (
            filteredSeries.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default LibraryPage;
