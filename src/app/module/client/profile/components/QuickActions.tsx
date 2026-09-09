import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '@/app/utils/toast';
import {
    Heart, ShoppingBag, History, Wallet, Store,
    MessageSquare, MapPin, HelpCircle, type LucideIcon
} from 'lucide-react';

interface QuickActionsProps {
    isMobile: boolean;
}

interface ActionDef {
    icon: LucideIcon;
    label: string;
    badge?: string;
    path?: string;
    comingSoon?: boolean;
}

const actions: ActionDef[] = [
    { icon: Heart, label: 'Favorites', path: '/favorites' },
    { icon: ShoppingBag, label: 'My Library', path: '/library' },
    { icon: History, label: 'Watch History', path: '/watch-history' },
    { icon: Wallet, label: 'Wallet', path: '/coins' },
    { icon: Store, label: 'Store', comingSoon: true },
    { icon: MessageSquare, label: 'Reviews', badge: 'NEW', comingSoon: true },
    { icon: MapPin, label: 'Following', path: '/following' },
    { icon: HelpCircle, label: 'Support', comingSoon: true },
];

const QuickActions: React.FC<QuickActionsProps> = ({ isMobile }) => {
    const navigate = useNavigate();

    const handleClick = (item: ActionDef) => {
        if (item.comingSoon) {
            toast('This feature has not been implemented yet', { icon: '🚧' });
            return;
        }
        if (item.path) navigate(item.path);
    };

    return (
        <div className={`${isMobile ? 'px-6' : ''} mb-10`}>
            <SectionTitle title="Quick Actions" />
            <div className={`grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8 ${isMobile ? 'gap-2' : 'gap-3'}`}>
                {actions.map((item, idx) => (
                    <ActionItem key={idx} icon={item.icon} label={item.label} badge={item.badge} onClick={() => handleClick(item)} />
                ))}
            </div>
        </div>
    );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-3 bg-primary rounded-full"></span> {title}
    </div>
);

const ActionItem: React.FC<{ icon: LucideIcon; label: string; badge?: string; onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-2 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group"
    >
        <div className="w-14 h-14 rounded-2xl bg-ocean-card-light dark:bg-ocean-card-dark border border-ocean-border-light dark:border-ocean-border-dark flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-glow">
            <Icon size={24} className="text-primary" />
        </div>
        <span className="text-[10px] font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark text-center group-hover:text-ocean-text-primary-light dark:group-hover:text-ocean-text-primary-dark transition-colors leading-tight">
            {label}
        </span>
    </button>
);

export default QuickActions;
