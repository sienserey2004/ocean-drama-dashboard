import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Grid as GridIcon,
  Play,
  Plus,
  ChevronRight,
  Star,
} from "lucide-react";
import { videoApi } from "@/app/api/video.service";
import { useAuthStore } from "@/app/stores/authStore";
import { Video } from "@/app/types";

export default function Explore() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [current, setCurrent] = useState(0);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [trending, setTrending] = useState<Video[]>([]);
  const [purchased, setPurchased] = useState<Video[]>([]);
  useEffect(() => {
    videoApi.recommended().then((res) => {
      setRecommended(res.data);
    });
    videoApi.trending({ limit: 10, period: "week" }).then((res) => {
      setTrending(res.data);
    });
    videoApi.getPurchases().then((res) => {
      setPurchased(res.data.map((item) => item.video));
    });
  }, []);
  // AUTO SLIDE (With manual reset)
  useEffect(() => {
    if (recommended.length === 0) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev === recommended.length - 1 ? 0 : prev + 1));
    }, 4000); // 5s for better readability

    return () => clearInterval(interval);
  }, [recommended.length, current]);
  // console.log(user);
  return (
    <div className="min-h-screen bg-[#08090C] text-[#F9FAFB] pb-24 md:pb-12 custom-scrollbar selection:bg-[#E50914] selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.15),_transparent_70%)] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto md:px-8">
        {/* HEADER */}
        <header className="flex md:hidden items-center justify-between px-5 py-4 md:py-8 sticky top-0 bg-[#08090C]/60 backdrop-blur-xl z-50 border-b border-white/5 md:border-none">
          <div className="flex items-center gap-4 ">
            <div className="relative group cursor-pointer">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B20710] flex items-center justify-center text-sm md:text-base font-bold text-white shadow-lg shadow-[#E50914]/30 transform group-hover:scale-105 transition-all">
                {user?.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt=""
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#08090C] absolute -bottom-0.5 -right-0.5 shadow-sm"></div>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest uppercase opacity-70">
                Good evening,
              </p>
              <h1 className="text-sm md:text-xl font-black text-white tracking-tight">
                {user?.name}
              </h1>
            </div>
          </div>

          {/* LOGO */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <h1
              className="text-3xl font-black tracking-tighter text-white uppercase italic"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                textShadow: "2px 2px 0px #E50914, 4px 4px 0px #B20710",
              }}
            >
              OCEAN DRAMA
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5 hover:scale-110 active:scale-95 group">
              <GridIcon
                size={18}
                className="text-[#9CA3AF] group-hover:text-white"
              />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5 relative hover:scale-110 active:scale-95 group">
              <Bell
                size={18}
                className="text-[#9CA3AF] group-hover:text-white"
              />
              <span className="w-2 h-2 rounded-full bg-[#E50914] absolute top-2.5 right-2.5 ring-2 ring-[#08090C] shadow-[0_0_10px_#E50914]"></span>
            </button>
          </div>
        </header>

        {/* SEARCH */}
        {/* <div className="px-5 md:px-0 mb-8 md:mb-12">
          <div className="bg-[#111217] border border-[#262A33] rounded-2xl flex items-center gap-4 px-5 py-3 md:py-4 focus-within:ring-2 focus-within:ring-[#E50914]/50 focus-within:border-[#E50914]/50 transition-all shadow-inner group">
            <Search
              size={20}
              className="text-[#9CA3AF] group-focus-within:text-[#E50914] transition-colors"
            />
            <input
              type="text"
              placeholder="Search dramas, creators, genres…"
              className="bg-transparent border-none outline-none text-sm md:text-base flex-1 text-white placeholder:text-[#9CA3AF]/50 font-medium"
            />
          </div>
        </div> */}

        {/* CATEGORIES */}
        {/* <div className="flex gap-3 px-5 md:px-0 mb-10 overflow-x-auto no-scrollbar pb-2">
          {[
            "All",
            "Romance",
            "Action",
            "Drama",
            "Comedy",
            "Thriller",
            "Khmer",
          ].map((cat, i) => (
            <button
              key={cat}
              className={`px-6 py-2.5 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border-2 ${i === 0 ? "bg-[#E50914] border-[#E50914] text-white shadow-[0_0_20px_rgba(229,9,20,0.4)] scale-105" : "bg-[#111217] text-[#9CA3AF] hover:bg-white/5 border-[#262A33] hover:border-[#E50914] hover:text-white"}`}
            >
              {cat}
            </button>
          ))}
        </div> */}

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
                      <span className="px-3 py-1 rounded-full bg-[#E50914] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_15px_#E50914]">
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
                      <span className="text-[#E50914] font-black tracking-wider uppercase">
                        @
                        {video.creator?.name?.replace(/\s+/g, "").toLowerCase()}
                      </span>
                    </div>

                    <div className="flex gap-3 md:gap-6">
                      <button className="bg-white text-black px-6 py-3 md:px-12 md:py-5 rounded-full font-black flex items-center gap-3 hover:bg-[#E50914] hover:text-white transition-all active:scale-95 shadow-2xl group/btn">
                        <Play
                          size={18}
                          className="md:w-6 md:h-6 transition-transform group-hover/btn:scale-110"
                          fill="currentColor"
                        />
                        <span className="text-sm md:text-xl">Watch now</span>
                      </button>

                      <button className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-3 md:px-10 md:py-5 rounded-full font-black flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95">
                        <Plus size={20} className="md:w-6 md:h-6" />
                        <span className="text-sm md:text-xl">My list</span>
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
                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-[#E50914] transition-all hover:scale-110 shadow-2xl"
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
                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white hover:bg-[#E50914] transition-all hover:scale-110 shadow-2xl"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* PROGRESS BAR */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
              <div
                key={current}
                className="h-full bg-[#E50914] origin-left animate-carousel-progress shadow-[0_0_15px_#E50914]"
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
                      ? "w-10 md:w-20 bg-[#E50914] shadow-[0_0_10px_#E50914]"
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
        <section className="mb-16">
          <SectionHeader title="Jump back in" className="px-5 md:px-0" />
          <div className="flex gap-6 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Revenge Drama",
                ep: "EP 3",
                left: "4:22 left",
                progress: "38%",
                bg: "from-blue-900 to-indigo-950",
              },
              {
                title: "Hidden Love",
                ep: "EP 7",
                left: "2:10 left",
                progress: "72%",
                bg: "from-purple-900 to-fuchsia-950",
              },
              {
                title: "Secret Marriage",
                ep: "EP 1",
                left: "8:50 left",
                progress: "15%",
                bg: "from-emerald-900 to-teal-950",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="min-w-[280px] md:min-w-0 flex-1 group cursor-pointer"
              >
                <div
                  className={`h-[150px] md:h-[220px] rounded-2xl relative overflow-hidden mb-4 bg-gradient-to-br ${item.bg} border border-[#262A33] group-hover:border-[#E50914]/50 transition-all duration-500 shadow-lg group-hover:shadow-[#E50914]/10`}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]">
                    <div className="w-14 h-14 rounded-full bg-[#E50914] flex items-center justify-center shadow-glow transform scale-90 group-hover:scale-100 transition-transform">
                      <Play
                        size={24}
                        fill="white"
                        className="text-white ml-1"
                      />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">
                    {item.ep}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                    <div
                      className="h-full bg-[#E50914] rounded-r-full shadow-[0_0_15px_#E50914]"
                      style={{ width: item.progress }}
                    ></div>
                  </div>
                </div>
                <h3 className="text-base md:text-xl font-black text-[#F9FAFB] mb-1 group-hover:text-[#E50914] transition-colors uppercase italic tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-[#9CA3AF] font-bold uppercase tracking-widest opacity-60">
                  {item.left} · Season 1
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* TRENDING NOW (Ranked) */}
        <section className="mb-16">
          <SectionHeader title="Top trending" className="px-5 md:px-0" />
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
                  className={`h-[200px] md:h-[320px] rounded-2xl bg-[#181A20] relative overflow-hidden group-hover:-translate-y-3 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] group-hover:shadow-[#E50914]/20 transition-all duration-500 border border-[#262A33] group-hover:border-[#E50914]/40`}
                >
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[1px]">
                    <div className="w-12 h-12 rounded-full bg-[#E50914] flex items-center justify-center shadow-glow transform scale-75 group-hover:scale-100 transition-transform">
                      <Play size={20} fill="white" className="ml-1" />
                    </div>
                  </div>
                </div>

                {/* Rank Number */}
                <div className="absolute -bottom-6 md:-bottom-10 -left-4 md:-left-8 text-[80px] md:text-[140px] font-black italic text-transparent [-webkit-text-stroke:2px_rgba(229,9,20,0.6)] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] select-none pointer-events-none group-hover:[-webkit-text-stroke:3px_#E50914] transition-all duration-500">
                  {i + 1}
                </div>

                <div className="mt-4 md:mt-6 text-right">
                  <h3 className="text-xs md:text-lg font-black text-[#F9FAFB] truncate uppercase italic tracking-tighter group-hover:text-[#E50914] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold uppercase tracking-widest opacity-50">
                    Drama • 2024
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FREE TO WATCH */}
        <section className="mb-16">
          <SectionHeader title="Free collection" className="px-5 md:px-0" />
          <div className="flex gap-6 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 md:grid md:grid-cols-4 lg:grid-cols-6">
            {[
              {
                title: "Secret Marriage",
                bg: "from-green-900 to-emerald-950",
                rating: "4.5",
              },
              {
                title: "Moonlight Kiss",
                bg: "from-sky-900 to-indigo-950",
                rating: "4.2",
              },
              {
                title: "The Last Vow",
                bg: "from-violet-900 to-fuchsia-950",
                rating: "4.7",
              },
              {
                title: "Summer Wind",
                bg: "from-amber-900 to-orange-950",
                rating: "4.1",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="min-w-[150px] md:min-w-0 group cursor-pointer"
              >
                <div
                  className={`h-[220px] md:h-[300px] rounded-2xl bg-gradient-to-br ${item.bg} relative overflow-hidden mb-4 group-hover:scale-[1.03] transition-all duration-500 border border-[#262A33] group-hover:border-[#E50914]/30 shadow-lg`}
                >
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-lg tracking-widest">
                    Free
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/5">
                    ★ {item.rating}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play
                      size={32}
                      fill="white"
                      className="text-white transform scale-50 group-hover:scale-100 transition-transform"
                    />
                  </div>
                </div>
                <h3 className="text-sm md:text-base font-extrabold text-[#F9FAFB] truncate group-hover:text-[#E50914] transition-colors italic tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest opacity-50">
                  Drama collection
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* COMING SOON GRID */}
        <section className="mb-16 px-5 md:px-0">
          <SectionHeader title="Coming soon" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
              {
                title: "Forbidden Love",
                bg: "from-purple-900 to-pink-950",
                isNew: true,
                meta: "Romance · $3.99",
              },
              {
                title: "Dark Promise",
                bg: "from-stone-900 to-neutral-950",
                isNew: true,
                meta: "Thriller · $4.99",
              },
              {
                title: "Love Trap",
                bg: "from-rose-900 to-red-950",
                isNew: false,
                meta: "Comedy · $2.99",
              },
              {
                title: "The Chosen",
                bg: "from-cyan-900 to-blue-950",
                isNew: false,
                meta: "Action · $5.99",
              },
            ].map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div
                  className={`w-full aspect-video rounded-2xl bg-gradient-to-br ${item.bg} relative overflow-hidden mb-4 group-hover:brightness-125 transition-all duration-500 shadow-xl border border-[#262A33] group-hover:border-[#E50914]/50`}
                >
                  {item.isNew ? (
                    <div className="absolute top-3 left-3 bg-[#E50914] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-[0_0_10px_#E50914] tracking-widest animate-pulse">
                      New
                    </div>
                  ) : (
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg border border-white/10 tracking-widest">
                      Soon
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 backdrop-blur-[2px]">
                    <span className="text-white text-[10px] font-bold bg-[#E50914] px-4 py-2 rounded-full shadow-glow transform translate-y-2 group-hover:translate-y-0 transition-transform tracking-widest">
                      Preview
                    </span>
                  </div>
                </div>
                <h3 className="text-sm md:text-lg font-extrabold text-[#F9FAFB] truncate group-hover:text-[#E50914] transition-colors italic tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest opacity-50">
                  {item.meta}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* POPULAR CREATORS */}
        <section className="mb-16">
          <SectionHeader title="Star creators" className="px-5 md:px-0" />
          <div className="flex gap-6 md:gap-12 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 pt-2">
            {[
              { i: "S", name: "Sophea", bg: "bg-indigo-600", active: true },
              { i: "M", name: "Mony", bg: "bg-emerald-600" },
              { i: "B", name: "Borey", bg: "bg-rose-600" },
              { i: "R", name: "Rithy", bg: "bg-blue-600" },
              { i: "K", name: "Kunthy", bg: "bg-amber-600" },
              { i: "L", name: "Leakhena", bg: "bg-purple-600" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-4 group cursor-pointer"
              >
                <div
                  className={`w-[64px] h-[64px] md:w-[100px] md:h-[100px] rounded-2xl flex items-center justify-center text-xl md:text-4xl font-extrabold text-white shadow-2xl ${item.bg} ${item.active ? "ring-4 ring-[#E50914] ring-offset-4 ring-offset-[#08090C] shadow-[#E50914]/30" : "ring-1 ring-white/10 group-hover:ring-[#E50914]/50 group-hover:ring-2"} transition-all duration-500 group-hover:-translate-y-2 transform rotate-3 group-hover:rotate-0`}
                >
                  {item.i}
                </div>
                <span
                  className={`text-[10px] md:text-sm font-bold text-center tracking-widest transition-colors ${item.active ? "text-[#E50914]" : "text-[#9CA3AF] group-hover:text-white"}`}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* MY PURCHASES */}
        <section className="mb-10">
          <SectionHeader title="My vault" className="px-5 md:px-0" />
          <div className="flex gap-6 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 md:grid md:grid-cols-4 lg:grid-cols-6">
            {purchased.map((item, i) => (
              <div
                key={i}
                className="min-w-[160px] md:min-w-0 group cursor-pointer"
              >
                <div
                  className={`h-[220px] md:h-[320px] rounded-2xl bg-[#181A20] relative overflow-hidden mb-4 group-hover:scale-[1.03] transition-all duration-500 border border-[#262A33] group-hover:border-[#E50914]/50 shadow-2xl`}
                >
                  <img
                    src={item.thumbnail_url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 bg-[#E50914] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-glow tracking-widest">
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
                <h3 className="text-sm md:text-base font-extrabold text-[#F9FAFB] truncate group-hover:text-[#E50914] transition-colors italic tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[10px] md:text-xs text-[#9CA3AF] font-bold tracking-widest opacity-50">
                  Ready to stream
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// HELPER COMPONENTS
function SectionHeader({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between mb-6 md:mb-10 ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-[#E50914] rounded-full shadow-[0_0_15px_rgba(229,9,20,0.6)]"></div>
        <h2
          className="text-xl md:text-4xl font-extrabold text-white tracking-tighter italic"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <button className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-[#9CA3AF] flex items-center gap-2 hover:text-white hover:bg-[#E50914] hover:border-[#E50914] transition-all tracking-widest group shadow-lg">
        Explore more
        <ChevronRight
          size={14}
          className="group-hover:translate-x-1 transition-transform"
        />
      </button>
    </div>
  );
}
