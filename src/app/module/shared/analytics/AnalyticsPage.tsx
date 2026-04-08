import { useEffect, useState } from 'react'
import {
  Grid, Card, CardContent, Typography, Box, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, Avatar, Stack,
  Divider,
  TableContainer,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material'
import {
  People, VideoLibrary, AttachMoney, ShoppingCart,
  Visibility, ThumbUp, Comment, TrendingUp, TrendingDown, ShowChart,
  AccessTime, Share, Bookmark, Percent, PlayCircle
} from '@mui/icons-material'
import { useAuthStore } from '@/app/stores/authStore'
import type { AnalyticsOverview, EarningsSummary } from '@/app/types'
import { paymentApi } from '@/app/api/payment.service'
import { analyticsApi } from '@/app/api/admin.service'

function StatCard({ icon, label, value, sub, color = 'primary.main', trend = 'up', progress }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; trend?: 'up' | 'down'; progress?: number
}) {
  return (
    <Card elevation={0} sx={{ height: '100%', borderRadius: '24px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Avatar variant="rounded" sx={{ bgcolor: alpha(color, 0.1), color: color, borderRadius: '16px', width: 48, height: 48 }}>
                 {icon}
              </Avatar>
              {sub && (
                 <Chip 
                    label={sub} 
                    size="small" 
                    icon={trend === 'up' ? <TrendingUp sx={{ fontSize: '14px !important' }} /> : <TrendingDown sx={{ fontSize: '14px !important' }} />}
                    sx={{ 
                       fontWeight: 800, 
                       bgcolor: trend === 'up' ? 'success.lighter' : 'error.lighter',
                       color: trend === 'up' ? 'success.dark' : 'error.dark',
                       borderRadius: '10px',
                       border: 'none',
                       height: '24px'
                    }} 
                 />
              )}
           </Box>
           <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.65rem', mb: 0.5 }}>
                 {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>{value}</Typography>
           </Box>
           {progress !== undefined && (
             <Box pt={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Target Progress</Typography>
                  <Typography variant="caption" fontWeight={800}>{progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
             </Box>
           )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { isAdmin } = useAuthStore()
  const theme = useTheme()
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          const [ov, ins, earn] = await Promise.all([
            analyticsApi.overview(),
            analyticsApi.insights(),
            paymentApi.getEarnings(),
          ])
          setOverview((ov as any)?.data || ov)
          setInsights(ins)
          setEarnings((earn as any)?.data || earn)
        } else {
          const earn = await paymentApi.getEarnings()
          setEarnings((earn as any)?.data || earn)
        }
      } catch (err) {
        console.error("Failed to load insights:", err)
      }
      setLoading(false)
    }
    load()
  }, [isAdmin])

  if (loading) return (
    <Box sx={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress thickness={6} size={48} sx={{ borderRadius: '50%' }} />
    </Box>
  )

  const perf = insights?.performance
  const eng = insights?.engagement

  return (
    <Box sx={{ pb: 8 }}>
      {/* SaaS Header */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-2px', mb: 1, color: 'text.primary' }}>
            Platform Insights
          </Typography>
          <Typography color="text.secondary" variant="body1" sx={{ fontWeight: 500 }}>
            Real-time analysis of platform performance and audience engagement.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
           <Paper variant="outlined" sx={{ px: 2, py: 1, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1.5, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s infinite' }} />
              <Typography variant="body2" fontWeight={800} color="text.secondary">Live Monitoring</Typography>
           </Paper>
        </Stack>
      </Box>

      {isAdmin && insights && (
        <>
          {/* 📈 1. Performance Metrics */}
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
             <ShowChart color="primary" /> Platform Performance
          </Typography>
          <Grid container spacing={3} mb={6}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<People />} label="Total Users" value={perf?.total_users?.toLocaleString()} color={theme.palette.primary.main} progress={85} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<Visibility />} label="Total Video Views" value={perf?.total_views?.toLocaleString()} color="#8b5cf6" sub="+12.5%" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AttachMoney />} label="Total Revenue" value={`$${perf?.total_revenue?.toLocaleString()}`} color="#10b981" sub="Gross" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AccessTime />} label="Total Watch Time" value={`${Math.round(perf?.total_watch_time / 3600).toLocaleString()}h`} color="#f59e0b" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
               <StatCard icon={<PlayCircle />} label="Daily Active Users" value={perf?.dau?.toLocaleString()} color="#ef4444" sub="DAU" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
               <StatCard icon={<People />} label="Monthly Active Users" value={perf?.mau?.toLocaleString()} color="#ec4899" sub="MAU" trend="up" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
               <StatCard icon={<Percent />} label="Conversion Rate" value={`${(eng?.conversion_rate * 100).toFixed(1)}%`} color="#6366f1" sub="Views → Sales" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
               <StatCard icon={<TrendingUp />} label="Completion Rate" value={`${(eng?.avg_completion_rate * 100).toFixed(1)}%`} color="#8b5cf6" sub="Watch Avg" />
            </Grid>
          </Grid>

          {/* 👀 2. Engagement Metrics */}
          <Grid container spacing={4} mb={6}>
             <Grid item xs={12} md={7}>
                <Card elevation={0} sx={{ borderRadius: '28px', border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
                   <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                         <Typography variant="h6" fontWeight={900}>Top Content Performance</Typography>
                         <Chip label="Per Episode" size="small" sx={{ fontWeight: 800, borderRadius: '8px' }} />
                      </Box>
                      <TableContainer>
                        <Table sx={{ minWidth: 500 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Episode Title</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Views</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Completion</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {insights.content.top_episodes.map((ep: any, i: number) => (
                              <TableRow key={ep.episode_id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                                <TableCell>
                                   <Stack spacing={0.5}>
                                      <Typography variant="body2" fontWeight={800}>{ep.title}</Typography>
                                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{ep.video_title}</Typography>
                                   </Stack>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{ep.view_count.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                      <Typography variant="caption" fontWeight={800}>{Math.round(ep.completion_rate * 100)}%</Typography>
                                      <Box sx={{ width: 40, height: 6, borderRadius: 3, bgcolor: 'divider', overflow: 'hidden' }}>
                                         <Box sx={{ width: `${ep.completion_rate * 100}%`, height: '100%', bgcolor: ep.completion_rate > 0.7 ? 'success.main' : 'warning.main' }} />
                                      </Box>
                                   </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                   </CardContent>
                </Card>
             </Grid>
             <Grid item xs={12} md={5}>
                <Card elevation={0} sx={{ borderRadius: '28px', border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
                   <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" fontWeight={900} mb={4}>Social Engagement</Typography>
                      <Stack spacing={4}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={2.5} alignItems="center">
                               <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', borderRadius: '14px' }}><ThumbUp /></Avatar>
                               <Typography variant="body2" fontWeight={800}>Total Likes</Typography>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={900}>{eng?.likes?.toLocaleString()}</Typography>
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={2.5} alignItems="center">
                               <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', borderRadius: '14px' }}><Comment /></Avatar>
                               <Typography variant="body2" fontWeight={800}>Member Comments</Typography>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={900}>{eng?.comments?.toLocaleString()}</Typography>
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={2.5} alignItems="center">
                               <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', borderRadius: '14px' }}><Share /></Avatar>
                               <Typography variant="body2" fontWeight={800}>Video Shares</Typography>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={900}>{eng?.shares?.toLocaleString()}</Typography>
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={2.5} alignItems="center">
                               <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', borderRadius: '14px' }}><Bookmark /></Avatar>
                               <Typography variant="body2" fontWeight={800}>Favorites/Saves</Typography>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={900}>{eng?.favorites?.toLocaleString()}</Typography>
                         </Box>
                      </Stack>
                      
                      <Divider sx={{ my: 4 }} />
                      
                      <Box sx={{ p: 2.5, borderRadius: '20px', bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
                         <Typography variant="body2" fontWeight={800} mb={1}>💡 Performance Tip</Typography>
                         <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ lineHeight: 1.6 }}>
                            Users are dropping off around the 2-minute mark in free previews. Consider moving your "hooks" earlier in the episode.
                         </Typography>
                      </Box>
                   </CardContent>
                </Card>
             </Grid>
          </Grid>
        </>
      )}

      {/* Creator View Financials */}
      {earnings?.summary && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
             <AttachMoney /> Creator Financial Performance
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<AttachMoney />} label="Portfolio Balance" value={`$${earnings.summary.total_net.toLocaleString()}`} color="#10b981" sub="Available" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<TrendingUp />} label="Projected Sales" value={`$${earnings.summary.total_gross.toLocaleString()}`} color="#6366f1" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<ShoppingCart />} label="Paid Conversions" value={earnings.summary.total_purchases} color="#8b5cf6" />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  )
}
