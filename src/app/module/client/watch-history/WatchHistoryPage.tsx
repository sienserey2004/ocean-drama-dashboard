import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, CheckCircle, PlayCircle, Trash2 } from 'lucide-react';
import toast from '@/app/utils/toast';
import { userApi } from '@/app/api/user.service';
import { Spinner, IconButton, LinearProgressBar, Button } from '@/_ocean/ui';

const WatchHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await userApi.getWatchHistory({ limit: 50 });
            setHistory(res?.data || []);
        } catch (err) {
            console.error('Failed to fetch watch history:', err);
            toast.error('Failed to load watch history');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleClear = async () => {
        setClearing(true);
        try {
            await userApi.clearWatchHistory();
            setHistory([]);
            toast.success('Watch history cleared');
        } catch (err) {
            toast.error('Failed to clear watch history');
        } finally {
            setClearing(false);
        }
    };

    const goToItem = (item: any) => {
        if (item.video_id) {
            navigate(`/play/${item.video_id}${item.episode_id ? `/${item.episode_id}` : ''}`);
        }
    };

    return (
        <div className="min-h-screen bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial bg-fixed text-ocean-text-primary-light dark:text-ocean-text-primary-dark pb-24">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <IconButton onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} />
                        </IconButton>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Watch History</h1>
                    </div>
                    {history.length > 0 && (
                        <Button
                            size="sm"
                            variant="outlined"
                            color="danger"
                            startIcon={<Trash2 size={14} />}
                            disabled={clearing}
                            onClick={handleClear}
                        >
                            Clear All
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Spinner size={32} className="text-primary" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-dashed border-ocean-border-light dark:border-ocean-border-dark rounded-3xl p-16 flex flex-col items-center justify-center text-center opacity-60">
                        <History size={40} className="mb-3" />
                        <p className="font-bold">No watch history yet</p>
                        <p className="text-sm mt-1">Your recently watched dramas will appear here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {history.map((item, idx) => (
                            <div key={idx} className="group cursor-pointer" onClick={() => goToItem(item)}>
                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-ocean-border-light dark:border-ocean-border-dark group-hover:border-primary transition-all shadow-xl">
                                    <img src={item.thumbnail_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[8px] font-black text-white opacity-80">EP {item.episode_number}</span>
                                            {item.completed && <CheckCircle size={10} className="text-success" />}
                                        </div>
                                        <LinearProgressBar
                                            value={item.completed ? 100 : Math.min(100, item.watch_duration)}
                                            color="primary"
                                        />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                        <div className="bg-primary p-3 rounded-full shadow-glow">
                                            <PlayCircle size={28} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[12px] font-black mt-2 truncate uppercase italic tracking-tight group-hover:text-primary">
                                    {item.video_title}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchHistoryPage;
