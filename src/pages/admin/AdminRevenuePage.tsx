import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Chip, Avatar,
} from '@mui/material'
import { AttachMoney, People, VideoLibrary, ShoppingCart } from '@mui/icons-material'
import type { AnalyticsOverview, RevenueData, TopVideo } from '@/types'
import { analyticsApi } from '@/api/admin.service'

function StatCard({ icon, label, value, sub, color = 'primary.main' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.06em">{label}</Typography>
            <Typography variant="h4" fontWeight={700} mt={0.5} sx={{ fontSize: '1.5rem' }}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</Box>
        </Box>
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

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" mb={3}>Revenue Report</Typography>

      {overview && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AttachMoney />} label="Gross revenue" value={`$${overview.revenue.gross_revenue.toLocaleString()}`} sub="All time" color="success.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AttachMoney />} label="Platform fees (10%)" value={`$${overview.revenue.platform_fees.toLocaleString()}`} color="warning.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<People />} label="Creator payouts (90%)" value={`$${overview.revenue.creator_payouts.toLocaleString()}`} color="primary.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ShoppingCart />} label="Total purchases" value={overview.revenue.total_purchases.toLocaleString()} color="secondary.main" />
          </Grid>
        </Grid>
      )}

      {/* Monthly breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Monthly breakdown</Typography>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2025, 2024, 2023].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Purchases</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Platform (10%)</TableCell>
                  <TableCell align="right">Creator payout (90%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenue.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No data for {year}</Typography>
                  </TableCell></TableRow>
                ) : revenue.map((r) => (
                  <TableRow key={r.month} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{r.month}</TableCell>
                    <TableCell align="right">{r.purchases.toLocaleString()}</TableCell>
                    <TableCell align="right">${r.gross.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: 'warning.main' }}>${r.fees.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>${r.net.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Top videos */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Top performing videos</Typography>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Sort by</InputLabel>
              <Select label="Sort by" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="views">Views</MenuItem>
                <MenuItem value="likes">Likes</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Creator</TableCell>
                  <TableCell align="right">Views</TableCell>
                  <TableCell align="right">Purchases</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topVideos.map((v) => (
                  <TableRow key={v.video_id} hover>
                    <TableCell>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: v.rank <= 3 ? 'warning.light' : 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: v.rank <= 3 ? 'warning.main' : 'text.secondary' }}>
                        {v.rank}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{v.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{v.episodes} episodes</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'secondary.light', color: 'secondary.main' }}>
                          {v.creator.name.charAt(0)}
                        </Avatar>
                        <Typography variant="caption">{v.creator.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2">{v.views.toLocaleString()}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{v.total_purchases.toLocaleString()}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="success.main">${v.gross_revenue.toLocaleString()}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
