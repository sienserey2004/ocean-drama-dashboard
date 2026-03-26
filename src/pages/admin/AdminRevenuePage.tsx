import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Chip, Avatar, Stack, Paper, Divider
} from '@mui/material'
import { AttachMoney, People, VideoLibrary, ShoppingCart, TrendingUp, AccountBalance, ReceiptLong, WorkspacePremium, Visibility } from '@mui/icons-material'
import type { AnalyticsOverview, RevenueData, TopVideo } from '@/types'
import { analyticsApi } from '@/api/admin.service'

function StatCard({ icon, label, value, sub, color = 'primary.main' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <Card elevation={0} sx={{ height: '100%', borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
           <Avatar variant="rounded" sx={{ bgcolor: `${color}15`, color, borderRadius: '12px', width: 44, height: 44 }}>
              {icon}
           </Avatar>
           <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                 {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
              {sub && <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{sub}</Typography>}
           </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function AdminRevenuePage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [revenue, setRevenue] = useState<RevenueData[]>([])
  const [topVideos, setTopVideos] = useState<TopVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [sortBy, setSortBy] = useState('revenue')

  const load = async () => {
    setLoading(true)
    try {
      const [ov, rev, top] = await Promise.all([
        analyticsApi.overview(),
        analyticsApi.revenue({ period: 'monthly', year }),
        analyticsApi.topVideos({ sort: sortBy, limit: 10 }),
      ])
      setOverview(ov)
      setRevenue(rev.data)
      setTopVideos(top.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [year, sortBy])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress thickness={5} />
    </Box>
  )

  return (
    <Box>
      {/* SaaS Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
          Revenue Analytics
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Comprehensive financial performance, platform shares, and creator payouts.
        </Typography>
      </Box>

      {overview && (
        <Grid container spacing={3} mb={6}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<TrendingUp />} label="Gross Platform Volume" value={`$${overview.revenue.gross_revenue.toLocaleString()}`} sub="All-time cumulative" color="#6366f1" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AccountBalance />} label="System Net Revenue" value={`$${overview.revenue.platform_fees.toLocaleString()}`} sub="10% platform share" color="#f59e0b" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<People />} label="Creator Earnings" value={`$${overview.revenue.creator_payouts.toLocaleString()}`} sub="Distributed to partners" color="#10b981" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ShoppingCart />} label="Transaction Count" value={overview.revenue.total_purchases.toLocaleString()} sub="Unique payments" color="#8b5cf6" />
          </Grid>
        </Grid>
      )}

      {/* Monthly Audit Table */}
      <Card elevation={0} sx={{ mb: 6, borderRadius: '32px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
           <Typography variant="h6" fontWeight={800}>Financial Audit Track</Typography>
           <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select 
                value={year} 
                onChange={e => setYear(Number(e.target.value))}
                sx={{ borderRadius: '12px', fontWeight: 700 }}
              >
                {[2026, 2025, 2024].map(y => <MenuItem key={y} value={y}>{y} Fiscal Year</MenuItem>)}
              </Select>
           </FormControl>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary' }}>Month Period</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary' }}>Transactions</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary' }}>Gross Sales</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary' }}>Platform Fee (10%)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', color: 'text.secondary' }}>Payout Final (90%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {revenue.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary" fontWeight={600}>No financial data available for {year}</Typography>
                </TableCell></TableRow>
              ) : revenue.map((r) => (
                <TableRow key={r.month} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 2.5 }}><Typography variant="subtitle2" fontWeight={800}>{r.month}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={600}>{r.purchases.toLocaleString()}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={700}>${r.gross.toLocaleString()}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 700 }}>-${r.fees.toLocaleString()}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 800 }}>+${r.net.toLocaleString()}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Content Performance Leaderboard */}
      <Card elevation={0} sx={{ borderRadius: '32px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'white' }}>
           <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WorkspacePremium /> Content Revenue Leaders
           </Typography>
           <FormControl size="small" sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } } }}>
              <Select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                sx={{ borderRadius: '12px', fontWeight: 700, color: 'white' }}
                IconComponent={() => <AttachMoney sx={{ color: 'white', mr: 1, fontSize: 18 }} />}
              >
                <MenuItem value="revenue">Sort: Highest Yield</MenuItem>
                <MenuItem value="views">Sort: Most Viral</MenuItem>
                <MenuItem value="likes">Sort: Best Rated</MenuItem>
              </Select>
           </FormControl>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Collection Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Creator Entity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Engagement</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Conversions</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Yield Generated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topVideos.map((v) => (
                <TableRow key={v.video_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Avatar 
                       sx={{ 
                         width: 32, height: 32, fontSize: '0.85rem', fontWeight: 900,
                         bgcolor: v.rank === 1 ? '#facc15' : v.rank === 2 ? '#94a3b8' : v.rank === 3 ? '#b45309' : 'action.selected',
                         color: v.rank <= 3 ? 'white' : 'text.secondary'
                       }}
                    >
                      {v.rank}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={800}>{v.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{v.episodes} Strategic Clips</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 800, bgcolor: 'secondary.light', color: 'secondary.main', borderRadius: '10px' }}>
                        {v.creator.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700}>{v.creator.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                     <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                        <Visibility sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="body2" fontWeight={600} color="text.secondary">{v.views.toLocaleString()}</Typography>
                     </Stack>
                  </TableCell>
                  <TableCell align="right">
                     <Typography variant="body2" fontWeight={600}>{v.total_purchases.toLocaleString()} Sales</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1" fontWeight={900} color="success.main">${v.gross_revenue.toLocaleString()}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}
