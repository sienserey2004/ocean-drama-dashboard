import { useEffect, useState } from 'react'
import {
  Grid, Card, CardContent, Typography, Box, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
} from '@mui/material'
import {
  People, VideoLibrary, AttachMoney, ShoppingCart,
  Visibility, ThumbUp, Comment, TrendingUp,
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/authStore'
import type { AnalyticsOverview, EarningsSummary } from '@/types'
import { paymentApi } from '@/api/payment.service'
import { analyticsApi } from '@/api/admin.service'

function StatCard({ icon, label, value, sub, color = 'primary.main' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.06em">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} mt={0.5} sx={{ fontSize: '1.6rem' }}>{value}</Typography>
            {sub && <Typography variant="caption" color="success.main">{sub}</Typography>}
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </Box>
        </Box>
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
          setOverview(ov)
          setEarnings(earn)
        } else {
          const earn = await paymentApi.getEarnings()
          setEarnings(earn)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [isAdmin])

  if (loading) return (
    <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Typography variant="h4">Analytics</Typography>
        <Chip
          label={isAdmin ? 'Admin — platform wide' : 'Creator — your content'}
          size="small"
          color={isAdmin ? 'error' : 'secondary'}
          sx={{ fontSize: '0.7rem' }}
        />
      </Box>

      {/* Admin stats */}
      {isAdmin && overview && (
        <>
          <Typography variant="h6" mb={1.5} color="text.secondary" fontSize="0.8rem" textTransform="uppercase" letterSpacing="0.06em">
            Platform overview
          </Typography>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<People />} label="Total users" value={overview.users.total.toLocaleString()} sub={`+${overview.users.new_this_period} this period`} color="primary.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<VideoLibrary />} label="Total videos" value={overview.content.total_videos} sub={`${overview.content.pending} pending review`} color="secondary.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<AttachMoney />} label="Gross revenue" value={`$${overview.revenue.gross_revenue.toLocaleString()}`} sub={`$${overview.revenue.platform_fees} platform fees`} color="success.main" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={<ShoppingCart />} label="Total purchases" value={overview.revenue.total_purchases.toLocaleString()} color="warning.main" />
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<Visibility />} label="Total views" value={overview.engagement.total_views.toLocaleString()} color="primary.main" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<ThumbUp />} label="Total likes" value={overview.engagement.total_likes.toLocaleString()} color="secondary.main" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<Comment />} label="Total comments" value={overview.engagement.total_comments.toLocaleString()} color="success.main" />
            </Grid>
          </Grid>

          {/* User breakdown */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Users by role</Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {Object.entries(overview.users.by_role).map(([role, count]) => (
                  <Box key={role} textAlign="center">
                    <Typography variant="h4" fontWeight={700}>{count.toLocaleString()}</Typography>
                    <Chip label={role} size="small" sx={{ mt: 0.5, textTransform: 'capitalize' }}
                      color={role === 'admin' ? 'error' : role === 'creator' ? 'secondary' : 'default'} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Revenue split */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Revenue split</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Gross revenue</TableCell>
                    <TableCell align="right">${overview.revenue.gross_revenue.toLocaleString()}</TableCell>
                    <TableCell align="right">100%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Platform fees (10%)</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>${overview.revenue.platform_fees.toLocaleString()}</TableCell>
                    <TableCell align="right">10%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Creator payouts (90%)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>${overview.revenue.creator_payouts.toLocaleString()}</TableCell>
                    <TableCell align="right">90%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Creator/shared earnings */}
      {(isCreator || isAdmin) && earnings && (
        <>
          <Typography variant="h6" mb={1.5} color="text.secondary" fontSize="0.8rem" textTransform="uppercase" letterSpacing="0.06em">
            {isAdmin ? 'Your creator earnings' : 'Earnings summary'}
          </Typography>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<AttachMoney />} label="Net earnings" value={`$${earnings.summary.total_net.toLocaleString()}`} color="success.main" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<TrendingUp />} label="Gross revenue" value={`$${earnings.summary.total_gross.toLocaleString()}`} color="primary.main" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<ShoppingCart />} label="Total sales" value={earnings.summary.total_purchases} color="secondary.main" />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}
