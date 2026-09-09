import React from 'react';
import { User, Settings } from 'lucide-react';
import { IconButton } from '@/_ocean/ui';
import AccountSettings from './AccountSettings';
import MobileStatsBar from './MobileStatsBar';
import QuickActions from './QuickActions';
import WatchHistory from './WatchHistory';

interface ProfileContentProps {
    isMobile: boolean;
    watchHistory: any[];
    loading: boolean;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ isMobile, watchHistory, loading }) => {
    return (
        <div className={`bg-ocean-surface-light/40 dark:bg-ocean-surface-dark/40 backdrop-blur-xl border-ocean-border-light/50 dark:border-ocean-border-dark/50 shadow-2xl flex flex-col
            ${isMobile ? 'rounded-none' : 'rounded-3xl border p-8 pb-12'}`}>

            {isMobile ? <MobileStatsBar /> : <ActivityHeader />}

            <QuickActions isMobile={isMobile} />
            <WatchHistory isMobile={isMobile} history={watchHistory} loading={loading} />
            <AccountSettings isMobile={isMobile} />
        </div>
    );
};

const ActivityHeader: React.FC = () => (
    <div className="flex items-center justify-between mb-10">
        <span className="text-2xl font-black italic tracking-tighter">Activity Overview</span>
        <div className="flex flex-row gap-4">
            <IconButton plain className="bg-ocean-card-light dark:bg-ocean-card-dark text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark hover:text-primary">
                <User size={20} />
            </IconButton>
            <IconButton plain className="bg-ocean-card-light dark:bg-ocean-card-dark text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark hover:text-primary">
                <Settings size={20} />
            </IconButton>
        </div>
    </div>
);

export default ProfileContent;
