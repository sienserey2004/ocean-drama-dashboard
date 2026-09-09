import { useState, useCallback, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu as HamburgerIcon,
  BarChart3,
  PlayCircle,
  Library,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Sun,
  Moon,
  Bell,
  LogOut,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Crown, Coins } from "lucide-react";
import { useAppStore } from "@/app/stores/appStore";
import { useAuthStore } from "@/app/stores/authStore";
import { useSubscriptionStore } from "@/app/stores/subscriptionStore";
import { notificationApi } from "@/app/api/notification.service";
import type { Notification } from "@/app/types";
import MobileBottomNav from "./components/MobileBottomNav";
import toast from "@/app/utils/toast";
import { Avatar, Badge, Chip, IconButton, Menu, MenuItem, Divider } from "@/_ocean/ui";
import "@/app/module/shared/adminlte/adminlte.css";

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

// Nested routes (e.g. /dashboard/videos/:id/episodes) should keep their parent
// nav item highlighted. The longest matching path wins, so /dashboard/videos/create
// lights up "Create Video" rather than "Videos".
function matchNavPath(pathname: string, paths: string[]): string | null {
  return paths
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0] ?? null;
}
interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
  creatorOrAdmin?: boolean;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Analytics",
    items: [{ label: "Performance", icon: <BarChart3 size={20} />, path: "/dashboard/analytics" }],
  },
  {
    title: "Browse",
    items: [{ label: "All Videos", icon: <PlayCircle size={20} />, path: "/dashboard/browse" }],
  },
  {
    title: "Studio",
    items: [
      { label: "Videos", icon: <Library size={20} />, path: "/dashboard/videos", creatorOrAdmin: true },
      { label: "Create Video", icon: <Upload size={20} />, path: "/dashboard/videos/create", creatorOrAdmin: true },
      { label: "Earnings", icon: <DollarSign size={20} />, path: "/dashboard/earnings", creatorOrAdmin: true },
    ],
  },
  {
    title: "Admin",
    items: [{ label: "App Studio", icon: <TrendingUp size={20} />, path: "/dashboard/app-studio", adminOnly: true }],
  },
  {
    title: "Account",
    items: [{ label: "Settings", icon: <User size={20} />, path: "/dashboard/profile" }],
  },
];

export default function DashboardLayout() {
  const { user, isAdmin, isCreator, logout, isAuthenticated } = useAuthStore();
  const { subscription, fetchSubscription, hasFetched, clearSubscription } = useSubscriptionStore();
  const isViewer = user?.role === "viewer";
  const { themeMode, toggleTheme } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !hasFetched) {
      fetchSubscription();
    }
  }, [isAuthenticated, hasFetched, fetchSubscription]);

  const viewerDashboardNavItems = [
    { label: "App Studio", icon: <TrendingUp size={20} />, path: "/dashboard/app-studio" },
    { label: "Coins", icon: <Coins size={20} />, path: "/coins" },
    { label: "My Uploads", icon: <Library size={20} />, path: "/dashboard/videos" },
    { label: "Revenue", icon: <DollarSign size={20} />, path: "/dashboard/earnings" },
    { label: "Profile", icon: <User size={20} />, path: "/dashboard/profile" },
    { label: "Home", icon: <PlayCircle size={20} />, path: "/" },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifItems, setNotifItems] = useState<Notification[] | null>(null);
  const profileAnchorRef = useRef<HTMLButtonElement>(null);
  const notifAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationApi
      .unreadCount()
      .then((res) => setUnreadCount(res.unread_count ?? 0))
      .catch(() => setUnreadCount(0));
  }, [isAuthenticated]);

  const isDark = themeMode === "dark";
  const navItems = NAV_GROUPS.flatMap((group) => group.items);
  const activeNavPath = matchNavPath(location.pathname, navItems.map((item) => item.path));
  const currentSection = navItems.find((item) => item.path === activeNavPath)?.label || "Dashboard";
  const viewerBackground = isDark
    ? "radial-gradient(circle at center top, rgba(14,165,233,0.15) 0%, transparent 50%), linear-gradient(to bottom, #0F172A, #020617)"
    : "radial-gradient(circle at center top, rgba(14,165,233,0.14) 0%, transparent 40%), linear-gradient(to bottom, #F8FAFC, #EEF6FF)";

  const handleLogout = useCallback(async () => {
    await logout();
    clearSubscription();
    toast.success("You've been logged out.");
    navigate("/login");
  }, [logout, clearSubscription, navigate]);

  const openNotifications = useCallback(() => {
    setNotifOpen((prev) => !prev);
    if (!notifItems) {
      notificationApi
        .list({ limit: 5 })
        .then((res) => setNotifItems(res.data ?? []))
        .catch(() => setNotifItems([]));
    }
  }, [notifItems]);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead().catch(() => {});
    setUnreadCount(0);
    setNotifItems((items) => items?.map((n) => ({ ...n, is_read: true })) ?? items);
  }, []);

  const sidebarBody = (
    <div className={`lte-sidebar-inner ${collapsed ? "is-collapsed" : ""}`}>
      <button type="button" className="brand-link" onClick={() => navigate("/dashboard")}>
        <span className="brand-image"><PlayCircle size={24} /></span>
        {!collapsed && (
          <span className="brand-copy">
            <strong>Ocean Drama</strong>
            <small>{isAdmin ? "Admin Console" : isCreator ? "Creator Studio" : "Dashboard"}</small>
          </span>
        )}
      </button>

      <div className="lte-sidebar-content">
        <div className="user-panel">
          <Avatar src={user?.profile_image} alt={user?.name} size="md" className="user-panel-avatar" />
          {!collapsed && (
            <div className="user-panel-info">
              <strong>{user?.name || "Account"}</strong>
              <span><i /> {user?.role || "user"}</span>
            </div>
          )}
        </div>

        <nav className="lte-sidebar-nav" aria-label="Dashboard navigation">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (item.adminOnly) return isAdmin;
              if (item.creatorOrAdmin) return isAdmin || isCreator || user?.role === "viewer";
              return true;
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="nav-section">
                {!collapsed && <div className="nav-header">{group.title}</div>}
                <ul className="nav nav-pills nav-sidebar">
                  {visibleItems.map((item) => {
                    const active = item.path === activeNavPath;
                    const displayLabel = item.label === "Videos" ? (isAdmin ? "Manage Videos" : "My Series") : item.label;
                    return (
                      <li key={item.label} className="nav-item">
                        <button
                          type="button"
                          title={collapsed ? displayLabel : undefined}
                          onClick={() => {
                            navigate(item.path);
                            if (mobileOpen) setMobileOpen(false);
                          }}
                          className={`nav-link ${active ? "active" : ""}`}
                        >
                          <span className="nav-icon">{item.icon}</span>
                          {!collapsed && <span className="nav-label">{displayLabel}</span>}
                          {item.badge && !collapsed && <span className="nav-badge">{item.badge}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="lte-sidebar-footer">
        <button type="button" className="nav-link logout-link" onClick={handleLogout} title={collapsed ? "Log out" : undefined}>
          <span className="nav-icon"><LogOut size={19} /></span>
          {!collapsed && <span className="nav-label">Log Out</span>}
        </button>
        <button type="button" className="sidebar-collapse" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse sidebar</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={isViewer ? "relative flex min-h-screen overflow-hidden" : "adminlte-shell"}
      style={isViewer ? { background: viewerBackground, backgroundAttachment: "fixed" } : undefined}
    >
      {/* Sidebar */}
      {!isViewer && (
        <>
          {/* Mobile drawer */}
          <div className={`lte-mobile-sidebar md:hidden ${mobileOpen ? "open" : ""}`}>
            <div
              className="lte-mobile-backdrop"
              onClick={() => setMobileOpen(false)}
            />
            <div
              className="lte-mobile-panel"
              style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
            >
              {sidebarBody}
            </div>
          </div>

          {/* Desktop permanent sidebar */}
          <aside
            className="lte-main-sidebar hidden md:block"
            style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
          >
            {sidebarBody}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className={isViewer ? "flex h-screen min-w-0 flex-1 flex-col overflow-y-auto" : "lte-main-area"}>
        {!isViewer && (
          <header className="lte-main-header">
            <div className="lte-navbar">
              <IconButton className="lte-nav-button md:hidden" onClick={() => setMobileOpen(true)}>
                <HamburgerIcon size={22} />
              </IconButton>

              <div className="lte-navbar-search">
                <Search size={16} />
                <span>
                  Search
                </span>
                <kbd>
                  ⌘K
                </kbd>
              </div>

              <div className="lte-navbar-location">
                <button type="button" onClick={() => navigate("/dashboard")}>Home</button>
                <span>/</span>
                <strong>{currentSection === "Videos" && isAdmin ? "Manage Videos" : currentSection}</strong>
              </div>

              <div className="lte-navbar-actions">
                <IconButton onClick={toggleTheme} plain className="lte-nav-button" aria-label="Toggle theme">
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </IconButton>

                <div className="relative lte-navbar-menu">
                  <IconButton ref={notifAnchorRef} className="lte-nav-button" onClick={openNotifications} aria-label="Notifications">
                    <Badge count={unreadCount}>
                      <Bell size={20} />
                    </Badge>
                  </IconButton>
                  <Menu open={notifOpen} onClose={() => setNotifOpen(false)} anchorRef={notifAnchorRef} className="w-80">
                    <div className="flex items-center justify-between px-4 pb-2">
                      <p className="text-sm font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
                        Notifications
                      </p>
                      {!!unreadCount && (
                        <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <Divider className="mb-1" />
                    {notifItems === null ? (
                      <p className="px-4 py-6 text-center text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                        Loading…
                      </p>
                    ) : notifItems.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                        You're all caught up.
                      </p>
                    ) : (
                      <ul className="max-h-80 overflow-y-auto">
                        {notifItems.map((n) => (
                          <li key={n.notification_id} className="px-4 py-2.5 hover:bg-ocean-background-light dark:hover:bg-ocean-background-dark">
                            <div className="flex items-start gap-2">
                              {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                              <div className={n.is_read ? "pl-3.5" : ""}>
                                <p className="text-sm font-semibold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">{n.title}</p>
                                <p className="text-xs text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">{n.message}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Menu>
                </div>

                <span className="lte-navbar-divider" />

                <div className="relative lte-navbar-menu">
                  <button ref={profileAnchorRef} className="lte-user-menu-button" onClick={() => setProfileMenuOpen((v) => !v)}>
                    <Avatar src={user?.profile_image} alt={user?.name} size="md" className="lte-navbar-avatar" />
                    <div className="lte-user-menu-copy">
                      <div className="lte-user-menu-name">
                        <span>{user?.name || "Account"}</span>
                        {subscription?.status === "active" && (
                          <Chip label="PREMIUM" size="sm" icon={<Crown size={10} />} className="!bg-yellow-500/10 !text-yellow-500" />
                        )}
                      </div>
                      <small>{user?.role?.toUpperCase()}</small>
                    </div>
                  </button>
                  <Menu open={profileMenuOpen} onClose={() => setProfileMenuOpen(false)} anchorRef={profileAnchorRef}>
                    <MenuItem onClick={() => { navigate("/dashboard/profile"); setProfileMenuOpen(false); }}>
                      <User size={16} /> Profile
                    </MenuItem>
                    <Divider className="my-1" />
                    <MenuItem danger onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </MenuItem>
                  </Menu>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className={isViewer ? "flex-1 p-0" : "lte-content-wrapper"}>
          <Outlet />
        </main>

        {isViewer && (
          <MobileBottomNav user={user} isAuthenticated={isAuthenticated} location={location} navigate={navigate} items={viewerDashboardNavItems} />
        )}
      </div>
    </div>
  );
}
