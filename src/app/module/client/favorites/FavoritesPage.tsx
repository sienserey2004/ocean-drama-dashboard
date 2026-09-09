import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Film } from 'lucide-react';
import toast from '@/app/utils/toast';
import { userApi } from '@/app/api/user.service';
import { videoApi } from '@/app/api/video.service';
import { Video } from '@/app/types';
import { Spinner, IconButton } from '@/_ocean/ui';

const FavoritesPage: React.FC = () => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const res = await userApi.getFavorites({ limit: 50 });
            setFavorites(res?.data || []);
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
            toast.error('Failed to load favorites');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const handleRemove = async (video: Video, e: React.MouseEvent) => {
        e.stopPropagation();
        setRemovingId(video.video_id);
        try {
            await videoApi.removeFavorite(video.video_id);
            setFavorites((prev) => prev.filter((v) => v.video_id !== video.video_id));
            toast.success('Removed from favorites');
        } catch (err) {
            toast.error('Failed to remove favorite');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial bg-fixed text-ocean-text-primary-light dark:text-ocean-text-primary-dark pb-24">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </IconButton>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">Favorites</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Spinner size={32} className="text-primary" />
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-dashed border-ocean-border-light dark:border-ocean-border-dark rounded-3xl p-16 flex flex-col items-center justify-center text-center opacity-60">
                        <Heart size={40} className="mb-3" />
                        <p className="font-bold">No favorites yet</p>
                        <p className="text-sm mt-1">Tap the heart on a drama to save it here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {favorites.map((video) => (
                            <div
                                key={video.video_id}
                                className="group cursor-pointer"
                                onClick={() => navigate(`/library/${video.video_id}`)}
                            >
                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-ocean-border-light dark:border-ocean-border-dark group-hover:border-primary transition-all shadow-xl">
                                    {video.thumbnail_url ? (
                                        <img src={video.thumbnail_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-ocean-card-light dark:bg-ocean-card-dark">
                                            <Film size={32} className="opacity-30" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemove(video, e)}
                                        disabled={removingId === video.video_id}
                                        className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-danger/80 transition-colors"
                                    >
                                        <Heart size={16} className="text-primary fill-primary" />
                                    </button>
                                </div>
                                <p className="text-[12px] font-black mt-2 truncate uppercase italic tracking-tight group-hover:text-primary">
                                    {video.title}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;
