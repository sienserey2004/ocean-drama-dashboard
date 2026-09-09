import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, PartyPopper, CreditCard, AlertTriangle, Info, type LucideIcon } from 'lucide-react';
import toast from '@/app/utils/toast';
import { notificationApi } from '@/app/api/notification.service';
import { Notification, NotificationType } from '@/app/types';
import { Spinner, IconButton, Button } from '@/_ocean/ui';

const ICONS: Record<NotificationType, LucideIcon> = {
    new_episode: PartyPopper,
    payment: CreditCard,
    system: Info,
    warning: AlertTriangle,
};

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationApi.list({ limit: 50 });
            setNotifications(res?.data || []);
            setUnreadCount(res?.unread_count ?? 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkRead = async (n: Notification) => {
        if (n.is_read) return;
        setNotifications((prev) => prev.map((item) => (item.notification_id === n.notification_id ? { ...item, is_read: true } : item)));
        setUnreadCount((c) => Math.max(0, c - 1));
        try {
            await notificationApi.markRead(n.notification_id);
        } catch (err) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
        setUnreadCount(0);
        try {
            await notificationApi.markAllRead();
        } catch (err) {
            toast.error('Failed to mark all as read');
        }
    };

    return (
        <div className="min-h-screen bg-ocean-background-light dark:bg-ocean-background-dark bg-ocean-radial bg-fixed text-ocean-text-primary-light dark:text-ocean-text-primary-dark pb-24">
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <IconButton onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} />
                        </IconButton>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Notifications</h1>
                    </div>
                    {unreadCount > 0 && (
                        <Button size="sm" variant="outlined" onClick={handleMarkAllRead}>
                            Mark all read
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <Spinner size={32} className="text-primary" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-ocean-card-light/50 dark:bg-ocean-card-dark/50 border border-dashed border-ocean-border-light dark:border-ocean-border-dark rounded-3xl p-16 flex flex-col items-center justify-center text-center opacity-60">
                        <Bell size={40} className="mb-3" />
                        <p className="font-bold">You're all caught up</p>
                        <p className="text-sm mt-1">New episode drops and account updates will show up here</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {notifications.map((n) => {
                            const Icon = ICONS[n.type] || Info;
                            return (
                                <button
                                    key={n.notification_id}
                                    type="button"
                                    onClick={() => handleMarkRead(n)}
                                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                                        n.is_read
                                            ? 'bg-ocean-card-light/30 dark:bg-ocean-card-dark/30 border-ocean-border-light/20 dark:border-ocean-border-dark/20 opacity-70'
                                            : 'bg-ocean-card-light dark:bg-ocean-card-dark border-primary/30'
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon size={18} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black">{n.title}</p>
                                        <p className="text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark mt-0.5">{n.message}</p>
                                        <p className="text-[10px] text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark opacity-60 mt-1">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
