import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  TextField, Chip,
} from '@mui/material'
import { AttachMoney, TrendingUp, ShoppingCart, Percent } from '@mui/icons-material'
import type { EarningsSummary, CreatorEarning } from '@/types'
import { paymentApi } from '@/api/payment.service'

function StatCard({ icon, label, value, sub, color = 'primary.main' }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.06em">{label}</Typography>
            <Typography variant="h4" fontWeight={700} mt={0.5} sx={{ fontSize: '1.6rem' }}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function EarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [breakdown, setBreakdown] = useState<CreatorEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('2025-01-01')
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  const load = async () => {
    setLoading(true)
    try {
      const [sum, brk] = await Promise.all([
        paymentApi.getEarnings({ from, to }),
        paymentApi.getEarningsBreakdown({ limit: 50 }),
      ])
      setSummary(sum)
      setBreakdown(brk.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">My Earnings</Typography>
          <Typography variant="body2" color="text.secondary">90% of each sale goes to you</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField label="From" type="date" size="small" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="To"   type="date" size="small" value={to}   onChange={e => setTo(e.target.value)}   InputLabelProps={{ shrink: true }} />
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<TrendingUp />} label="Net earnings" value={`$${summary.summary.total_net.toFixed(2)}`} sub="After platform fee" color="success.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AttachMoney />} label="Gross revenue" value={`$${summary.summary.total_gross.toFixed(2)}`} color="primary.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Percent />} label="Platform fee (10%)" value={`$${summary.summary.total_platform_fee.toFixed(2)}`} color="warning.main" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ShoppingCart />} label="Total sales" value={String(summary.summary.total_purchases)} color="secondary.main" />
          </Grid>
        </Grid>
      )}

      {/* Split info */}
      <Card sx={{ mb: 3, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="body2" color="success.main" fontWeight={500}>
            Revenue split: You receive 90% of each $2.99 purchase = $2.69 per sale. Platform keeps 10% = $0.30.
          </Typography>
        </CardContent>
      </Card>

      {/* Breakdown table */}
      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Typography variant="h6" mb={0}>Earnings breakdown</Typography>
        </CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Video</TableCell>
                <TableCell align="right">Gross</TableCell>
                <TableCell align="right">Fee (10%)</TableCell>
                <TableCell align="right">Net (90%)</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {breakdown.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No earnings yet</Typography>
                </TableCell></TableRow>
              ) : breakdown.map((e) => (
                <TableRow key={e.earning_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{e.video_title || `Video #${e.video_id}`}</Typography>
                    <Typography variant="caption" color="text.secondary">Purchase #{e.video_purchase_id}</Typography>
                  </TableCell>
                  <TableCell align="right">${Number(e.gross_amount).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>-${Number(e.platform_fee).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>${Number(e.net_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(e.earned_at).toLocaleDateString()}
                    </Typography>
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
