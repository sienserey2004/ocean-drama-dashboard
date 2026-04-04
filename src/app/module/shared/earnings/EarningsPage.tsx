import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  TextField, Chip, Stack, Paper, Avatar, Divider, Alert
} from '@mui/material'
import { AttachMoney, TrendingUp, ShoppingCart, Percent, AccountBalanceWallet, ReceiptLong, Wallet } from '@mui/icons-material'
import type { EarningsSummary, CreatorEarning } from '@/app/types'
import { paymentApi } from '@/app/api/payment.service'

function StatCard({ icon, label, value, sub, color = 'primary.main' }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string
}) {
  return (
    <Card elevation={0} sx={{ height: '100%', borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
           <Avatar variant="rounded" sx={{ bgcolor: `${color}15`, color, borderRadius: '12px', width: 44, height: 44 }}>
              {icon}
           </Avatar>
           <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
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

export default function EarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [breakdown, setBreakdown] = useState<CreatorEarning[]>([])
  const [totalSales, setTotalSales] = useState(0)
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
      setSummary((sum as any)?.data || sum || null)
      console.log("sum", sum)
      setBreakdown(brk?.data || (Array.isArray(brk) ? brk : []))
      setTotalSales((brk as any)?.total || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress thickness={5} />
    </Box>
  )

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-start' }, gap: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
            Wallet
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Track your payouts, gross revenue, and platform splits.
          </Typography>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            p: 1.5, 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center', 
            bgcolor: 'background.paper', 
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
             <TextField 
                label="Start" type="date" size="small" value={from} 
                onChange={e => setFrom(e.target.value)} 
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
             />
             <TextField 
                label="End" type="date" size="small" value={to} 
                onChange={e => setTo(e.target.value)} 
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
             />
          </Stack>
        </Paper>
      </Box>

      {/* Financial Overview Cards */}
      {summary && (
        <Grid container spacing={3} mb={6}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Wallet />} label="Net Earnings" value={`$${(summary?.summary?.total_net ?? (summary as any)?.total_net ?? 0).toFixed(2)}`} sub="Ready for payout" color="#10b981" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<TrendingUp />} label="Gross Volume" value={`$${(summary?.summary?.total_gross ?? (summary as any)?.total_gross ?? 0).toFixed(2)}`} sub="Total sales value" color="#6366f1" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Percent />} label="Service Fees" value={`$${(summary?.summary?.total_platform_fee ?? (summary as any)?.total_fee ?? 0).toFixed(2)}`} sub="10% platform share" color="#f59e0b" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ShoppingCart />} label="Completed Sales" value={String(totalSales || 0)} sub="Transactions count" color="#8b5cf6" />
          </Grid>
        </Grid>
      )}

      {/* Policy Insight */}
      <Alert 
         severity="success" 
         icon={<ReceiptLong />}
         sx={{ mb: 6, borderRadius: '20px', border: '1px solid', borderColor: 'success.light', bgcolor: 'success.lighter', color: 'success.dark' }}
      >
        <Typography variant="body2" fontWeight={700}>Transparent Pricing Policy:</Typography>
        You receive <strong style={{fontSize: '1.1rem'}}>90%</strong> of every transaction. Example: On a $2.99 purchase, you earn <strong>$2.69</strong> while the platform maintains infrastructure for $0.30.
      </Alert>

      {/* Transaction Table */}
      <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
           <Typography variant="h6" fontWeight={800}>Detailed Breakdown</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Video Content</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Gross Sales</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Comm (10%)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Your Net (90%)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Processed At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {breakdown.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Stack spacing={1} alignItems="center">
                         <AccountBalanceWallet sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3 }} />
                         <Typography color="text.secondary" fontWeight={700}>No transaction records available</Typography>
                      </Stack>
                   </TableCell>
                </TableRow>
              ) : breakdown.map((e) => (
                <TableRow key={e.earning_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={800}>{e.video_title || `Collection ID #${e.video_id}`}</Typography>
                    <Typography variant="caption" component="code" sx={{ color: 'text.disabled', bgcolor: 'action.selected', px: 0.5, borderRadius: '4px' }}>TRX-{e.earning_id}</Typography>
                  </TableCell>
                  <TableCell align="right">
                     <Typography variant="body2" fontWeight={600}>${Number((e as any).gross ?? e.gross_amount ?? 0).toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main" fontWeight={600}>-${Number((e as any).fee ?? e.platform_fee ?? 0).toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                     <Typography variant="subtitle2" color="success.main" fontWeight={800}>+${Number((e as any).net ?? e.net_amount ?? 0).toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {new Date(e.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
