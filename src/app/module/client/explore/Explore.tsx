import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Grid as GridIcon,
  Play,
  Plus,
  Check,
  ChevronRight,
  Star,
} from "lucide-react";
import toast from "@/app/utils/toast";
import { videoApi } from "@/app/api/video.service";
import { categoryApi } from "@/app/api/categoryTag.service";
import { userApi } from "@/app/api/user.service";
import { creatorApi, PopularCreator } from "@/app/api/creator.service";
import { useAuthStore } from "@/app/stores/authStore";
import { Video, Category } from "@/app/types";
import Header from "./components/Header";

export default function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [current, setCurrent] = useState(0);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [trending, setTrending] = useState<Video[]>([]);
  const [purchased, setPurchased] = useState<Video[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  // Search & categories
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Carousel "My List" state (favorited video ids)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  // Continue watching
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Free collection
  const [freeVideos, setFreeVideos] = useState<Video[]>([]);
  const [loadingFree, setLoadingFree] = useState(true);

  // New releases (repurposed "coming soon" slot — backed by real recently-added videos)
  const [newReleases, setNewReleases] = useState<Video[]>([]);
  const [loadingNew, setLoadingNew] = useState(true);

  // Star creators
  const [creators, setCreators] = useState<PopularCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);

  useEffect(() => {
    videoApi.recommended().then((res) => {
      setRecommended(res.data);
      setFavoritedIds(new Set(res.data.filter((v) => v.is_favorited).map((v) => v.video_id)));
    }).catch(() => {});
    videoApi.trending({ limit: 10, period: "week" }).then((res) => {
      setTrending(res.data);
    }).catch(() => {});
    videoApi.getPurchases().then((res) => {
      setPurchased(res.data.map((item) => item.video));
      setLoadingPurchases(false);
    }).catch(() => setLoadingPurchases(false));
    categoryApi.list().then((res) => setCategories(res.data)).catch(() => {});
    videoApi.search({ limit: 30 }).then((res) => {
      setFreeVideos(res.data.filter((v) => v.is_free).slice(0, 6));
      setLoadingFree(false);
    }).catch(() => setLoadingFree(false));
    videoApi.list({ limit: 8 }).then((res) => {
      setNewReleases(res.data);
      setLoadingNew(false);
    }).catch(() => setLoadingNew(false));
    creatorApi.getPopular(8).then(setCreators).catch(() => {}).finally(() => setLoadingCreators(false));

    if (isAuthenticated) {
      userApi.getWatchHistory({ limit: 6 }).then((res) => {
        setWatchHistory(res?.data || []);
        setLoadingHistory(false);
      }).catch(() => setLoadingHistory(false));
    } else {
      setLoadingHistory(false);
    }
  }, [isAuthenticated]);

  // AUTO SLIDE (With manual reset)
  useEffect(() => {
    if (recommended.length === 0) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev === recommended.length - 1 ? 0 : prev + 1));
    }, 4000); // 5s for better readability

    return () => clearInterval(interval);
  }, [recommended.length, current]);

  const goToEpisodes = (video: any) => navigate(`/episodes/${video.video_id}`, { state: { video } });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  };

  const handleCategoryClick = (cat: Category | null) => {
    navigate(cat ? `/search?category=${encodeURIComponent(cat.name)}` : "/search");
  };

  const handleToggleMyList = async () => {
    const current_video = recommended[current];
    if (!current_video) return;
    if (!isAuthenticated) {
      toast.error("Please login to save to your list");
      navigate("/login");
      return;
    }
    const isFavorited = favoritedIds.has(current_video.video_id);
    setFavoriteBusy(true);
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (isFavorited) next.delete(current_video.video_id);
      else next.add(current_video.video_id);
      return next;
    });
    try {
      if (isFavorited) {
        await videoApi.removeFavorite(current_video.video_id);
        toast.success("Removed from My List");
      } else {
        await videoApi.addFavorite(current_video.video_id);
        toast.success("Added to My List");
      }
    } catch (err) {
      toast.error("Failed to update your list");
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (isFavorited) next.add(current_video.video_id);
        else next.delete(current_video.video_id);
        return next;
      });
    } finally {
      setFavoriteBusy(false);
    }
  };

  const heroVideo = recommended[current];

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F9FAFB] pb-24 md:pb-12 custom-scrollbar selection:bg-[#0EA5E9] selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_transparent_70%)] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto md:px-8">
        {/* HEADER */}
        <Header />

        {/* SEARCH */}
        <form onSubmit={handleSearchSubmit} className="px-5 md:px-0 mb-8 md:mb-12">
          <div className="bg-[#111217] border border-[#262A33] rounded-2xl flex items-center gap-4 px-5 py-3 md:py-4 focus-within:ring-2 focus-within:ring-[#0EA5E9]/50 focus-within:border-[#0EA5E9]/50 transition-all shadow-inner group">
            <button type="submit" aria-label="Search">
              <Search
                size={20}
                className="text-[#9CA3AF] group-focus-within:text-[#0EA5E9] transition-colors"
              />
            </button>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dramas, creators, genres…"
              className="bg-transparent border-none outline-none text-sm md:text-base flex-1 text-white placeholder:text-[#9CA3AF]/50 font-medium"
            />
          </div>
        </form>

        {/* CATEGORIES */}
        {categories.length > 0 && (
          <div className="flex gap-3 px-5 md:px-0 mb-10 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => handleCategoryClick(null)}
              className="px-6 py-2.5 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border-2 bg-[#0EA5E9] border-[#0EA5E9] text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:scale-105"
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => handleCategoryClick(cat)}
                className="px-6 py-2.5 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border-2 bg-[#111217] text-[#9CA3AF] hover:bg-white/5 border-[#262A33] hover:border-[#0EA5E9] hover:text-white"
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <section className="mb-12 px-5 md:px-0 group/carousel relative">
          {/* SLIDER CONTAINER */}
          <div className="relative h-[220px] md:h-[600px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/5">
            <div
              className="flex h-full transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {recommended.map((video) => (
                <div
                  key={video.video_id}
                  className="w-full h-full shrink-0 relative"
                >
                  {/* FULL-SIZE IMAGE */}
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover select-none scale-105 group-hover/carousel:scale-100 transition-transform duration-[2s]"
                  />

                  {/* OVERLAY GRADIENTS */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#08090C]/60 via-transparent to-transparent hidden md:block" />

                  {/* CONTENT */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 lg:p-24">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <span className="px-3 py-1 rounded-full bg-[#0EA5E9] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_15px_#0EA5E9]">
                        Featured
                      </span>
                      <span className="text-white/40 text-[10px]">|</span>
                      <span className="text-white/80 text-[10px] md:text-xs font-black uppercase tracking-widest">
                        {video.episode_count} Episodes
                      </span>
                    </div>

                    <h2
                      className="text-3xl md:text-7xl font-black text-white mb-4 md:mb-8 leading-[1.1] max-w-[95%] md:max-w-3xl drop-shadow-2xl line-clamp-2 uppercase italic tracking-tighter"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {video.title}
                    </h2>

                    {/* Meta Row */}
                    <div className="flex items-center gap-4 md:gap-8 mb-6 md:mb-12 text-[#9CA3AF] text-[10px] md:text-lg font-bold">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Star size={18} fill="currentColor" />
                        <span>4.8 Rating</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#262A33]" />
                      <span className="hidden sm:block">
                        {video.view_count.toLocaleString()} Views
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#262A33] hidden sm:block" />
                      <span className="text-[#0EA5E9] font-black tracking-wider uppercase">
                        @
                        {video.creator?.name?.replace(/\s+/g, "").toLowerCase()}
                      </span>
                    </div>

                    <div className="flex gap-3 md:gap-6">
                      <button
                        onClick={() => goToEpisodes(video)}
                        className="bg-white text-black px-6 py-3 md:px-12 md:py-5 rounded-full font-black flex items-center gap-3 hover:bg-[#0EA5E9] hover:text-white transition-all active:scale-95 shadow-2xl group/btn"
                      >
                        <Play
                          size={18}
                          className="md:w-6 md:h-6 transition-transform group-hover/btn:scale-110"
                          fill="currentColor"
                        />
                        <span className="text-sm md:text-xl">Watch now</span>
                      </button>

                      <button
                        onClick={handleToggleMyList}
                        disabled={favoriteBusy}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-3 md:px-10 md:py-5 rounded-full font-black flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95"
                      >
                        {heroVideo && favoritedIds.has(heroVideo.video_id) ? (
                          <Check size={20} className="md:w-6 md:h-6" />
                        ) : (
                          <Plus size={20} className="md:w-6 md:h-6" />
                        )}
                        <span className="text-sm md:text-xl">
                          {heroVideo && favoritedIds.has(heroVideo.video_id) ? "In my list" : "My list"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* NAVIGATION BUTTONS (Desktop Only) */}
            <div className="hidden md:flex absolute inset-y-0 left-8 items-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 translate-x-[-20px] group-hover/carousel:translate-x-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) =>
                    prev === 0 ? recommended.length - 1 : prev - 1,
                  );
                }}
                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-[#0EA5E9] transition-all hover:scale-110 shadow-2xl"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
            </div>

            <div className="hidden md:flex absolute inset-y-0 right-8 items-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 translate-x-[20px] group-hover/carousel:translate-x-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) =>
                    prev === recommended.length - 1 ? 0 : prev + 1,
                  );
                }}
                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-[#0EA5E9] transition-all hover:scale-110 shadow-2xl"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* PROGRESS BAR */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
              <div
                key={current}
                className="h-full bg-[#0EA5E9] origin-left animate-carousel-progress shadow-[0_0_15px_#0EA5E9]"
              />
            </div>

            {/* INDICATORS */}
            <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-2 md:gap-4 z-40">
              {recommended.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 md:h-2 transition-all duration-700 rounded-full ${
                    i === current
                      ? "w-10 md:w-20 bg-[#0EA5E9] shadow-[0_0_10px_#0EA5E9]"
                      : "w-1.5 md:w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CSS FOR PROGRESS BAR */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes carouselProgress {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .animate-carousel-progress {
            animation: carouselProgress 4000ms linear forwards;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `,
          }}
        />

        {/* CONTINUE WATCHING */}
        {isAuthenticated && (loadingHistory || watchHistory.length > 0) && (
          <section className="mb-16">
            <SectionHeader
              title="Jump back in"
              className="px-5 md:px-0"
              onExplore={() => navigate("/watch-history")}
            />
            <div className="flex gap-6 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 md:grid md:grid-cols-2 lg:grid-cols-3">
              {loadingHistory
                ? [...Array(3)].map((_, i) => (
                    <div key={i} className="min-w-[280px] md:min-w-0 flex-1 animate-pulse">
                      <div className="h-[150px] md:h-[220px] rounded-2xl bg-white/5 border border-white/5 mb-4" />
                      <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  ))
                : watchHistory.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(`/play/${item.video_id}${item.episode_id ? `/${item.episode_id}` : ""}`)}
                      className="min-w-[280px] md:min-w-0 flex-1 group cursor-pointer"
                    >
                      <div className="h-[150px] md:h-[220px] rounded-2xl relative overflow-hidden mb-4 bg-[#181A20] border border-[#262A33] group-hover:border-[#0EA5E9]/50 transition-all duration-500 shadow-lg group-hover:shadow-[#0EA5E9]/10">
                        {item.thumbnail_url && (
                          <img src={item.thumbnail_url} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]">
                          <div className="w-14 h-14 rounded-full bg-[#0EA5E9] flex items-center justify-center shadow-glow transform scale-90 group-hover:scale-100 transition-transform">
                            <Play size={24} fill="white" className="text-white ml-1" />
                          </div>
                        </div>
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">
                          EP {item.episode_number}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                          <div
                            className="h-full bg-[#0EA5E9] rounded-r-full shadow-[0_0_15px_#0EA5E9]"
                            style={{ width: `${item.completed ? 100 : Math.min(100, item.watch_duration)}%` }}
                          ></div>
                        </div>
                      </div>
                      <h3 className="text-base md:text-xl font-black text-[#F9FAFB] mb-1 group-hover:text-[#0EA5E9] transition-colors uppercase italic tracking-tight truncate">
                        {item.video_title}
                      </h3>
                      <p className="text-xs md:text-sm text-[#9CA3AF] font-bold uppercase tracking-widest opacity-60">
                        {item.completed ? "Completed" : `${Math.min(100, item.watch_duration)}% watched`}
                      </p>
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* TRENDING NOW (Ranked) */}
        <section className="mb-16">
          <SectionHeader title="Top trending" className="px-5 md:px-0" onExplore={() => navigate("/search")} />
          <div className="flex gap-8 md:gap-12 px-5 md:px-0 overflow-x-auto no-scrollbar pb-10 pt-4">
            {trending.map((item, i) => (
              <div
                key={i}
                onClick={ () =>
                  navigate(`/episodes/${item.video_id}`, {
                    state: { video: item },
                  }) }
                className="min-w-[140px] md:min-w-[220px] relative group cursor-pointer"
              >
                <div
                  className={`h-[200px] md:h-[320px] rounded-2xl bg-[#181A20] relative overflow-hidden group-hover:-translate-y-3 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] group-hover:shadow-[#0EA5E9]/20 transition-all duration-500 border border-[#262A33] group-hover:border-[#0EA5E9]/40`}
                >
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[1px]">
                    <div className="w-12 h-12 rounded-full bg-[#0EA5E9] flex items-center justify-center shadow-glow transform scale-75 group-hover:scale-100 transition-transform">
                      <Play size={20} fill="white" className="ml-1" />
                    </div>
                  </div>
                </div>

                {/* Rank Number */}
                <div className="absolute -bottom-6 md:-bottom-10 -left-4 md:-left-8 text-[80px] md:text-[140px] font-black italic text-transparent [-webkit-text-stroke:2px_rgba(14,165,233,0.6)] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] select-none pointer-events-none group-hover:[-webkit-text-stroke:3px_#0EA5E9] transition-all duration-500">
                  {i + 1}
                </div>

                <div className="mt-4 md:mt-6 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    {item.already_purchased ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#0EA5E9] text-white text-[8px] font-black uppercase tracking-widest">Owned</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md ${item.is_free ? 'bg-emerald-500' : 'bg-white/10'} text-white text-[8px] font-black uppercase tracking-widest`}>
                        {item.is_free ? 'Free' : `$${item.price}`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs md:text-lg font-black text-[#F9FAFB] truncate uppercase italic tracking-tighter group-hover:text-[#0EA5E9] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold uppercase tracking-widest opacity-50">
                    {item.episode_count} Episodes
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FREE TO WATCH */}
        {(loadingFree || freeVideos.length > 0) && (
          <section className="mb-16">
            <SectionHeader title="Free collection" className="px-5 md:px-0" onExplore={() => navigate("/search")} />
            <div className="flex gap-6 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 md:grid md:grid-cols-4 lg:grid-cols-6">
              {loadingFree
                ? [...Array(4)].map((_, i) => (
                    <div key={i} className="min-w-[150px] md:min-w-0 animate-pulse">
                      <div className="h-[220px] md:h-[300px] rounded-2xl bg-white/5 border border-white/5 mb-4" />
                      <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                    </div>
                  ))
                : freeVideos.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => goToEpisodes(item)}
                      className="min-w-[150px] md:min-w-0 group cursor-pointer"
                    >
                      <div className="h-[220px] md:h-[300px] rounded-2xl bg-[#181A20] relative overflow-hidden mb-4 group-hover:scale-[1.03] transition-all duration-500 border border-[#262A33] group-hover:border-[#0EA5E9]/30 shadow-lg">
                        {item.thumbnail_url && (
                          <img src={item.thumbnail_url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-lg tracking-widest">
                          Free
                        </div>
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play
                            size={32}
                            fill="white"
                            className="text-white transform scale-50 group-hover:scale-100 transition-transform"
                          />
                        </div>
                      </div>
                      <h3 className="text-sm md:text-base font-extrabold text-[#F9FAFB] truncate group-hover:text-[#0EA5E9] transition-colors italic tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest opacity-50">
                        {item.episode_count} Episodes
                      </p>
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* NEW RELEASES */}
        {(loadingNew || newReleases.length > 0) && (
          <section className="mb-16 px-5 md:px-0">
            <SectionHeader title="New releases" onExplore={() => navigate("/search")} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
              {loadingNew
                ? [...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/5 mb-4" />
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                    </div>
                  ))
                : newReleases.map((item, i) => (
                    <div key={i} onClick={() => goToEpisodes(item)} className="group cursor-pointer">
                      <div className="w-full aspect-video rounded-2xl bg-[#181A20] relative overflow-hidden mb-4 group-hover:brightness-125 transition-all duration-500 shadow-xl border border-[#262A33] group-hover:border-[#0EA5E9]/50">
                        {item.thumbnail_url && (
                          <img src={item.thumbnail_url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-3 left-3 bg-[#0EA5E9] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-[0_0_10px_#0EA5E9] tracking-widest">
                          New
                        </div>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-[2px]">
                          <span className="text-white text-[10px] font-bold bg-[#0EA5E9] px-4 py-2 rounded-full shadow-glow transform translate-y-2 group-hover:translate-y-0 transition-transform tracking-widest">
                            Preview
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm md:text-lg font-extrabold text-[#F9FAFB] truncate group-hover:text-[#0EA5E9] transition-colors italic tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest opacity-50">
                        {(item.categories?.[0] as any)?.name || "Drama"} · {item.is_free ? "Free" : `$${item.price}`}
                      </p>
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* POPULAR CREATORS */}
        {(loadingCreators || creators.length > 0) && (
          <section className="mb-16">
            <SectionHeader title="Star creators" className="px-5 md:px-0" />
            <div className="flex gap-6 md:gap-12 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 pt-2">
              {loadingCreators
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-4 animate-pulse">
                      <div className="w-[64px] h-[64px] md:w-[100px] md:h-[100px] rounded-2xl bg-white/5" />
                      <div className="h-3 w-12 bg-white/5 rounded" />
                    </div>
                  ))
                : creators.map((item) => (
                    <div
                      key={item.user_id}
                      onClick={() => navigate(`/creator/${item.user_id}`)}
                      className="flex flex-col items-center gap-4 group cursor-pointer"
                    >
                      <div className="w-[64px] h-[64px] md:w-[100px] md:h-[100px] rounded-2xl flex items-center justify-center text-xl md:text-4xl font-extrabold text-white shadow-2xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] ring-1 ring-white/10 group-hover:ring-[#0EA5E9]/50 group-hover:ring-2 transition-all duration-500 group-hover:-translate-y-2 transform rotate-3 group-hover:rotate-0 overflow-hidden">
                        {item.profile_image ? (
                          <img src={item.profile_image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          item.name?.charAt(0)?.toUpperCase() || "?"
                        )}
                      </div>
                      <span className="text-[10px] md:text-sm font-bold text-center tracking-widest transition-colors text-[#9CA3AF] group-hover:text-white truncate max-w-[100px]">
                        {item.name}
                      </span>
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* MY PURCHASES */}
        <section className="mb-10">
          <SectionHeader title="My vault" className="px-5 md:px-0" onExplore={() => navigate("/library")} />

          {loadingPurchases ? (
            <div className="flex gap-6 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 md:grid md:grid-cols-4 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="min-w-[160px] md:min-w-0 animate-pulse">
                  <div className="h-[220px] md:h-[320px] rounded-2xl bg-white/5 border border-white/5 mb-4" />
                  <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : purchased.length > 0 ? (
            <div className="flex gap-6 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 md:grid md:grid-cols-4 lg:grid-cols-6">
              {purchased.map((item, i) => (
                <div
                  key={i}
                  onClick={() => goToEpisodes(item)}
                  className="min-w-[160px] md:min-w-0 group cursor-pointer"
                >
                  <div
                    className={`h-[220px] md:h-[320px] rounded-2xl bg-[#181A20] relative overflow-hidden mb-4 group-hover:scale-[1.03] transition-all duration-500 border border-[#262A33] group-hover:border-[#0EA5E9]/50 shadow-2xl`}
                  >
                    <img
                      src={item.thumbnail_url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3 bg-[#0EA5E9] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-glow tracking-widest">
                      Owned
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                      <Play
                        size={40}
                        fill="white"
                        className="text-white transform scale-50 group-hover:scale-100 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  <h3 className="text-sm md:text-base font-extrabold text-[#F9FAFB] truncate group-hover:text-[#0EA5E9] transition-colors italic tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest opacity-50">
                    Ready to stream
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 md:px-0">
               <div className="w-full py-12 md:py-20 rounded-[32px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center group hover:border-[#0EA5E9]/30 transition-all duration-500">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 group-hover:bg-[#0EA5E9]/10">
                    <GridIcon size={32} className="text-[#9CA3AF] group-hover:text-[#0EA5E9] transition-colors" />
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white mb-2 italic tracking-tight uppercase">Your vault is empty</h3>
                  <p className="text-[#9CA3AF] text-xs md:text-base font-bold mb-8 max-w-xs md:max-w-md px-4 opacity-70">Unlock premium dramas and start building your private collection to watch anytime.</p>
                  <button
                    onClick={() => navigate("/search")}
                    className="px-8 py-3.5 md:px-10 md:py-4 bg-white text-black rounded-full font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-[#0EA5E9] hover:text-white hover:scale-110 active:scale-95 transition-all"
                  >
                    Browse Dramas
                  </button>
               </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// HELPER COMPONENTS
function SectionHeader({
  title,
  className = "",
  onExplore,
}: {
  title: string;
  className?: string;
  onExplore?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between mb-6 md:mb-10 ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-[#0EA5E9] rounded-full shadow-[0_0_15px_rgba(14,165,233,0.6)]"></div>
        <h2
          className="text-xl md:text-4xl font-extrabold text-white tracking-tighter italic"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      {onExplore && (
        <button
          onClick={onExplore}
          className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-[#9CA3AF] flex items-center gap-2 hover:text-white hover:bg-[#0EA5E9] hover:border-[#0EA5E9] transition-all tracking-widest group shadow-lg"
        >
          Explore more
          <ChevronRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      )}
    </div>
  );
}
