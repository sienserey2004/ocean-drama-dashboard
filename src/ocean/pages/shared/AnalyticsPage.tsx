import { useEffect, useState } from 'react'
import {
  Grid, Card, CardContent, Typography, Box, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, Avatar, Stack,
  Divider,
  TableContainer
} from '@mui/material'
import {
  People, VideoLibrary, AttachMoney, ShoppingCart,
  Visibility, ThumbUp, Comment, TrendingUp, TrendingDown, ShowChart
} from '@mui/icons-material'
import { useAuthStore } from '@/ocean/stores/authStore'
import type { AnalyticsOverview, EarningsSummary } from '@/ocean/types'
import { paymentApi } from '@/ocean/api/payment.service'
import { analyticsApi } from '@/ocean/api/admin.service'

function StatCard({ icon, label, value, sub, color = 'primary.main', trend = 'up' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; trend?: 'up' | 'down'
}) {
  return (
    <Card elevation={0} sx={{ height: '100%', borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Avatar variant="rounded" sx={{ bgcolor: `${color}15`, color, borderRadius: '12px', width: 44, height: 44 }}>
                 {icon}
              </Avatar>
              {sub && (
                 <Chip 
                    label={sub} 
                    size="small" 
                    icon={trend === 'up' ? <TrendingUp sx={{ fontSize: '14px !important' }} /> : <TrendingDown sx={{ fontSize: '14px !important' }} />}
                    sx={{ 
                       fontWeight: 700, 
                       bgcolor: trend === 'up' ? 'success.lighter' : 'error.lighter',
                       color: trend === 'up' ? 'success.dark' : 'error.dark',
                       borderRadius: '8px',
                       border: 'none'
                    }} 
                 />
              )}
           </Box>
           <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                 {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
           </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { isAdmin, isCreator } = useAuthStore()
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          const [ov, earn] = await Promise.all([
            analyticsApi.overview(),
            paymentApi.getEarnings(),
          ])
          setOverview((ov as any)?.data || ov)
          setEarnings((earn as any)?.data || earn)
        } else {
          const earn = await paymentApi.getEarnings()
          setEarnings((earn as any)?.data || earn)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [isAdmin])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress thickness={5} />
    </Box>
  )

  return (
    <Box>
      {/* SaaS Header */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1 }}>
            Insights
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Analyze platform performance and engagement metrics.
          </Typography>
        </Box>
        <Chip
          icon={<ShowChart />}
          label={isAdmin ? 'Admin View: Global Platform Data' : 'Creator View: Performance Insights'}
          variant="outlined"
          sx={{ fontWeight: 800, borderRadius: '12px', px: 1, py: 2, borderColor: 'divider' }}
        />
      </Box>

      {/* Admin stats */}
      {isAdmin && overview?.users && overview?.content && overview?.revenue && overview?.engagement && (
        <>
          <Grid container spacing={3} mb={6}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<People />} label="Active Users" value={overview.users.total.toLocaleString()} sub={`+${overview.users.new_this_period}`} color="#6366f1" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<VideoLibrary />} label="Content Library" value={overview.content.total_videos} sub={`${overview.content.pending} Pnd`} color="#8b5cf6" trend="down" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AttachMoney />} label="Net Revenue" value={`$${overview.revenue.gross_revenue.toLocaleString()}`} sub="12%" color="#10b981" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<ShoppingCart />} label="Sales Count" value={overview.revenue.total_purchases.toLocaleString()} color="#f59e0b" />
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={6}>
             <Grid item xs={12} lg={7}>
                <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                   <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" fontWeight={800} mb={3}>Platform Revenue Split</Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Source</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Weight</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ '&:last-child td': { border: 0 } }}>
                              <TableCell sx={{ py: 2 }}>Gross revenue</TableCell>
                              <TableCell align="right">${overview.revenue.gross_revenue.toLocaleString()}</TableCell>
                              <TableCell align="right"><Chip label="100%" size="small" variant="outlined" /></TableCell>
                            </TableRow>
                            <TableRow sx={{ '&:last-child td': { border: 0 } }}>
                              <TableCell sx={{ py: 2, color: 'error.main', fontWeight: 600 }}>Platform Commissions (10%)</TableCell>
                              <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>-${overview.revenue.platform_fees.toLocaleString()}</TableCell>
                              <TableCell align="right"><Chip label="10%" size="small" sx={{ bgcolor: 'error.lighter', color: 'error.dark', border: 'none' }} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ '&:last-child td': { border: 0 } }}>
                              <TableCell sx={{ py: 2, fontWeight: 800 }}>Creator Distributions (90%)</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>${overview.revenue.creator_payouts.toLocaleString()}</TableCell>
                              <TableCell align="right"><Chip label="90%" size="small" sx={{ bgcolor: 'success.lighter', color: 'success.dark', border: 'none' }} /></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                   </CardContent>
                </Card>
             </Grid>
             <Grid item xs={12} lg={5}>
                <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                   <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" fontWeight={800} mb={3}>Global Engagement</Typography>
                      <Stack spacing={3}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                               <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', borderRadius: '10px' }}><Visibility /></Avatar>
                               <Typography variant="body2" fontWeight={700}>Total Interactions</Typography>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={800}>{overview.engagement.total_views.toLocaleString()}</Typography>
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                               <Avatar sx={{ bgcolor: 'error.lighter', color: 'error.main', borderRadius: '10px' }}><ThumbUp /></Avatar>
                               <Typography variant="body2" fontWeight={700}>Community Likes</Typography>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={800}>{overview.engagement.total_likes.toLocaleString()}</Typography>
                         </Box>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                               <Avatar sx={{ bgcolor: 'success.lighter', color: 'success.main', borderRadius: '10px' }}><Comment /></Avatar>
                               <Typography variant="body2" fontWeight={700}>Member Comments</Typography>
                            </Stack>
                            <Typography variant="subtitle1" fontWeight={800}>{overview.engagement.total_comments.toLocaleString()}</Typography>
                         </Box>
                      </Stack>
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', mb: 2, display: 'block' }}>User Base Distribution</Typography>
                      <Stack direction="row" spacing={2}>
                        {Object.entries(overview.users.by_role).map(([role, count]) => (
                           <Paper key={role} variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: 'center', borderRadius: '12px' }}>
                              <Typography variant="h6" fontWeight={800}>{count.toLocaleString()}</Typography>
                              <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 700, color: 'text.secondary' }}>{role}s</Typography>
                           </Paper>
                        ))}
                      </Stack>
                   </CardContent>
                </Card>
             </Grid>
          </Grid>
        </>
      )}

      {/* Creator View */}
      {(isCreator || isAdmin) && earnings?.summary && (
        <Stack spacing={3}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
             <AttachMoney />
             Creator Financial Performance
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<AttachMoney />} label="Net Wallet Balance" value={`$${earnings.summary.total_net.toLocaleString()}`} color="#10b981" sub="Payout" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<TrendingUp />} label="Gross Earnings" value={`$${earnings.summary.total_gross.toLocaleString()}`} color="#6366f1" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<ShoppingCart />} label="Successful Orders" value={earnings.summary.total_purchases} color="#8b5cf6" />
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  )
}
