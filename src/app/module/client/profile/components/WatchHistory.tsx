import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, History, CheckCircle, PlayCircle } from 'lucide-react';
import { Spinner, LinearProgressBar } from '@/_ocean/ui';

interface WatchHistoryProps {
    isMobile: boolean;
    history: any[];
    loading: boolean;
}

const WatchHistory: React.FC<WatchHistoryProps> = ({ isMobile, history, loading }) => {
    const navigate = useNavigate();

    return (
        <div className={`${isMobile ? 'px-6' : ''} mb-10`}>
            <div className="flex justify-between items-center mb-6">
                <span className="text-ocean-text-primary-light dark:text-ocean-text-primary-dark text-lg font-black italic uppercase tracking-tighter">
                    Recently Watched
                </span>
                <button
                    type="button"
                    onClick={() => navigate('/watch-history')}
                    className="text-primary text-xs font-bold cursor-pointer hover:underline items-center flex gap-1"
                >
                    View All <ChevronRight size={14} />
                </button>
            </div>

            {loading && history.length === 0 ? (
                <LoadingState />
            ) : history.length === 0 ? (
                <EmptyState />
            ) : (
                <HistoryList history={history} onSelect={(item) => navigate(`/play/${item.video_id}${item.episode_id ? `/${item.episode_id}` : ''}`)} />
            )}
        </div>
    );
};

const LoadingState: React.FC = () => (
    <div className="flex justify-center p-10">
        <Spinner size={32} className="text-primary" />
    </div>
);

const EmptyState: React.FC = () => (
    <div className="bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-dashed border-ocean-border-light dark:border-ocean-border-dark rounded-3xl p-10 flex flex-col items-center justify-center text-center opacity-50">
        <History size={40} className="mb-2 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark" />
        <p className="text-sm font-bold">No watch history yet</p>
        <p className="text-[10px]">Your recently watched dramas will appear here</p>
    </div>
);

const HistoryList: React.FC<{ history: any[]; onSelect: (item: any) => void }> = ({ history, onSelect }) => (
    <div className="flex flex-row gap-6 overflow-x-auto pb-6 no-scrollbar">
        {history.map((item, idx) => (
            <HistoryItem key={idx} item={item} onClick={() => onSelect(item)} />
        ))}
    </div>
);

const HistoryItem: React.FC<{ item: any; onClick: () => void }> = ({ item, onClick }) => (
    <div className="flex-shrink-0 w-[160px] group cursor-pointer" onClick={onClick}>
        <div className="relative w-[160px] h-[240px] rounded-2xl overflow-hidden border border-ocean-border-light dark:border-ocean-border-dark group-hover:border-primary group-hover:scale-[1.02] transition-all duration-300 shadow-xl group-hover:shadow-glow">
            <img src={item.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

            <div className="absolute bottom-3 left-3 right-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-white opacity-80">
                        EP {item.episode_number}
                    </span>
                    {item.completed && <CheckCircle size={10} className="text-success" />}
                </div>
                <LinearProgressBar
                    value={item.completed ? 100 : Math.min(100, item.watch_duration)}
                    color="primary"
                />
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                <div className="bg-primary p-3 rounded-full shadow-glow">
                    <PlayCircle size={32} className="text-white" />
                </div>
            </div>
        </div>
        <p className="text-[11px] font-black text-ocean-text-primary-light dark:text-ocean-text-primary-dark mt-3 group-hover:text-primary truncate tracking-tight uppercase italic">
            {item.video_title}
        </p>
    </div>
);

export default WatchHistory;
