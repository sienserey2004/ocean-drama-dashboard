import React from "react";
import {
  BarChart2,
  Users,
  Video,
  Eye,
  DollarSign,
  Plus,
  Home,
  Coins,
  Settings,
  MoreVertical,
  Play,
  ArrowUpRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet
} from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Box, Typography, Stack, IconButton, Avatar as MuiAvatar } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/app/stores/authStore";
import { useSubscriptionStore } from "@/app/stores/subscriptionStore";
import { creatorApi, CreatorStats } from "@/app/api/creator.service";
import { Video as IVideo } from "@/app/types";
import { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const isPremium = subscription?.status === 'active';
  const isAdmin = user?.role === 'admin';
  const isLocked = !isAdmin && !isPremium;

  const [statsData, setStatsData] = useState<CreatorStats | null>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, v] = await Promise.all([
          creatorApi.getStats(),
          creatorApi.getRecentVideos(3)
        ]);
        setStatsData(s);
        setVideos(v.data || []);
      } catch (error) {
        console.error("Dashboard load error", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = [
    { 
      label: "Views", 
      value: statsData ? (statsData.total_views >= 1000 ? `${(statsData.total_views/1000).toFixed(1)}K` : statsData.total_views) : "0", 
      change: "+0%", 
      icon: <Eye size={20} />, 
      color: "#3B82F6" 
    },
    {
      label: "Earn",
      value: isLocked ? "LOCKED" : (statsData ? `$${statsData.total_earnings.toLocaleString()}` : "$0"),
      change: isLocked ? "UPGRADE" : "+0%",
      icon: <DollarSign size={20} />,
      color: isLocked ? "#9CA3AF" : "#10B981"
    },
    { 
      label: "Subs", 
      value: statsData ? (statsData.total_followers >= 1000 ? `${(statsData.total_followers/1000).toFixed(1)}K` : statsData.total_followers) : "0", 
      change: "+0%", 
      icon: <Users size={20} />, 
      color: "#8B5CF6" 
    },
    { 
      label: "Videos", 
      value: statsData ? statsData.total_videos.toString() : "0", 
      change: "+0", 
      icon: <Video size={20} />, 
      color: "#F59E0B" 
    },
  ];

  const chartData = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
  const chartLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-[#08090C] text-white pb-32 font-sans selection:bg-red-500/30">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#08090C]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Creator Studio
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF] mt-0.5">
              Analytics <span className="mx-1 text-white/20">•</span> Upload <span className="mx-1 text-white/20">•</span> Earn
            </p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-[#08090C] flex items-center justify-center overflow-hidden border-2 border-[#08090C]">
                <img
                  src={user?.profile_image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#08090C] rounded-full"></div>
          </div>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-10 animate-in fade-in duration-700">
        {/* WALLET SECTION */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
               <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                 <Wallet size={16} /> Wallet
               </h2>
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Track your earnings and payouts</p>
            </div>
            <button onClick={()=>navigate("/dashboard/earnings")} className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all">
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="glass-card p-5 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="p-3 rounded-2xl group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLocked && stat.label === 'Earn' ? 'bg-orange-400/10 text-orange-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black mt-1 tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PERFORMANCE CHART */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
               <TrendingUpIcon size={16} /> Performance
            </h2>
            <div className="flex gap-2">
              {['7D', '1M', '1Y'].map(t => (
                <button key={t} className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${t === '7D' ? 'bg-white text-black border-white' : 'border-white/10 text-white/40'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-[2.5rem] p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden">
            <div className="h-44 -mx-4">
              <LineChart
                xAxis={[{ data: [1, 2, 3, 4, 5, 6, 7], scaleType: 'point', hideTooltip: true }]}
                series={[
                  {
                    data: chartData,
                    area: true,
                    color: '#E50914',
                    showMark: false,
                  },
                ]}
                height={180}
                margin={{ left: 10, right: 10, top: 10, bottom: 0 }}
                slotProps={{
                  legend: { hidden: true },
                }}
                leftAxis={null}
                bottomAxis={null}
                sx={{
                  '& .MuiAreaElement-root': {
                    fill: 'url(#chart-gradient)',
                    opacity: 0.2,
                  },
                  '& .MuiLineElement-root': {
                    strokeWidth: 4,
                  },
                }}
              >
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E50914" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#E50914" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </LineChart>
            </div>
            <div className="flex justify-between px-2 mt-2">
              {chartLabels.map(l => (
                <span key={l} className="text-[9px] font-black text-white/20 uppercase">{l}</span>
              ))}
            </div>
          </div>
        </section>

        {/* LIBRARY SECTION */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
               <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                 <Clock size={16} /> Library
               </h2>
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">My Drama Series</p>
            </div>
            <button onClick={()=>navigate("/dashboard/videos")} className="text-[10px] font-bold text-white/40 hover:text-white transition-colors">
              VIEW ALL
            </button>
          </div>
          <div className="space-y-4">
            {videos.length === 0 && !loading && (
              <Box sx={{ py: 4, textAlign: 'center', opacity: 0.5 }}>
                <Typography variant="body2">No videos uploaded yet.</Typography>
              </Box>
            )}
            {videos.map((video, i) => (
              <div 
                key={i} 
                className="glass-card p-4 rounded-3xl border border-white/5 flex items-center gap-4 hover:bg-white/[0.02] transition-all group"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                  <img src={video.thumbnail_url || ""} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-white/90 truncate pr-4">{video.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-white/40">
                      <Eye size={12} /> {video.view_count || 0}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/40">
                      <Play size={12} /> {video.like_count || 0}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      (video.status === 'published' || video.status === 'ready')
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {(video.status === 'published' || video.status === 'ready') ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {(video.status || 'pending').toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold text-white/20">
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <IconButton size="small" className="text-white/20" onClick={() => navigate(`/dashboard/videos/${video.video_id}/episodes`)}>
                  <MoreVertical size={16} />
                </IconButton>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FLOATING UPLOAD BUTTON */}
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full shadow-[0_8px_30px_rgb(229,9,20,0.4)] flex items-center justify-center transform active:scale-90 transition-transform z-40 group"
        onClick={() => navigate('/dashboard/videos/create')}
      >
        <Plus size={32} className="text-white group-hover:rotate-90 transition-transform" />
      </button>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
        }
        .text-glow {
          text-shadow: 0 0 20px rgba(229, 9, 20, 0.5);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

const TrendingUpIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

export default Dashboard;
