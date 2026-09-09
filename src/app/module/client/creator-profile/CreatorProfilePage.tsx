import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle, Film, Play } from 'lucide-react';
import toast from '@/app/utils/toast';
import { userApi } from '@/app/api/user.service';
import { videoApi } from '@/app/api/video.service';
import { useAuthStore } from '@/app/stores/authStore';
import { PublicProfile, Video } from '@/app/types';
import { Spinner, IconButton, Button } from '@/_ocean/ui';

const CreatorProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { creatorId } = useParams();
    const { isAuthenticated } = useAuthStore();
    const numericCreatorId = Number(creatorId);

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [followBusy, setFollowBusy] = useState(false);

    const fetchData = useCallback(async () => {
        if (!numericCreatorId) return;
        setLoading(true);
        try {
            const [profileRes, videosRes] = await Promise.all([
                userApi.getPublicProfile(numericCreatorId),
                videoApi.list({ creator_id: numericCreatorId, limit: 24 }),
            ]);
            setProfile(profileRes);
            setVideos(videosRes?.data || []);
        } catch (err) {
            console.error('Failed to load creator profile:', err);
            toast.error('Failed to load creator profile');
        } finally {
            setLoading(false);
        }
    }, [numericCreatorId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to follow creators');
            navigate('/login');
            return;
        }
        if (!profile) return;
        setFollowBusy(true);
        const wasFollowing = profile.is_following;
        setProfile({
            ...profile,
            is_following: !wasFollowing,
            stats: { ...profile.stats, follower_count: profile.stats.follower_count + (wasFollowing ? -1 : 1) },
        });
        try {
            if (wasFollowing) {
                await userApi.unfollow(numericCreatorId);
            } else {
                await userApi.follow(numericCreatorId);
            }
        } catch (err) {
            toast.error('Failed to update follow status');
            fetchData();
        } finally {
            setFollowBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-ocean-background-light dark:bg-ocean-background-dark">
                <Spinner size={32} className="text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ocean-background-light dark:bg-ocean-background-dark text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                <p className="font-bold">Creator not found</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial bg-fixed text-ocean-text-primary-light dark:text-ocean-text-primary-dark pb-24">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <IconButton onClick={() => navigate(-1)} className="mb-6">
                    <ArrowLeft size={20} />
                </IconButton>

                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-ocean-card-light dark:bg-ocean-card-dark border-4 border-primary shadow-glow flex items-center justify-center text-3xl font-black mb-4">
                        {profile.profile_image ? (
                            <img src={profile.profile_image} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                            profile.name?.charAt(0)?.toUpperCase() || <User size={32} />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-2xl font-black tracking-tight">{profile.name}</p>
                        <CheckCircle size={18} className="text-primary" />
                    </div>
                    <p className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark text-sm font-bold uppercase tracking-widest mb-6">
                        {profile.stats.follower_count.toLocaleString()} Followers · {profile.stats.video_count} Series
                    </p>
                    <Button
                        color={profile.is_following ? 'default' : 'primary'}
                        variant={profile.is_following ? 'outlined' : 'contained'}
                        disabled={followBusy}
                        onClick={handleFollowToggle}
                    >
                        {profile.is_following ? 'Following' : 'Follow'}
                    </Button>
                </div>

                <p className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                    Series by {profile.name}
                </p>

                {videos.length === 0 ? (
                    <div className="bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-dashed border-ocean-border-light dark:border-ocean-border-dark rounded-3xl p-16 flex flex-col items-center justify-center text-center opacity-60">
                        <Film size={40} className="mb-3" />
                        <p className="font-bold">No published series yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {videos.map((video) => (
                            <div
                                key={video.video_id}
                                className="group cursor-pointer"
                                onClick={() => navigate(`/episodes/${video.video_id}`, { state: { video } })}
                            >
                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-ocean-border-light dark:border-ocean-border-dark group-hover:border-primary transition-all shadow-xl">
                                    {video.thumbnail_url ? (
                                        <img src={video.thumbnail_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-ocean-card-light dark:bg-ocean-card-dark">
                                            <Film size={32} className="opacity-30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                        <div className="bg-primary p-3 rounded-full shadow-glow">
                                            <Play size={24} fill="white" className="text-white" />
                                        </div>
                                    </div>
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

export default CreatorProfilePage;
