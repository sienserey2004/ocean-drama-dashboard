import React, { useEffect, useState } from 'react';
import { videoApi, PurchaseItem } from '@/app/api/video.service';
import { useNavigate } from 'react-router-dom';
import { Library, PlayCircle, ArrowRight, VideoOff } from 'lucide-react';
import { Card, CardContent, Chip } from '@/_ocean/ui';

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return date.toLocaleDateString();
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const Series = () => {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await videoApi.getPurchases();
        const sorted = [...response.data].sort(
          (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        );
        setPurchases(sorted);
      } catch (err) {
        console.error('Failed to fetch purchases:', err);
        setError('Unable to load your library. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 bg-ocean-background-light dark:bg-ocean-background-dark min-h-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full animate-pulse bg-ocean-border-light dark:bg-ocean-border-dark" />
          <div>
            <div className="w-40 h-10 rounded animate-pulse bg-ocean-border-light dark:bg-ocean-border-dark mb-2" />
            <div className="w-24 h-5 rounded animate-pulse bg-ocean-border-light dark:bg-ocean-border-dark" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="rounded-2xl animate-pulse bg-ocean-border-light dark:bg-ocean-border-dark" style={{ height: 280 }} />
              <div className="w-[90%] h-4 rounded animate-pulse bg-ocean-border-light dark:bg-ocean-border-dark mt-2" />
              <div className="w-[60%] h-4 rounded animate-pulse bg-ocean-border-light dark:bg-ocean-border-dark mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-ocean-background-light dark:bg-ocean-background-dark min-h-full">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center rounded-full bg-primary hover:bg-primary-dark px-4 py-1.5 text-sm font-bold text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-ocean-background-light dark:bg-ocean-background-dark min-h-full text-ocean-text-primary-light dark:text-ocean-text-primary-dark pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <Library size={40} className="text-primary" />
          <div>
            <h1 className="font-black text-3xl tracking-tight">My Library</h1>
            <p className="text-sm opacity-60">
              {purchases.length} {purchases.length === 1 ? 'series' : 'series'} purchased
            </p>
          </div>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="mt-24 text-center flex flex-col items-center gap-2">
          <VideoOff size={80} className="opacity-30" />
          <p className="font-semibold text-lg">Your library is empty</p>
          <p className="text-sm opacity-60 max-w-[300px]">
            Start exploring and purchase your first series. It will appear here.
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary-dark px-4 py-2 text-sm font-bold text-white transition-colors"
          >
            Browse Series
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {purchases.map((item) => {
            const thumbnail = item.video.thumbnail_url || (item.video as any).thumbnailUrl;
            const fallback = 'https://via.placeholder.com/400x600?text=No+Preview';
            return (
              <Card
                key={item.purchaseId}
                hoverable
                className="group overflow-hidden cursor-pointer"
                onClick={() => navigate(`/library/${item.videoId}`)}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                  <img
                    src={thumbnail || fallback}
                    alt={item.video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => ((e.target as HTMLImageElement).src = fallback)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
                    <PlayCircle size={56} className="text-white drop-shadow-lg" />
                  </div>
                </div>
                <CardContent className="p-3 pb-4">
                  <p className="font-bold truncate text-sm mb-1.5">{item.video.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-50">{getRelativeTime(item.purchaseDate)}</span>
                    {item.amountPaid && (
                      <Chip label={`${item.amountPaid} ${item.currency || 'USD'}`} color="primary" size="sm" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Series;
