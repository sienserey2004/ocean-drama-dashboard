import React, { useState, useEffect } from 'react';
import { userApi } from '@/app/api/user.service';
import { useAuthStore } from '@/app/stores/authStore';
import ProfileContent from './components/ProfileContent';
import ProfileSidebar from './components/ProfileSidebar';

// Matches MUI's old breakpoints.down('md') threshold (900px) so the isMobile-driven
// layout swaps below behave exactly as they did before the MUI removal.
function useIsMobile(breakpointPx = 900) {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpointPx);

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpointPx - 0.05}px)`);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [breakpointPx]);

    return isMobile;
}

const ProfileScreen: React.FC = () => {
    const isMobile = useIsMobile();
    const { user, isAuthenticated, refreshUser } = useAuthStore();
    
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchHistory();
        }
    }, [isAuthenticated]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            refreshUser();
            const res = await userApi.getWatchHistory({ limit: 10 });
            if (res && res.data) {
                setWatchHistory(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial bg-fixed text-ocean-text-primary-light dark:text-ocean-text-primary-dark font-sans ${isMobile ? 'pb-24' : 'pb-16'}`}
        >
            <div className={`max-w-6xl mx-auto w-full ${isMobile ? 'px-0 py-0' : 'px-8 py-16'}`}>
                <div className={`flex flex-col md:flex-row ${isMobile ? 'gap-0' : 'gap-8'}`}>
                    <div className="md:w-1/3 lg:w-[29%]">
                        <ProfileSidebar isMobile={isMobile} />
                    </div>
                    <div className="md:flex-1">
                        <ProfileContent
                            isMobile={isMobile}
                            watchHistory={watchHistory}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;