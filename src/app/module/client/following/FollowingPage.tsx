import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, User } from 'lucide-react';
import toast from '@/app/utils/toast';
import { userApi } from '@/app/api/user.service';
import { PublicProfile } from '@/app/types';
import { Spinner, IconButton, Button } from '@/_ocean/ui';

const FollowingPage: React.FC = () => {
    const navigate = useNavigate();
    const [following, setFollowing] = useState<PublicProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [unfollowingId, setUnfollowingId] = useState<number | null>(null);

    const fetchFollowing = useCallback(async () => {
        setLoading(true);
        try {
            const res = await userApi.getFollowing({ limit: 50 });
            setFollowing(res?.data || []);
        } catch (err) {
            console.error('Failed to fetch following list:', err);
            toast.error('Failed to load following list');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFollowing();
    }, [fetchFollowing]);

    const handleUnfollow = async (creator: PublicProfile) => {
        setUnfollowingId(creator.user_id);
        try {
            await userApi.unfollow(creator.user_id);
            setFollowing((prev) => prev.filter((c) => c.user_id !== creator.user_id));
            toast.success(`Unfollowed ${creator.name}`);
        } catch (err) {
            toast.error('Failed to unfollow');
        } finally {
            setUnfollowingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial bg-fixed text-ocean-text-primary-light dark:text-ocean-text-primary-dark pb-24">
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </IconButton>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">Following</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Spinner size={32} className="text-primary" />
                    </div>
                ) : following.length === 0 ? (
                    <div className="bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-dashed border-ocean-border-light dark:border-ocean-border-dark rounded-3xl p-16 flex flex-col items-center justify-center text-center opacity-60">
                        <UserPlus size={40} className="mb-3" />
                        <p className="font-bold">You're not following anyone yet</p>
                        <p className="text-sm mt-1">Creators you follow will show up here</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {following.map((creator) => (
                            <div
                                key={creator.user_id}
                                className="p-4 rounded-2xl bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-ocean-border-light/30 dark:border-ocean-border-dark/30 flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-ocean-background-light dark:bg-ocean-background-dark border border-ocean-border-light dark:border-ocean-border-dark flex items-center justify-center shrink-0">
                                    {creator.profile_image ? (
                                        <img src={creator.profile_image} alt={creator.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black truncate">{creator.name}</p>
                                    <p className="text-[11px] font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark uppercase">
                                        {creator.stats?.follower_count ?? 0} followers · {creator.stats?.video_count ?? 0} videos
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outlined"
                                    color="danger"
                                    disabled={unfollowingId === creator.user_id}
                                    onClick={() => handleUnfollow(creator)}
                                >
                                    Unfollow
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FollowingPage;
