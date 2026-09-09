import React from 'react';
import { useAuthStore } from '@/app/stores/authStore';

const MobileStatsBar: React.FC = () => {
    const { user } = useAuthStore();

    const stats = [
        { label: 'Watched', value: user?.stats?.watch_history_count || '0' },
        { label: 'Library', value: user?.stats?.purchases_count || '0' },
        { label: 'Favorites', value: user?.stats?.favorites_count || '0' },
        { label: 'Following', value: user?.stats?.following_count || '0' },
    ];

    return (
        <div className="mx-6 p-1 bg-ocean-card-light/80 dark:bg-ocean-card-dark/80 rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark shadow-lg flex mb-8">
            {stats.map((stat, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center py-3 cursor-pointer relative">
                    <span className="text-xl font-black text-ocean-text-primary-light dark:text-ocean-text-primary-dark">{stat.value}</span>
                    <span className="text-[10px] font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark uppercase tracking-widest">
                        {stat.label}
                    </span>
                    {idx < 3 && <div className="w-px h-6 bg-ocean-border-light dark:bg-ocean-border-dark absolute right-0 top-1/2 -translate-y-1/2" />}
                </div>
            ))}
        </div>
    );
};

export default MobileStatsBar;
