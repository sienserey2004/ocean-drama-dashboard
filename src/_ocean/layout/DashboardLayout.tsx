import { useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  InputBase,
  Paper,
  Stack,
  useTheme,
  alpha,
  Chip,
  GlobalStyles,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  VideoLibrary,
  PlayCircle,
  People,
  RateReview,
  Report,
  Category,
  BarChart,
  Notifications,
  Logout,
  AttachMoney,
  Person,
  ChevronLeft,
  ChevronRight,
  Search,
  AutoGraph,
  Security,
  DarkMode, 
  LightMode, 
  ManageHistory,
  WorkspacePremium
} from "@mui/icons-material";
import { useAppStore } from "@/app/stores/appStore";
import { useAuthStore } from "@/app/stores/authStore";
import { useSubscriptionStore } from "@/app/stores/subscriptionStore";
import MobileBottomNav from "./components/MobileBottomNav";
import toast from "react-hot-toast";
import { Crown } from "lucide-react";
import { useEffect } from "react";

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

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
    title: "Analytics & Monitoring",
    items: [
      {
        label: "Platform Overview",
        icon: <DashboardIcon />,
        path: "/dashboard/admin/stats",
        adminOnly: true,
        badge: "Live"
      },
      {
        label: "Content Performance",
        icon: <BarChart />,
        path: "/dashboard/analytics",
      },
    ],
  },
  {
    title: "Content Governance",
    items: [
      {
        label: "Drama Review Queue",
        icon: <RateReview />,
        path: "/dashboard/admin/review",
        adminOnly: true,
      },
      {
        label: "Category Manager",
        icon: <Category />,
        path: "/dashboard/admin/categories",
        adminOnly: true,
      },
      {
        label: "Global Library",
        icon: <PlayCircle />,
        path: "/dashboard/browse",
      },
    ],
  },
  {
    title: "My Creative Studio",
    items: [
      {
        label: "My Video Assets",
        icon: <VideoLibrary />,
        path: "/dashboard/videos",
        creatorOrAdmin: true,
      },
      {
        label: "Earnings & Revenue",
        icon: <AttachMoney />,
        path: "/dashboard/earnings",
        creatorOrAdmin: true,
      },
    ],
  },
  {
    title: "Users & Security",
    items: [
      {
        label: "User Accounts",
        icon: <People />,
        path: "/dashboard/admin/users",
        adminOnly: true,
      },
      {
        label: "Reported Issues",
        icon: <Security />,
        path: "/dashboard/admin/reports",
        adminOnly: true,
      },
      {
        label: "Audit Logs",
        icon: <ManageHistory />,
        path: "/dashboard/admin/users", // Reusing user path for logs if no separate log path exists
        adminOnly: true,
      },
    ],
  },
  {
    title: "Personal Space",
    items: [
      {
        label: "Account Settings",
        icon: <Person />,
        path: "/dashboard/profile",
      },
      {
        label: "Push Center",
        icon: <Notifications />,
        path: "/dashboard/admin/notifications",
        adminOnly: true,
      },
    ],
  },
];

export default function DashboardLayout() {
  const { user, isAdmin, isCreator, logout, isAuthenticated } = useAuthStore();
  const { subscription, fetchSubscription, hasFetched, clearSubscription } = useSubscriptionStore();
  const isViewer = user?.role === 'viewer';
  const { themeMode, toggleTheme } = useAppStore();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !hasFetched) {
      fetchSubscription();
    }
  }, [isAuthenticated, hasFetched, fetchSubscription]);

  // new tabs here
  const viewerDashboardNavItems = [
    { label: "App Studio", icon: <AutoGraph />, path: "/dashboard/app-studio" },
    { label: "My Uploads", icon: <VideoLibrary />, path: "/dashboard/videos" },
    { label: "Revenue", icon: <AttachMoney />, path: "/dashboard/earnings" },
    { label: "Profile", icon: <Person />, path: "/dashboard/profile" },
    { label: "Home", icon: <PlayCircle />, path: "/" },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isDark = themeMode === "dark";

  // Premium Colors
  const azure = "#0EA5E9";
  const sidebarBg = "#020617"; // bg-slate-950

  const handleLogout = async () => {
    await logout();
    clearSubscription();
    toast.success("System session terminated");
    navigate("/login");
  };

  const SidebarContent = useMemo(() => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: sidebarBg,
        color: "#F1F5F9",
        overflow: "hidden"
      }}
    >
      {/* Brand Logo Section */}
      <Box
        sx={{
          py: 4,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          mb: 2
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: azure,
              width: 40,
              height: 40,
              borderRadius: "12px",
              boxShadow: `0 0 20px ${alpha(azure, 0.4)}`,
            }}
          >
            <PlayCircle sx={{ fontSize: 24, color: "white" }} />
          </Avatar>
          {!collapsed && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: "-1px", color: "white" }}>
                OCEAN DRAMA APP
              </Typography>
              <Typography variant="caption" sx={{ color: azure, fontWeight: 800, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                Monitoring System
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Categorized Navigation */}
      <Box sx={{ flex: 1, px: 2, overflowY: "auto", "&::-webkit-scrollbar": { width: 0 } }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.adminOnly) return isAdmin;
            if (item.creatorOrAdmin) return isAdmin || isCreator || user?.role === 'viewer';
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <Box key={group.title} sx={{ mb: 3 }}>
              {!collapsed && (
                <Typography variant="caption" sx={{ px: 2, mb: 1, display: "block", color: "#94A3B8", opacity: 0.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "0.55rem" }}>
                  {group.title}
                </Typography>
              )}
              <List disablePadding>
                {visibleItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => {
                          navigate(item.path);
                          if (mobileOpen) setMobileOpen(false);
                        }}
                        sx={{
                          borderRadius: "12px",
                          minHeight: 48,
                          px: collapsed ? 0 : 2,
                          justifyContent: collapsed ? "center" : "flex-start",
                          bgcolor: active ? "white" : "transparent",
                          color: active ? "#020617" : "#94A3B8",
                          "&:hover": {
                            bgcolor: active ? "white" : alpha("#FFFFFF", 0.05),
                            color: active ? "#020617" : "white",
                          },
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 38, color: "inherit" }}>
                          {item.icon}
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: active ? 800 : 600 }}
                          />
                        )}
                        {item.badge && !collapsed && (
                          <Chip 
                            label={item.badge} 
                            size="small" 
                            sx={{ 
                              height: 18, 
                              fontSize: "0.6rem", 
                              fontWeight: 900, 
                              bgcolor: active ? azure : alpha(azure, 0.2), 
                              color: active ? "white" : azure, 
                              border: "none" 
                            }} 
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Coverage Stats Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "rgba(255,255,255,0.05)" }}>
        {!collapsed && (
           <Box sx={{ p: 1.5, borderRadius: "16px", bgcolor: alpha("#FFFFFF", 0.03), mb: 2 }}>
             <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mb: 0.5, opacity: 0.7 }}>Coverage Stats</Typography>
             <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <AutoGraph sx={{ fontSize: 16, color: azure }} />
                <Typography variant="body2" sx={{ fontWeight: 800, color: "white" }}>100% Operational</Typography>
             </Box>
           </Box>
        )}
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: "12px", color: "#EF4444", "&:hover": { bgcolor: alpha("#EF4444", 0.1) } }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: collapsed ? 0 : 38 }}>
            <Logout sx={{ fontSize: 20 }} />
          </ListItemIcon>
          {!collapsed && <ListItemText primary="Terminate Session" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 700 }} />}
        </ListItemButton>
      </Box>
    </Box>
  ), [collapsed, location.pathname, isAdmin, isCreator, mobileOpen, user]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <GlobalStyles styles={{
        body: {
          background: isDark 
            ? `radial-gradient(circle at center top, rgba(14,165,233,0.15) 0%, transparent 50%), linear-gradient(to bottom, #0F172A, #020617)`
            : `radial-gradient(circle at center top, rgba(14,165,233,0.14) 0%, transparent 40%), linear-gradient(to bottom, #F8FAFC, #EEF6FF)`,
          backgroundAttachment: 'fixed',
          fontFamily: "'Roboto', 'Segoe UI', sans-serif !important"
        }
      }} />

      {/* Sidebar Interface */}
      {!isViewer && (
        <Box component="nav" sx={{ width: { md: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }, flexShrink: { md: 0 }, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", willChange: "width" }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: EXPANDED_WIDTH, border: "none" } }}
          >
            {SidebarContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
                border: "none",
                borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                willChange: "width"
              },
            }}
          >
            {SidebarContent}
          </Drawer>
        </Box>
      )}

      {/* Main Content Area (Glassmorphic Window) */}
      {/* Main Content Area (Glassmorphic Window) */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto" }}>
        {!isViewer && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              top: 0,
              zIndex: 1100,
              bgcolor: isDark ? alpha("#0F172A", 0.9) : alpha("#F8FAFC", 0.9),
              backdropFilter: "blur(12px)",
              color: isDark ? "white" : "#0F172A",
              px: { xs: 2, md: 6 },
              py: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              mb: 3
            }}
          >
            <Toolbar sx={{ px: "0 !important", gap: 2 }}>
              <IconButton
                sx={{ display: { md: "none" }, color: "inherit" }}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>

              <IconButton
                onClick={() => setCollapsed(!collapsed)}
                sx={{
                  display: { xs: "none", md: "flex" },
                  bgcolor: isDark ? alpha("#FFFFFF", 0.05) : alpha("#0F172A", 0.05),
                  borderRadius: "12px",
                  color: "inherit"
                }}
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </IconButton>

              <Paper
                elevation={0}
                sx={{
                  flexGrow: 1,
                  maxWidth: 400,
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 0.5,
                  borderRadius: "12px",
                  bgcolor: isDark ? alpha("#FFFFFF", 0.05) : alpha("#FFFFFF", 0.8),
                  backdropFilter: "blur(10px)",
                  border: "1px solid",
                  borderColor: isDark ? alpha("#FFFFFF", 0.1) : "rgba(0,0,0,0.05)"
                }}
              >
                <Search sx={{ color: "text.secondary", fontSize: 20, mr: 1 }} />
                <InputBase placeholder="System Search..." sx={{ flex: 1, fontSize: "0.85rem", fontWeight: 500 }} />
              </Paper>

              <Box sx={{ flexGrow: 1 }} />

              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={toggleTheme} sx={{ color: azure }}>
                  {isDark ? <LightMode /> : <DarkMode />}
                </IconButton>
                
                <Badge badgeContent={4} color="error" overlap="circular">
                  <IconButton sx={{ color: "text.secondary" }}>
                    <Notifications />
                  </IconButton>
                </Badge>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: "center" }} />

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: "pointer" }} onClick={(e) => setAnchorEl(e.currentTarget)}>
                   <Avatar 
                      src={user?.profile_image || ""} 
                      sx={{ width: 36, height: 36, borderRadius: "10px", border: `2px solid ${azure}` }} 
                   />
                   <Box sx={{ display: { xs: "none", sm: "block" } }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                         <Typography variant="body2" fontWeight={800}>{user?.name}</Typography>
                         {subscription?.status === 'active' && (
                            <Chip 
                               label="PREMIUM" 
                               size="small" 
                               icon={<Crown size={10} />}
                               sx={{ 
                                  height: 16, 
                                  fontSize: "0.55rem", 
                                  fontWeight: 900, 
                                  bgcolor: "rgba(234, 179, 8, 0.1)", 
                                  color: "#EAB308",
                                  border: "1px solid rgba(234, 179, 8, 0.2)",
                                  "& .MuiChip-icon": { color: "inherit" }
                               }} 
                            />
                         )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.6rem", fontWeight: 900 }}>{user?.role}</Typography>
                   </Box>
                </Stack>
              </Stack>
            </Toolbar>
          </AppBar>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            borderRadius: isViewer ? 0 : "32px",
            bgcolor: isViewer ? "transparent" : (isDark ? alpha("#0F172A", 0.75) : alpha("#FFFFFF", 0.75)),
            backdropFilter: isViewer ? "none" : "blur(8px) saturate(140%)",
            willChange: "width, margin, padding",
            border: isViewer ? "none" : "1px solid",
            borderColor: isDark ? alpha("#FFFFFF", 0.1) : alpha("#0EA5E9", 0.1),
            mx: isViewer ? 0 : { xs: 1, md: 3 },
            mb: isViewer ? 0 : { xs: 1, md: 3 },
            p: isViewer ? 0 : { xs: 2, md: 4 },
            boxShadow: isViewer ? "none" : (isDark ? "0 20px 60px -15px rgba(0,0,0,0.4)" : "0 20px 60px -15px rgba(14,165,233,0.1)"),
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            pb: isViewer ? 12 : 0 // Space for bottom nav
          }}
        >
          <Outlet />
        </Box>

        {isViewer && (
          <MobileBottomNav
            user={user}
            isAuthenticated={isAuthenticated}
            location={location}
            navigate={navigate}
            items={viewerDashboardNavItems}
          />
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5,
              borderRadius: "16px",
              minWidth: 200,
              bgcolor: isDark ? "#1E293B" : "white",
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)"
            }
          }}
        >
          <MenuItem onClick={() => { navigate("/dashboard/profile"); setAnchorEl(null); }}>
             <ListItemIcon><Person fontSize="small" /></ListItemIcon>
             Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
             <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
             Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
