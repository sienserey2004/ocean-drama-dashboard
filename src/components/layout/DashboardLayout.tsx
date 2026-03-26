import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, IconButton, Typography, Avatar, Menu, MenuItem,
  Divider, Badge, Tooltip, Collapse,
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, VideoLibrary, PlayCircle,
  People, RateReview, Report, Category, BarChart, Notifications,
  AccountCircle, Logout, AttachMoney, Person, ExpandLess, ExpandMore,
  Lock, DarkMode, LightMode, OndemandVideo,
} from '@mui/icons-material'
import { Tooltip as MuiTooltip } from '@mui/material'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

const DRAWER_WIDTH = 240

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  adminOnly?: boolean
  creatorOrAdmin?: boolean
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Admin Stats',    icon: <Dashboard />,       path: '/dashboard/admin/stats',         adminOnly: true },
  { label: 'Analytics',      icon: <Dashboard />,       path: '/dashboard/analytics' },
  { label: 'Browse Videos',  icon: <OndemandVideo />,   path: '/dashboard/browse' },
  { label: 'My Videos',      icon: <VideoLibrary />,    path: '/dashboard/videos',  creatorOrAdmin: true },
  { label: 'Earnings',       icon: <AttachMoney />,     path: '/dashboard/earnings', creatorOrAdmin: true },
  { label: 'Profile',        icon: <Person />,          path: '/dashboard/profile' },
  { label: 'Review Queue',   icon: <RateReview />,      path: '/dashboard/admin/review',        adminOnly: true },
  { label: 'Users',          icon: <People />,          path: '/dashboard/admin/users',         adminOnly: true },
  { label: 'Reports',        icon: <Report />,          path: '/dashboard/admin/reports',       adminOnly: true },
  { label: 'Categories',     icon: <Category />,        path: '/dashboard/admin/categories',    adminOnly: true },
  { label: 'Revenue',        icon: <BarChart />,        path: '/dashboard/admin/revenue',       adminOnly: true },
  { label: 'Notifications',  icon: <Notifications />,   path: '/dashboard/admin/notifications', adminOnly: true },
]

export default function DashboardLayout() {
  const { user, isAdmin, isCreator, logout } = useAuthStore()
  const { themeMode, toggleTheme } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/login')
  }

  const canAccess = (item: NavItem) => {
    if (item.adminOnly) return isAdmin
    if (item.creatorOrAdmin) return isAdmin || isCreator
    return true
  }

  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" color="primary" fontWeight={700}>DramaStream</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Box
            sx={{
              px: 1, py: 0.25, borderRadius: 99, fontSize: '0.7rem', fontWeight: 600,
              bgcolor: user?.role === 'admin' ? 'error.light' : user?.role === 'creator' ? 'secondary.light' : 'grey.200',
              color: user?.role === 'admin' ? 'error.main' : user?.role === 'creator' ? 'secondary.main' : 'text.secondary',
              textTransform: 'capitalize'
            }}
          >
            {user?.role}
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>{user?.name}</Typography>
        </Box>
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menu
        </Typography>
        {NAV_ITEMS.map((item) => {
          const accessible = canAccess(item)
          const active = location.pathname === item.path
          return (
            <Tooltip key={item.path} title={!accessible ? 'Admin access required' : ''} placement="right">
              <span>
                <ListItem disablePadding sx={{ mb: 0.25 }}>
                  <ListItemButton
                    disabled={!accessible}
                    selected={active}
                    onClick={() => accessible && navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.main', '& .MuiListItemIcon-root': { color: 'primary.main' } },
                      '&.Mui-disabled': { opacity: 0.4 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, '& svg': { fontSize: 18 } }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400 }} />
                    {!accessible && <Lock sx={{ fontSize: 12, color: 'text.disabled' }} />}
                  </ListItemButton>
                </ListItem>
              </span>
            </Tooltip>
          )
        })}
      </List>

      {/* User footer */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 36 }}><Logout sx={{ fontSize: 18, color: 'error.main' }} /></ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: '0.8125rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile.
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          <SidebarContent />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', borderRight: '1px solid rgba(0,0,0,0.08)' },
          }}
        >
          <SidebarContent />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {/* Topbar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(0,0,0,0.08)', color: 'text.primary' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, fontSize: '0.9rem' }}>
              {NAV_ITEMS.find(i => i.path === location.pathname)?.label ?? 'Dashboard'}
            </Typography>
            <MuiTooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                {themeMode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
              </IconButton>
            </MuiTooltip>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: user?.role === 'admin' ? 'error.light' : user?.role === 'creator' ? 'secondary.light' : 'grey.200', color: user?.role === 'admin' ? 'error.main' : user?.role === 'creator' ? 'secondary.main' : 'text.secondary', fontSize: '0.8rem' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => { navigate('/dashboard/profile'); setAnchorEl(null) }}>
                <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Sign out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
