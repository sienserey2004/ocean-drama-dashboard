import { useEffect, useState } from 'react'
import {
  Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  IconButton, Divider
} from '@mui/material'
import { 
  TrendingUp, 
  ShoppingCart, 
  Percent, 
  Wallet, 
  ChevronRight, 
  ArrowUpRight,
  Receipt,
  Calendar,
  History
} from 'lucide-react'
import type { EarningsSummary, CreatorEarning } from '@/app/types'
import { paymentApi } from '@/app/api/payment.service'

// Mobile-optimized Stat Card (Creator Studio Dark)
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-md rounded-[2rem] border border-white/10 p-5 sm:p-6 transition-all hover:border-white/20 group">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</p>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">{value}</h3>
          {sub && <p className="text-[10px] font-bold text-white/20 mt-1 uppercase">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

// Mobile Transaction Row (Dark Studio)
function TransactionRow({ earning }: { earning: CreatorEarning }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`border-b border-white/5 last:border-0 transition-colors ${expanded ? 'bg-white/[0.02]' : ''}`}>
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex items-center justify-between active:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ArrowUpRight size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate pr-4">
              {earning.video_title || `Series #${earning.video_id}`}
            </p>
            <p className="text-[10px] font-bold text-white/20 uppercase mt-0.5">
              {new Date(earning.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • TRX-{earning.earning_id}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-emerald-400">
            +${Number((earning as any).net ?? earning.net_amount ?? 0).toFixed(2)}
          </p>
          <p className="text-[10px] font-bold text-white/20 uppercase">
            Net Revenue
          </p>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 animate-in fade-in duration-300">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-white/40 uppercase tracking-wider">Gross Sales</span>
            <span className="text-white">${Number((earning as any).gross ?? earning.gross_amount ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-white/40 uppercase tracking-wider">Platform Fee (10%)</span>
            <span className="text-red-400">-${Number((earning as any).fee ?? earning.platform_fee ?? 0).toFixed(2)}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Final Payout</span>
            <span className="text-sm font-black text-emerald-400">
              ${Number((earning as any).net ?? earning.net_amount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [breakdown, setBreakdown] = useState<CreatorEarning[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  const load = async () => {
    setLoading(true)
    try {
      const [sum, brk] = await Promise.all([
        paymentApi.getEarnings({ from, to }),
        paymentApi.getEarningsBreakdown({ limit: 50 }),
      ])
      setSummary((sum as any)?.data || sum || null)
      setBreakdown(brk?.data || (Array.isArray(brk) ? brk : []))
      setTotalSales((brk as any)?.total || 0)
    } catch (error) {
      console.error('Failed to load earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [from, to])

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#08090C] text-white">
      <CircularProgress thickness={4} size={40} sx={{ color: '#ef4444' }} />
      <p className="text-xs font-black uppercase tracking-widest text-white/40">Loading Ledger...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#08090C] text-white p-4 sm:p-8 pb-32 font-sans">
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1.5">
            Wallet
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Track your earnings and payouts
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none relative">
            <input 
              type="date" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              className="bg-transparent border-none text-[11px] font-black text-white uppercase focus:ring-0 w-full sm:w-auto pl-8"
            />
            <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" />
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex-1 sm:flex-none relative">
            <input 
              type="date" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              className="bg-transparent border-none text-[11px] font-black text-white uppercase focus:ring-0 w-full sm:w-auto pl-8"
            />
            <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" />
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Wallet} 
            label="Net Earnings" 
            value={`$${(summary?.summary?.total_net ?? (summary as any)?.total_net ?? 0).toFixed(2)}`} 
            sub="Ready for payout" 
            color="#10b981" 
          />
          <StatCard 
            icon={TrendingUp} 
            label="Gross Volume" 
            value={`$${(summary?.summary?.total_gross ?? (summary as any)?.total_gross ?? 0).toFixed(2)}`} 
            sub="Total sales value" 
            color="#3b82f6" 
          />
          <StatCard 
            icon={Percent} 
            label="Platform Fee" 
            value={`$${(summary?.summary?.total_platform_fee ?? (summary as any)?.total_fee ?? 0).toFixed(2)}`} 
            sub="10% share" 
            color="#f59e0b" 
          />
          <StatCard 
            icon={ShoppingCart} 
            label="Sales Count" 
            value={String(totalSales || 0)} 
            sub="Completed deals" 
            color="#8b5cf6" 
          />
        </div>
      )}

      {/* Policy Insight */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6 mb-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
          <Receipt size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-white">Transparent Pricing Policy</h4>
          <p className="text-xs font-medium text-emerald-400/80 mt-1">
            You receive 90% of every transaction. The platform maintains infrastructure for the remaining 10%.
          </p>
        </div>
      </div>

      {/* Transaction Table - Mobile Optimized */}
      <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden">
        <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-white/40" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Transactions</h3>
          </div>
          <span className="text-[10px] font-black text-white/20 uppercase bg-white/5 px-3 py-1 rounded-full">
            {breakdown.length} Records
          </span>
        </div>
        
        <div className="hidden sm:block">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="border-b border-white/5">
                  <TableCell className="text-white/20 font-black text-[10px] uppercase tracking-widest border-0">Content Details</TableCell>
                  <TableCell align="right" className="text-white/20 font-black text-[10px] uppercase tracking-widest border-0">Gross Sale</TableCell>
                  <TableCell align="right" className="text-white/20 font-black text-[10px] uppercase tracking-widest border-0">Commission (10%)</TableCell>
                  <TableCell align="right" className="text-white/20 font-black text-[10px] uppercase tracking-widest border-0">Your Net (90%)</TableCell>
                  <TableCell align="right" className="text-white/20 font-black text-[10px] uppercase tracking-widest border-0">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {breakdown.length === 0 ? (
                  <TableRow key="empty-state">
                    <TableCell colSpan={5} align="center" className="py-20 border-0">
                      <p className="text-sm font-black text-white/20 uppercase tracking-[0.2em]">No transactions recorded</p>
                    </TableCell>
                  </TableRow>
                ) : breakdown.map((earning, idx) => (
                  <TableRow key={earning.earning_id || idx} className="hover:bg-white/[0.01] transition-colors">
                    <TableCell className="py-5 border-0">
                      <p className="text-sm font-black text-white">{earning.video_title || `Series #${earning.video_id}`}</p>
                      <p className="text-[10px] font-bold text-white/20 uppercase mt-0.5">TRX-{earning.earning_id}</p>
                    </TableCell>
                    <TableCell align="right" className="border-0">
                      <p className="text-sm font-bold text-white">${Number((earning as any).gross ?? earning.gross_amount ?? 0).toFixed(2)}</p>
                    </TableCell>
                    <TableCell align="right" className="border-0">
                      <p className="text-sm font-bold text-red-400">-${Number((earning as any).fee ?? earning.platform_fee ?? 0).toFixed(2)}</p>
                    </TableCell>
                    <TableCell align="right" className="border-0">
                      <p className="text-sm font-black text-emerald-400">+${Number((earning as any).net ?? earning.net_amount ?? 0).toFixed(2)}</p>
                    </TableCell>
                    <TableCell align="right" className="border-0">
                      <p className="text-[10px] font-black text-white/40 uppercase">{new Date(earning.earned_at).toLocaleDateString()}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-white/5">
          {breakdown.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">No transactions found</p>
            </div>
          ) : (
            breakdown.map((earning, idx) => (
              <TransactionRow key={earning.earning_id || idx} earning={earning} />
            ))
          )}
        </div>
      </div>
      
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.1;
          cursor: pointer;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}