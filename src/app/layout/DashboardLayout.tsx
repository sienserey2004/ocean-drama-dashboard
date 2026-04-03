import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, IconButton, Typography, Avatar, Menu, MenuItem,
  Divider, Badge, Tooltip, InputBase, Paper, Stack, useTheme, alpha,
  Chip
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, VideoLibrary, PlayCircle,
  People, RateReview, Report, Category, BarChart, Notifications,
  AccountCircle, Logout, AttachMoney, Person, ExpandLess, ExpandMore,
  Lock, DarkMode, LightMode, OndemandVideo, Search, ChevronLeft, ChevronRight,
  Settings, HelpOutline, Shield, Star, WorkspacePremium
} from '@mui/icons-material'
import { useAppStore } from '@/ocean/stores/appStore'
import { useAuthStore } from '@/ocean/stores/authStore'
import toast from 'react-hot-toast'

const DRAWER_WIDTH = 280
const COLLAPSED_DRAWER_WIDTH = 88

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  adminOnly?: boolean
  creatorOrAdmin?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Insights',
    items: [
      { label: 'Admin Metrics',  icon: <Dashboard />,       path: '/dashboard/admin/stats',         adminOnly: true },
      { label: 'Platform Stats', icon: <BarChart />,        path: '/dashboard/analytics' },
    ]
  },
  {
    title: 'Enterprise Content',
    items: [
      { label: 'Media Library',  icon: <OndemandVideo />,   path: '/dashboard/browse' },
      { label: 'Asset Manager',  icon: <VideoLibrary />,    path: '/dashboard/videos',  creatorOrAdmin: true },
      { label: 'Revenue Yield',  icon: <AttachMoney />,     path: '/dashboard/earnings', creatorOrAdmin: true },
    ]
  },
  {
    title: 'Governance',
    items: [
      { label: 'Review Queue',   icon: <RateReview />,      path: '/dashboard/admin/review',        adminOnly: true },
      { label: 'Member Directory', icon: <People />,        path: '/dashboard/admin/users',         adminOnly: true },
      { label: 'Safety Reports', icon: <Report />,          path: '/dashboard/admin/reports',       adminOnly: true },
      { label: 'Taxonomy Lab',   icon: <Category />,        path: '/dashboard/admin/categories',    adminOnly: true },
    ]
  },
  {
    title: 'Personal',
    items: [
      { label: 'Account Profile', icon: <Person />,          path: '/dashboard/profile' },
      { label: 'Outreach Hub',   icon: <Notifications />,   path: '/dashboard/admin/notifications', adminOnly: true },
    ]
  }
]

export default function DashboardLayout() {
  const { user, isAdmin, isCreator, logout } = useAuthStore()
  const { themeMode, toggleTheme } = useAppStore()
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    await logout()
    toast.success('System sessions cleared')
    navigate('/login')
  }

  const canAccess = (item: NavItem) => {
    if (item.adminOnly) return isAdmin
    if (item.creatorOrAdmin) return isAdmin || isCreator
    return true
  }

  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', position: 'relative' }}>
      {/* Brand Logo Section */}
      <Box sx={{ py: 4, px: 3, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
           <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42, borderRadius: '14px', boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.4)}` }}>
              <PlayCircle sx={{ fontSize: 28, color: 'white' }} />
           </Avatar>
           {!collapsed && (
              <Box>
                 <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: '-1.5px', color: 'text.primary' }}>
                    OceanDrama
                 </Typography>
                 <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    SaaS Dashboard
                 </Typography>
              </Box>
           )}
        </Stack>
      </Box>

      {/* Navigation Ecosystem */}
      <Box sx={{ flex: 1, px: 2, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0 } }}>
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(canAccess)
          if (visibleItems.length === 0) return null
          
          return (
            <Box key={group.title} sx={{ mb: 4 }}>
              {!collapsed && (
                <Typography variant="caption" sx={{ px: 2.5, mb: 1.5, display: 'block', color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.6rem' }}>
                   {group.title}
                </Typography>
              )}
              <List disablePadding>
                {visibleItems.map((item) => {
                  const active = location.pathname.startsWith(item.path)
                  return (
                    <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        onClick={() => navigate(item.path)}
                        selected={active}
                        sx={{
                          borderRadius: '16px',
                          py: 1.4,
                          px: collapsed ? 2 : 2.5,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          mx: 1,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            boxShadow: `0 12px 20px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                            '&:hover': { bgcolor: 'primary.dark' },
                            '& .MuiListItemIcon-root': { color: 'white' }
                          },
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'translateX(6px)',
                            '& .MuiListItemIcon-root': { color: 'primary.main' }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: active ? 'white' : 'text.secondary', transition: 'color 0.2s' }}>
                          {item.icon}
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText 
                            primary={item.label} 
                            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 800 : 600, letterSpacing: '-0.2px' }} 
                          />
                        )}
                        {active && !collapsed && (
                           <Box sx={{ width: 4, height: 20, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 2, ml: 'auto' }} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          )
        })}
      </Box>

      {/* User Context Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        {!collapsed ? (
          <Paper 
            elevation={0} 
            sx={{ 
               p: 1.5, 
               bgcolor: alpha(theme.palette.primary.main, 0.05), 
               borderRadius: '20px', 
               display: 'flex', 
               alignItems: 'center', 
               gap: 1.5,
               border: '1px solid',
               borderColor: alpha(theme.palette.primary.main, 0.1)
            }}
          >
            <Avatar 
              src={user?.profile_image || ''}
              sx={{ 
                width: 44, height: 44, 
                borderRadius: '14px',
                bgcolor: 'primary.main', 
                fontWeight: 800,
                border: '2px solid white'
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>{user?.name}</Typography>
              <Chip label={user?.role} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', borderColor: 'primary.light', color: 'primary.main', px: 0 }} />
            </Box>
            <IconButton size="small" onClick={handleLogout} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }}>
              <Logout fontSize="small" />
            </IconButton>
          </Paper>
        ) : (
          <Stack spacing={2} alignItems="center">
             <Avatar src={user?.profile_image || ''} sx={{ width: 44, height: 44, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
                {user?.name?.charAt(0).toUpperCase()}
             </Avatar>
             <IconButton onClick={handleLogout} color="error" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
               <Logout fontSize="small" />
             </IconButton>
          </Stack>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(249, 250, 251, 1)' : '#0a0a0c' }}>
      {/* Structural Navigation */}
      <Box 
        component="nav" 
        sx={{ 
          width: { md: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH }, 
          flexShrink: { md: 0 },
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxShadow: 24 } }}
        >
          <SidebarContent />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH, 
              boxSizing: 'border-box', 
              border: 'none', 
              borderRight: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.08),
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden'
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      </Box>

      {/* Primary Workflow Surface */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Superior Glassmorphic Toolbar */}
        <AppBar 
          position="sticky" 
          elevation={0} 
          sx={{ 
            bgcolor: alpha(theme.palette.background.paper, 0.8), 
            backdropFilter: 'blur(16px) saturate(180%)',
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.08), 
            color: 'text.primary',
            height: 80,
            zIndex: 1100,
            justifyContent: 'center'
          }}
        >
          <Toolbar sx={{ px: { xs: 2, md: 6 }, gap: 3 }}>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            
            <IconButton 
              sx={{ display: { xs: 'none', md: 'inline-flex' }, bgcolor: 'action.hover', borderRadius: '12px' }} 
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>

            {/* Omni-search Interface */}
            <Paper
              elevation={0}
              sx={{
                p: '4px 16px',
                display: 'flex',
                alignItems: 'center',
                width: { xs: '100%', sm: 300, md: 450 },
                bgcolor: alpha(theme.palette.action.selected, 0.3),
                borderRadius: '16px',
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.05),
                transition: 'all 0.3s',
                '&:focus-within': {
                   bgcolor: 'background.paper',
                   boxShadow: '0 8px 32px -4px rgba(0,0,0,0.08)',
                   borderColor: 'primary.light',
                   width: { md: 500 }
                }
              }}
            >
              <Search sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
              <InputBase
                placeholder="Locate resources, metrics or logs..."
                sx={{ ml: 1, flex: 1, fontSize: '0.9rem', fontWeight: 600 }}
              />
              <Box sx={{ display: { xs: 'none', md: 'block' }, bgcolor: 'action.hover', px: 1, py: 0.2, borderRadius: '4px', border: '1px solid', borderColor: 'divider' }}>
                 <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.disabled' }}>⌘ K</Typography>
              </Box>
            </Paper>

            <Box sx={{ flexGrow: 1 }} />

            {/* Utility Arsenal */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                 <Tooltip title="Documentation">
                    <IconButton size="small" sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                 </Tooltip>
                 <Tooltip title="Access Control">
                    <IconButton size="small" sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}>
                      <Shield fontSize="small" />
                    </IconButton>
                 </Tooltip>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 28, alignSelf: 'center', borderColor: 'divider' }} />

              <Tooltip title={themeMode === 'light' ? 'Enable Night Mode' : 'Restore Daylight'}>
                <IconButton 
                   onClick={toggleTheme} 
                   sx={{ 
                     bgcolor: themeMode === 'dark' ? alpha('#facc15', 0.1) : alpha('#6366f1', 0.1),
                     color: themeMode === 'dark' ? '#facc15' : '#6366f1',
                     borderRadius: '12px'
                   }}
                >
                  {themeMode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                </IconButton>
              </Tooltip>

              <IconButton sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main', borderRadius: '12px' }}>
                <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 900, fontSize: '0.65rem' } }}>
                  <Notifications fontSize="small" />
                </Badge>
              </IconButton>
              
              <Box sx={{ position: 'relative', ml: 1 }}>
                  <IconButton 
                    id="profile-menu-button"
                    aria-controls={Boolean(anchorEl) ? 'profile-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                    onClick={(e) => setAnchorEl(e.currentTarget)} 
                    sx={{ 
                       p: 0, 
                       border: '2px solid', 
                       borderColor: 'primary.main',
                       boxShadow: '0 0 0 2px white'
                    }}
                 >
                    <Avatar 
                       sx={{ 
                          width: 38, height: 38, 
                          bgcolor: 'primary.main', 
                          fontWeight: 900, fontSize: '0.9rem',
                          borderRadius: '12px'
                       }}
                       src={user?.profile_image || ''}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                 </IconButton>
              </Box>
            </Stack>

            <Menu 
              id="profile-menu"
              anchorEl={anchorEl} 
              open={Boolean(anchorEl)} 
              onClose={() => setAnchorEl(null)}
              MenuListProps={{
                'aria-labelledby': 'profile-menu-button',
              }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 2.5,
                  borderRadius: '24px',
                  minWidth: 260,
                  p: 1.5,
                  boxShadow: '0 20px 50px -12px rgba(0,0,0,0.15)',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.08),
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                 <Avatar 
                    sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: 'primary.main', fontWeight: 900 }}
                    src={user?.profile_image || ''}
                 />
                 <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="subtitle1" fontWeight={900} noWrap sx={{ letterSpacing: '-0.5px' }}>{user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{user?.email}</Typography>
                 </Box>
              </Box>
              <Box sx={{ px: 2, pb: 2 }}>
                 <Chip 
                    icon={<WorkspacePremium sx={{ fontSize: '14px !important' }} />}
                    label={user?.role?.toUpperCase()} 
                    size="small" 
                    sx={{ fontWeight: 900, borderRadius: '8px', bgcolor: 'primary.lighter', color: 'primary.main', border: 'none', height: 24, fontSize: '0.65rem' }} 
                 />
              </Box>
              <Divider sx={{ mx: 1, my: 1 }} />
              <MenuItem onClick={() => { navigate('/dashboard/profile'); setAnchorEl(null) }} sx={{ borderRadius: '12px', py: 1.5 }}>
                <ListItemIcon><AccountCircle fontSize="small" sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Personal Portfolio" primaryTypographyProps={{ fontWeight: 700 }} />
              </MenuItem>
              <MenuItem onClick={() => setAnchorEl(null)} sx={{ borderRadius: '12px', py: 1.5 }}>
                <ListItemIcon><Settings fontSize="small" sx={{ color: 'text.secondary' }} /></ListItemIcon>
                <ListItemText primary="System Configuration" primaryTypographyProps={{ fontWeight: 700 }} />
              </MenuItem>
              <Divider sx={{ mx: 1, my: 1 }} />
              <MenuItem onClick={handleLogout} sx={{ borderRadius: '12px', py: 1.5, color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05) } }}>
                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                <ListItemText primary="Terminate Session" primaryTypographyProps={{ fontWeight: 800 }} />
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Holistic Content Viewport */}
        <Box 
          component="main"
          sx={{ 
            flex: 1, 
            p: { xs: 2.5, md: 6 }, 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            scrollBehavior: 'smooth'
          }}
        >
          <Box sx={{ maxWidth: '1400px', width: '100%', mx: 'auto', flex: 1 }}>
            <Outlet />
          </Box>
          
          <Box sx={{ py: 6, opacity: 0.5, textAlign: 'center' }}>
             <Typography variant="caption" sx={{ fontWeight: 700 }}>
                OceanDrama Enterprise API Version 4.2.0-STABLE • © 2026 Virtual Nexus Systems
             </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
