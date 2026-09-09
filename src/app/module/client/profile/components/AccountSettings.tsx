import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Bell, ChevronRight, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/app/stores/authStore';
import { useSubscriptionStore } from '@/app/stores/subscriptionStore';

interface AccountSettingsProps {
    isMobile: boolean;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ isMobile }) => {
    const { user } = useAuthStore();
    const { subscription, hasFetched, fetchSubscription } = useSubscriptionStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!hasFetched) fetchSubscription();
    }, [hasFetched, fetchSubscription]);

    const subscriptionLabel = subscription?.status === 'active'
        ? subscription.plan?.name || 'Unlimited Monthly Pass'
        : 'Basic Member';

    const settings: Array<{ icon: LucideIcon; label: string; value: string; accent?: boolean; onClick: () => void }> = [
        { icon: Star, label: 'Active Subscription', value: subscriptionLabel, accent: true, onClick: () => navigate('/subscription-plan') },
        { icon: ShoppingBag, label: 'My Purchases', value: `${user?.stats?.purchases_count || 0} items in library`, onClick: () => navigate('/library') },
        { icon: Bell, label: 'Account Notifications', value: 'Enabled', onClick: () => {} },
    ];

    return (
        <div className={`${isMobile ? 'px-6 pb-24' : ''}`}>
            <p className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                Account Settings
            </p>
            <div className="flex flex-col gap-2">
                {settings.map((item, idx) => (
                    <SettingItem key={idx} {...item} />
                ))}
            </div>
        </div>
    );
};

const SettingItem: React.FC<{ icon: LucideIcon; label: string; value: string; accent?: boolean; onClick: () => void }> =
    ({ icon: Icon, label, value, accent, onClick }) => (
        <button
            type="button"
            onClick={onClick}
            className="p-5 rounded-2xl bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-ocean-border-light/30 dark:border-ocean-border-dark/30 hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4 group w-full text-left"
        >
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-black/40 flex items-center justify-center group-hover:bg-primary/10">
                <Icon size={20} className={accent ? 'text-primary' : 'text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark'} />
            </div>
            <div className="flex-1">
                <p className="text-[13px] font-black tracking-tight">{label}</p>
                <p className="text-[11px] text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark font-bold">{value}</p>
            </div>
            <ChevronRight className="text-ocean-border-light dark:text-ocean-border-dark group-hover:text-primary transition-colors" />
        </button>
    );

export default AccountSettings;
