import React, { useEffect } from "react";
import {
  Search,
  Bell,
  Grid as GridIcon,
  Play,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/ocean/stores/authStore";
import { videoApi } from "@/ocean/api/video.service";
import { useState } from "react";
import { Video } from "@/ocean/types";

export default function Explore() {
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
  // AUTO SLIDE ONLY
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === recommended.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [recommended.length]);
  // console.log(user);
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F3F4F6] pb-24 md:pb-12 custom-scrollbar">
      <div className="max-w-[1400px] mx-auto md:px-8">
        {/* HEADER */}
        <header className="flex items-center justify-between px-5 py-4 md:py-8 sticky top-0 bg-[#0A0A0B]/80 backdrop-blur-xl z-50 border-b border-white/5 md:border-none">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 flex items-center justify-center text-sm md:text-base font-bold text-white shadow-lg shadow-indigo-600/30">
                {user?.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0A0A0B] absolute -bottom-0.5 -right-0.5"></div>
            </div>
            <div>
              <p className="text-[10px] md:text-sm text-gray-400 font-medium tracking-wide uppercase">
                Good evening,
              </p>
              <h1 className="text-sm md:text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {user?.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5">
              <GridIcon size={18} className="text-gray-300" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 relative">
              <Bell size={18} className="text-gray-300" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-[#0A0A0B]"></span>
            </button>
          </div>
        </header>

        {/* SEARCH */}
        <div className="px-5 md:px-0 mb-6 md:mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 px-4 py-3 md:py-4 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all shadow-inner">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search dramas, creators, genres…"
              className="bg-transparent border-none outline-none text-sm md:text-base flex-1 text-white placeholder:text-gray-500 font-medium"
            />
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="flex gap-2.5 px-5 md:px-0 mb-8 overflow-x-auto no-scrollbar pb-2">
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
              className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all shadow-sm ${i === 0 ? "bg-indigo-600 text-white shadow-indigo-600/25" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <section className="mb-10 px-5 md:px-0">
          {/* SLIDER */}
          <div className="relative h-[220px] md:h-[480px] rounded-2xl md:rounded-3xl overflow-hidden">
            {recommended.map((video, index) => (
              <div
                key={video.video_id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === current ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* IMAGE (NO FILTER) */}
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />

                {/* CONTENT */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 bg-gradient-to-t from-black/60 to-transparent">
                  <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4">
                    {video.title}
                  </h2>

                  <div className="flex gap-3 mb-4 text-white text-xs md:text-sm flex-wrap">
                    <span>👁 {video.view_count}</span>
                    <span>❤️ {video.like_count}</span>
                    <span>{video.episode_count} Episodes</span>
                    <span>By {video.creator?.name}</span>
                  </div>

                  <div className="flex gap-3">
                    <button className="bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold flex items-center gap-2">
                      <Play size={16} fill="currentColor" />
                      Watch
                    </button>

                    <button className="bg-white/20 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl flex items-center gap-2">
                      <Plus size={16} />
                      Wishlist
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ OUTSIDE INDICATOR */}
          <div className="mt-3 flex justify-center text-sm text-gray-400">
            {current + 1} / {recommended.length}
          </div>
        </section>

        {/* CONTINUE WATCHING */}
        <section className="mb-10">
          <SectionHeader title="Continue watching" className="px-5 md:px-0" />
          <div className="flex gap-4 px-5 md:px-0 overflow-x-auto no-scrollbar pb-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Revenge Drama",
                ep: "EP 3",
                left: "4:22 left",
                progress: "38%",
                bg: "from-blue-900 to-indigo-900",
              },
              {
                title: "Hidden Love",
                ep: "EP 7",
                left: "2:10 left",
                progress: "72%",
                bg: "from-purple-900 to-fuchsia-900",
              },
              {
                title: "Secret Marriage",
                ep: "EP 1",
                left: "8:50 left",
                progress: "15%",
                bg: "from-emerald-900 to-teal-900",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="min-w-[200px] md:min-w-0 flex-1 group cursor-pointer"
              >
                <div
                  className={`h-[110px] md:h-[180px] rounded-xl relative overflow-hidden mb-3 bg-gradient-to-br ${item.bg}`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Play
                        size={20}
                        fill="white"
                        className="text-white ml-1"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] md:text-xs font-bold px-2 py-1 rounded backdrop-blur-md">
                    {item.ep}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 md:h-1.5 bg-white/20">
                    <div
                      className="h-full bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: item.progress }}
                    ></div>
                  </div>
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-100 mb-0.5 group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[10px] md:text-sm text-gray-400 font-medium">
                  {item.left} · {item.ep}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* TRENDING NOW (Ranked) */}
        <section className="mb-10">
          <SectionHeader title="Trending now" className="px-5 md:px-0" />
          <div className="flex gap-6 md:gap-8 px-5 md:px-0 overflow-x-auto no-scrollbar pb-6 pt-4">
            {trending.map((item, i) => (
              <div
                key={i}
                className="min-w-[120px] md:min-w-[180px] relative group cursor-pointer"
              >
                <div
                  className={`h-[160px] md:h-[260px] rounded-xl bg-gradient-to-br bg-gray-500 relative overflow-hidden group-hover:-translate-y-2 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:shadow-indigo-500/20 transition-all duration-300`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
               <div className="w-32 aspect-[2/3] overflow-hidden rounded-lg">
  <img
    src={item.thumbnail_url}
    alt={item.title}
    className="w-full h-full object-cover"
  />
</div>
                  <div className="absolute bottom-3 left-3 right-3 text-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2">
                      <Play size={16} fill="white" className="text-white" />
                    </button>
                  </div>
                </div>
                <div className="absolute -bottom-4 md:-bottom-6 -left-3 md:-left-5 text-[60px] md:text-[90px] font-black italic text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.8)] drop-shadow-[0_5px_15px_rgba(0,0,0,1)] select-none">
                  {i + 1}
                </div>
                <h3 className="text-[11px] md:text-sm font-semibold text-gray-200 mt-3 md:mt-4 truncate text-right">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </section>

        {/* FREE TO WATCH */}
        <section className="mb-10">
          <SectionHeader title="Free to watch" className="px-5 md:px-0" />
          <div className="flex gap-4 px-5 md:px-0 overflow-x-auto no-scrollbar pb-4 md:grid md:grid-cols-4 lg:grid-cols-6">
            {[
              {
                title: "Secret Marriage",
                bg: "from-green-800 to-emerald-900",
                rating: "4.5",
              },
              {
                title: "Moonlight Kiss",
                bg: "from-sky-800 to-indigo-900",
                rating: "4.2",
              },
              {
                title: "The Last Vow",
                bg: "from-violet-800 to-fuchsia-900",
                rating: "4.7",
              },
              {
                title: "Summer Wind",
                bg: "from-amber-700 to-orange-900",
                rating: "4.1",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="min-w-[120px] md:min-w-0 group cursor-pointer"
              >
                <div
                  className={`h-[160px] md:h-[240px] rounded-xl bg-gradient-to-br ${item.bg} relative overflow-hidden mb-2 md:mb-3 group-hover:ring-2 ring-indigo-500 transition-all group-hover:-translate-y-1`}
                >
                  <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                    FREE
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    ★ {item.rating}
                  </div>
                </div>
                <h3 className="text-[11px] md:text-sm font-bold text-gray-200 truncate group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-400 font-medium">
                  Drama
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* COMING SOON GRID */}
        <section className="mb-10 px-5 md:px-0">
          <SectionHeader title="New & coming soon" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                title: "Forbidden Love",
                bg: "from-purple-800 to-pink-900",
                isNew: true,
                meta: "Romance · $3.99",
              },
              {
                title: "Dark Promise",
                bg: "from-stone-800 to-neutral-900",
                isNew: true,
                meta: "Thriller · $4.99",
              },
              {
                title: "Love Trap",
                bg: "from-rose-800 to-red-900",
                isNew: false,
                meta: "Comedy · $2.99",
              },
              {
                title: "The Chosen",
                bg: "from-cyan-800 to-blue-900",
                isNew: false,
                meta: "Action · $5.99",
              },
            ].map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div
                  className={`w-full aspect-video rounded-xl bg-gradient-to-br ${item.bg} relative overflow-hidden mb-2 md:mb-3 group-hover:brightness-110 transition-all shadow-md`}
                >
                  {item.isNew ? (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                      NEW
                    </div>
                  ) : (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      SOON
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                      Preview
                    </span>
                  </div>
                </div>
                <h3 className="text-xs md:text-sm font-bold text-gray-100 truncate group-hover:text-indigo-400">
                  {item.title}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-400">
                  {item.meta}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* POPULAR CREATORS */}
        <section className="mb-10">
          <SectionHeader title="Popular creators" className="px-5 md:px-0" />
          <div className="flex gap-4 md:gap-8 px-5 md:px-0 overflow-x-auto no-scrollbar pb-4 pt-2">
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
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div
                  className={`w-[52px] h-[52px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center text-lg md:text-2xl font-bold text-white shadow-lg ${item.bg} ${item.active ? "ring-[3px] ring-indigo-500 ring-offset-4 ring-offset-[#0A0A0B]" : "ring-1 ring-white/10 group-hover:ring-white/30"} transition-all group-hover:-translate-y-1`}
                >
                  {item.i}
                </div>
                <span
                  className={`text-[10px] md:text-sm font-medium text-center ${item.active ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* MY PURCHASES */}
        <section className="mb-10">
          <SectionHeader title="My purchased series" className="px-5 md:px-0" />
          <div className="flex gap-4 px-5 md:px-0 overflow-x-auto no-scrollbar pb-4 md:grid md:grid-cols-4 lg:grid-cols-6">
            {purchased.map((item, i) => (
              <div
                key={i}
                className="min-w-[140px] md:min-w-0 group cursor-pointer"
              >
                <div
                  className={`h-[180px] md:h-[260px] rounded-xl bg-gradient-to-br bg-cover bg-center relative overflow-hidden mb-2 md:mb-3 group-hover:ring-2 ring-indigo-500 transition-all group-hover:-translate-y-1`}
                  style={{ backgroundImage: `url(${item.thumbnail_url})` }}
                >
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                    OWNED
                  </div>
                  {/* <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    ★ {item?.rating || 0}
                  </div> */}
                </div>
                <h3 className="text-[11px] md:text-sm font-bold text-gray-200 truncate group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                {/* <p className="text-[10px] md:text-xs text-gray-400 font-medium">
                  {item.eps}
                </p> */}
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
      className={`flex items-center justify-between mb-4 md:mb-6 ${className}`}
    >
      <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">
        {title}
      </h2>
      <button className="text-[11px] md:text-sm font-semibold text-indigo-400 flex items-center hover:text-indigo-300 transition-colors">
        See all <ChevronRight size={14} className="ml-0.5" />
      </button>
    </div>
  );
}
