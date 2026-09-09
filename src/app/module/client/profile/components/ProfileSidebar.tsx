import React from 'react';
import { Settings, User, LogOut } from 'lucide-react';
import { IconButton, Button } from '@/_ocean/ui';
import { useAuthStore } from '@/app/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface ProfileSidebarProps {
    isMobile: boolean;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isMobile }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const stats = [
        { label: 'Watched', value: user?.stats?.watch_history_count || '0' },
        { label: 'Library', value: user?.stats?.purchases_count || '0' },
        { label: 'Favorites', value: user?.stats?.favorites_count || '0' },
        { label: 'Following', value: user?.stats?.following_count || '0' },
    ];

    return (
        <div className={`bg-ocean-surface-light/60 dark:bg-ocean-surface-dark/60 backdrop-blur-xl border-ocean-border-light/50 dark:border-ocean-border-dark/50 shadow-2xl overflow-hidden flex flex-col
            ${isMobile ? 'rounded-none border-b' : 'rounded-3xl border h-full'}`}>

            <ProfileHeader />
            <ProfileBio user={user} isMobile={isMobile} stats={stats} />
            <VipPromotion onUpgrade={() => navigate('/subscription-plan')} />

            <LogoutButton />
        </div>
    );
};

const ProfileHeader: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="px-6 pt-6 flex justify-between items-center bg-gradient-to-b from-primary/10 to-transparent">
            <span
                className="text-xl font-black uppercase text-ocean-text-primary-light dark:text-ocean-text-primary-dark [text-shadow:2px_2px_0px_#0EA5E9]"
                style={{ fontFamily: "'Oswald', sans-serif" }}
            >
                OCEAN DRAMA
            </span>
            <IconButton
                plain
                className="bg-ocean-border-light/50 dark:bg-ocean-border-dark/50 text-ocean-text-primary-light dark:text-ocean-text-primary-dark"
                onClick={() => navigate('/dashboard/profile')}
            >
                <Settings size={20} />
            </IconButton>
        </div>
    );
};

interface ProfileBioProps {
    user: any;
    isMobile: boolean;
    stats: Array<{ label: string; value: string | number }>;
}

const ProfileBio: React.FC<ProfileBioProps> = ({ user, isMobile, stats }) => (
    <div className="p-8 flex flex-col items-center text-center">
        <div className="relative">
            <div
                className={`rounded-full flex items-center justify-center bg-ocean-card-light dark:bg-ocean-card-dark border-4 border-primary shadow-glow text-ocean-text-primary-light dark:text-ocean-text-primary-dark text-4xl font-black overflow-hidden ${isMobile ? 'w-20 h-20' : 'w-[120px] h-[120px]'}`}
            >
                {user?.profile_image ? (
                    <img src={user.profile_image} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                    user?.name?.charAt(0) || <User size={32} />
                )}
            </div>
            <span
                className="absolute bottom-0 right-0 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-glow border-[3px] border-ocean-surface-light dark:border-ocean-surface-dark"
            >
                PRO
            </span>
        </div>

        <p className="mt-5 text-2xl font-black tracking-tight">
            {user?.name || "Guest User"}
        </p>

        <p className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark text-sm font-medium mb-5">
            @{user?.name?.toLowerCase().replace(/\s/g, '') || "guest"} · {user?.role === 'viewer' ? 'Member' : 'VIP Member'}
        </p>

        <button
            type="button"
            className="w-full border border-ocean-border-light dark:border-ocean-border-dark text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark hover:border-primary hover:text-ocean-text-primary-light dark:hover:text-ocean-text-primary-dark transition-all duration-300 rounded-full px-6 py-2 mb-6"
        >
            Edit Profile
        </button>

        <div className="w-full grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
                <StatCard key={idx} label={stat.label} value={stat.value} />
            ))}
        </div>
    </div>
);

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="p-4 bg-ocean-card-light/80 dark:bg-ocean-card-dark/80 rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark hover:border-primary/30 transition-all cursor-pointer">
        <p className="text-xl font-black text-ocean-text-primary-light dark:text-ocean-text-primary-dark">{value}</p>
        <p className="text-[10px] font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark uppercase tracking-widest">{label}</p>
    </div>
);

const VipPromotion: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => (
    <div className="p-4 pt-0">
        <div
            className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 cursor-pointer group hover:scale-[1.03] transition-all duration-300 shadow-glow"
            onClick={onUpgrade}
        >
            <p className="text-white text-xl font-black leading-tight italic mb-1 uppercase tracking-tight">
                Unlimited Pass
            </p>
            <p className="text-white/80 text-[10px] font-bold mb-4 uppercase tracking-widest">
                Early Access · No Ads · 4K
            </p>
            <button
                type="button"
                className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-full shadow-lg py-2"
            >
                Upgrade to start business
            </button>
        </div>
    </div>
);

const LogoutButton: React.FC = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="p-8 pt-0 mt-auto">
            <Button
                variant="text"
                color="default"
                fullWidth
                startIcon={<LogOut size={18} />}
                onClick={handleLogout}
            >
                Log Out
            </Button>
        </div>
    );
};

export default ProfileSidebar;
