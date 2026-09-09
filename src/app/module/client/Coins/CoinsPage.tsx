import React from 'react';
import {
  Coins,
  Wallet,
  Play,
  Tv,
  Calendar,
  Utensils,
  ChevronRight,
  ArrowUpRight,
  History,
  TrendingUp,
  Gift
} from 'lucide-react';
import { coinsBalance, dailyCheckin, getCheckinStatus } from './services/balance.service';
import toast from '@/app/utils/toast';
import { useNavigate } from 'react-router-dom';
import { videoApi } from '@/app/api/video.service';
import { coinApi } from '@/app/api/coin.service';
import { Video } from '@/app/types';
import { Lock } from 'lucide-react';

type DailyCheckinStatus = {
  day: number;
  checkedIn: boolean;
  isToday?: boolean;
};

const WEEKLY_CHECKIN_DAYS: DailyCheckinStatus[] = Array.from(
  { length: 7 },
  (_, index) => ({ day: index + 1, checkedIn: false, isToday: index === 0 })
);

const CoinsPage = () => {

  const [coins, setCoins] = React.useState(0);
  const [cashBalance, setCashBalance] = React.useState("0");
  const [loading, setLoading] = React.useState(false);
  const [checkinStatus, setCheckinStatus] = React.useState<any>(null);
  const [recommendedVideos, setRecommendedVideos] = React.useState<Video[]>([]);
  const navigate = useNavigate();
  const fetchStatus = async () => {
    try {
      const res = await getCheckinStatus();
      setCheckinStatus(res);
    } catch (err) {
      console.error("Failed to fetch check-in status:", err);
    }
  };

  React.useEffect(() => {
    const getCoins = async () => {
      try {
        const res = await coinsBalance();
        if (res) {
          if (typeof res.coins !== 'undefined') setCoins(res.coins);
          if (typeof res.cashBalance !== 'undefined') setCashBalance(res.cashBalance);
          console.log("Fetched balance:", res);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    const fetchRecommended = async () => {
      try {
        const res = await videoApi.recommended({ limit: 4 });
        if (res && res.data) {
          setRecommendedVideos(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch recommended videos:", err);
      }
    };

    getCoins();
    fetchStatus();
    fetchRecommended();
  }, []);

  const handleUnlockVideo = async (videoId: number, usdPrice: number) => {
    // Assuming 100 coins per 0.01 USD as per the exchange rate 10,000 = $1
    const coinPrice = Math.round((Number(usdPrice) || 0) * 10000) || 100;
    
    if (coins < coinPrice) {
      toast.error("Insufficient coins! Earn more by watching dramas.");
      return;
    }

    if (!window.confirm(`Unlock this series for ${coinPrice.toLocaleString()} coins?`)) return;

    setLoading(true);
    try {
      const res = await coinApi.unlockVideo(videoId, coinPrice);
      toast.success(res.data?.message || "Video series unlocked!");
      
      // Refresh balance
      const newBalance = await coinsBalance();
      if (newBalance) {
        setCoins(newBalance.coins);
      }
      
      // Redirect to the video
      setTimeout(() => navigate(`/viewer/episodes/${videoId}`), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unlock video");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (loading || checkinStatus?.hasCheckedInToday) return;
    setLoading(true);
    try {
      const res = await dailyCheckin();
      toast.success(res.message || "Check-in successful!");
      // Refresh balance and status after check-in
      const newBalance = await coinsBalance();
      if (newBalance) {
        setCoins(newBalance.coins);
        setCashBalance(newBalance.cashBalance);
      }
      await fetchStatus();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Already checked in today!";
      const isCompletedCheckIn = msg.trim().toLowerCase().replace(/[!.]+$/, '') === 'already checked in today';
      if (isCompletedCheckIn) {
        toast(msg, { icon: '✓', id: 'daily-checkin:already-complete' });
      } else {
        toast.error(msg);
      }
      await fetchStatus(); // Ensure status is synced
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white pb-24 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-[#0B0B0F]/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
          Reward Center
        </h1>
        <div className="flex gap-4">
          <button className="p-2 glass-card rounded-full hover:bg-white/10 transition-colors">
            <History size={20} className="text-primary" />
          </button>
          <button className="p-2 glass-card rounded-full hover:bg-white/10 transition-colors">
            <Gift size={20} className="text-primary" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden glass-card rounded-[2rem] p-6 border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 text-primary-light/60 text-sm mb-1">
                <Coins size={14} />
                <span>Total Coins</span>
              </div>
              <div className="text-5xl font-black tracking-tight flex items-baseline gap-1">
                <span className="[text-shadow:0_0_20px_rgba(14,165,233,0.4)]">{coins}</span>
                <span className="text-sm font-medium text-primary uppercase">Coins</span>
              </div>
            </div>
            <button className="flex items-center gap-1 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-xs font-semibold text-primary hover:bg-primary/30 transition-all active:scale-95">
              Withdraw <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Wallet size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Cash Earnings</p>
                <p className="text-lg font-bold text-white/90">$ {cashBalance}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Exchange Rate</p>
              <p className="text-xs text-primary-light/60 font-medium">10,000 Coins ≈ $1.00</p>
            </div>
          </div>
        </div>

        {/* Daily Check-in */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Daily Check-in
            </h2>
            <button 
              onClick={handleCheckin}
              disabled={loading || checkinStatus?.hasCheckedInToday}
              className={`text-xs px-4 py-1.5 rounded-full transition-all disabled:opacity-50 ${
                checkinStatus?.hasCheckedInToday 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30'
              }`}
            >
              {loading ? 'Checking...' : checkinStatus?.hasCheckedInToday ? 'Checked Today' : 'Check-in Now'}
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {((checkinStatus?.dailyStatus as DailyCheckinStatus[] | undefined) || WEEKLY_CHECKIN_DAYS).map((status) => (
              <div 
                key={status.day}
                className={`min-w-0 px-1 py-3 rounded-2xl flex flex-col items-center justify-between gap-2 border transition-all ${
                  status.checkedIn
                    ? 'bg-primary/20 border-primary/40 text-primary-light'
                    : status.isToday
                      ? 'bg-white/10 border-primary/30 text-white animate-pulse'
                      : 'glass-card border-white/5 text-white/40'
                }`}
              >
                <span className="text-[10px] font-medium">Day {status.day}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${status.checkedIn ? 'bg-primary/40' : 'bg-white/5'}`}>
                  <Coins size={14} />
                </div>
                <span className="text-[10px] font-bold">
                  +{status.day * 5}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Tasks Section */}
        <section className="space-y-4">
          <div className="px-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Earn Coins
            </h2>
          </div>

          {/* Main Task: Watch Drama */}
          <div className="relative group overflow-hidden glass-card rounded-[1.5rem] p-5 flex items-center justify-between border-white/10 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-light to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
                <Play fill="white" size={24} className="text-white ml-1" />
              </div>
              <div>
                <h3 className="font-bold text-white/90">Watch Drama</h3>
                <p className="text-xs text-white/40 mt-0.5">Double coins every 5 mins</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary" />
                  </div>
                  <span className="text-[10px] text-primary font-medium">12/30min</span>
                </div>
              </div>
            </div>
            <button onClick={() => navigate("/")} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-sky-100 transition-colors">
              Watch
            </button>
          </div>

          {/* Ad Task */}
          <div className="glass-card rounded-[1.5rem] p-5 flex items-center justify-between border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Tv size={24} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white/90">Watch Ads</h3>
                <p className="text-xs text-white/40 mt-0.5">Earn up to 500 Coins</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-primary mb-2">+200~500</p>
              <button className="px-4 py-2 glass-card border-white/10 text-white/60 text-xs font-bold rounded-full">
                Claim
              </button>
            </div>
          </div>

          {/* Eat Subsidy */}
          <div className="glass-card rounded-[1.5rem] p-5 flex items-center justify-between border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Utensils size={24} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white/90">Meal Subsidy</h3>
                <p className="text-xs text-white/40 mt-0.5">Lunch Time: 11:30 - 13:30</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] text-white/30 font-medium">Not started</span>
              <p className="text-[10px] text-purple-400/60 mt-1">Est. Reward +500</p>
            </div>
          </div>
        </section>

        {/* Unlock Videos Section */}
        {recommendedVideos.length > 0 && (
          <section className="space-y-4">
            <div className="px-2 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                Unlock with Coins
              </h2>
              <span className="text-[10px] text-primary/60 font-bold uppercase tracking-wider">Hot Dramas</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {recommendedVideos.map((video) => {
                const coinPrice = Math.round((Number(video.price) || 0) * 10000) || 100;
                return (
                  <div key={video.video_id} className="glass-card rounded-3xl overflow-hidden border-white/5 flex flex-col group">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1 border border-white/10">
                        <Coins size={10} className="text-primary" />
                        <span className="text-[10px] font-bold text-primary">{coinPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                      <h3 className="text-xs font-bold line-clamp-1 text-white/90">{video.title}</h3>
                      <button 
                        onClick={() => handleUnlockVideo(video.video_id, video.price)}
                        disabled={loading}
                        className="w-full py-2 bg-primary/20 border border-primary/30 rounded-xl text-[10px] font-black text-primary hover:bg-primary/30 transition-all active:scale-95"
                      >
                        {loading ? 'Processing...' : 'Unlock Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer Info */}
        <div className="py-8 text-center space-y-2">
          <p className="text-xs text-white/20 flex items-center justify-center gap-1">
            <Gift size={12} /> Invite friends to earn more
          </p>
          <p className="text-[10px] text-white/10">Terms & conditions apply</p>
        </div>
      </div>

      {/* Quick Action Button (Floating) */}
      <div className="fixed bottom-24 right-6">
        <button className="w-14 h-14 bg-gradient-to-tr from-primary-dark to-primary-light rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 animate-bounce">
          <Gift size={28} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default CoinsPage;
