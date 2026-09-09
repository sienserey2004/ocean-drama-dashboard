import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  DollarSign,
  Eye,
  Gift,
  Info,
  LineChart,
  Percent,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { RouteLoader } from '@/_ocean/ui'
import type { CreatorEarning, EarningsSummary } from '@/app/types'
import { paymentApi } from '@/app/api/payment.service'
import {
  AdminCard,
  AdminLTE,
  ContentHeader,
  InfoBox,
  LteBadge,
  ProgressBar,
  SmallBox,
  type LteColor,
} from '@/app/module/shared/adminlte'

type RealtimeEarnings = {
  tips?: { coins?: number; usd?: number }
  purchases?: { usd?: number }
  adRevenue?: { estimatedUsd?: number; totalViews?: number }
  totalEarningsUsd?: number
  summary?: EarningsSummary['summary']
  total_gross?: number
  total_fee?: number
  total_net?: number
  currency?: string
}

type CpmBreakdown = {
  videoId: number
  title: string
  views: number
  cpm: number
  estRevenue: number
}

type EarningsRow = CreatorEarning | CpmBreakdown

const asNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const money = (value: unknown) => `$${asNumber(value).toFixed(2)}`

const number = (value: unknown) => asNumber(value).toLocaleString()

const dateLabel = (value: string) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown date' : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const isCpmRow = (row: EarningsRow): row is CpmBreakdown => 'videoId' in row || 'views' in row

const cpmValue = (row: CpmBreakdown) => asNumber(row.estRevenue)

function LegacyTransactionRow({ earning }: { earning: CreatorEarning }) {
  const [expanded, setExpanded] = useState(false)
  const row = earning as CreatorEarning & { gross?: number; fee?: number; net?: number }
  const gross = row.gross ?? row.gross_amount
  const fee = row.fee ?? row.platform_fee
  const net = row.net ?? row.net_amount

  return (
    <div className={`earnings-mobile-row ${expanded ? 'is-expanded' : ''}`}>
      <button type="button" className="earnings-mobile-row-main" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
        <span className="earnings-mobile-icon lte-bg-success"><TrendingUp size={18} /></span>
        <span className="earnings-mobile-copy"><strong>{earning.video_title || `Series #${earning.video_id}`}</strong><small>{dateLabel(earning.earned_at)} · TRX-{earning.earning_id}</small></span>
        <span className="earnings-mobile-value"><strong>+{money(net)}</strong><small>Net revenue</small></span>
      </button>
      {expanded && (
        <div className="earnings-mobile-details">
          <div><span>Gross sale</span><strong>{money(gross)}</strong></div>
          <div><span>Platform fee</span><strong className="lte-text-danger">-{money(fee)}</strong></div>
          <div><span>Your net</span><strong className="lte-text-success">+{money(net)}</strong></div>
        </div>
      )}
    </div>
  )
}

function CpmPerformanceRow({ earning }: { earning: CpmBreakdown }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`earnings-mobile-row ${expanded ? 'is-expanded' : ''}`}>
      <button type="button" className="earnings-mobile-row-main" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
        <span className="earnings-mobile-icon lte-bg-info"><ChartNoAxesCombined size={18} /></span>
        <span className="earnings-mobile-copy"><strong>{earning.title || `Series #${earning.videoId}`}</strong><small>{number(earning.views)} views · ${asNumber(earning.cpm).toFixed(2)} CPM</small></span>
        <span className="earnings-mobile-value"><strong>+{money(cpmValue(earning))}</strong><small>Est. ad revenue</small></span>
      </button>
      {expanded && (
        <div className="earnings-mobile-details">
          <div><span>Total views</span><strong>{number(earning.views)}</strong></div>
          <div><span>CPM rate</span><strong>{money(earning.cpm)}</strong></div>
          <div><span>Estimated payout</span><strong className="lte-text-success">+{money(cpmValue(earning))}</strong></div>
        </div>
      )}
    </div>
  )
}

export default function EarningsPage() {
  const [summary, setSummary] = useState<RealtimeEarnings | null>(null)
  const [breakdown, setBreakdown] = useState<EarningsRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [from, setFrom] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  const load = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [summaryResponse, breakdownResponse] = await Promise.all([
        paymentApi.getEarnings({ from, to }),
        paymentApi.getEarningsBreakdown({ limit: 50 }),
      ])
      const normalizedSummary = ((summaryResponse as any)?.data || summaryResponse || null) as RealtimeEarnings | null
      const normalizedRows = ((breakdownResponse as any)?.data || (Array.isArray(breakdownResponse) ? breakdownResponse : [])) as EarningsRow[]
      setSummary(normalizedSummary)
      setBreakdown(normalizedRows)
      setTotalRows(asNumber((breakdownResponse as any)?.total) || normalizedRows.length)
    } catch (error) {
      console.error('Failed to load earnings:', error)
      setSummary(null)
      setBreakdown([])
      setTotalRows(0)
      setLoadError('Earnings could not be loaded. Check the API connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [from, to])

  const metrics = useMemo(() => {
    const realtime = Boolean(summary && ('totalEarningsUsd' in summary || summary.adRevenue || summary.purchases || summary.tips))
    if (realtime) {
      const tips = asNumber(summary?.tips?.usd)
      const purchases = asNumber(summary?.purchases?.usd)
      const adRevenue = asNumber(summary?.adRevenue?.estimatedUsd)
      return {
        realtime,
        total: asNumber(summary?.totalEarningsUsd),
        gross: purchases + tips,
        fee: 0,
        net: asNumber(summary?.totalEarningsUsd),
        sales: totalRows,
        tips,
        purchases,
        adRevenue,
        views: asNumber(summary?.adRevenue?.totalViews),
        currency: 'USD',
      }
    }

    const legacy = (summary?.summary || summary || {}) as Partial<EarningsSummary['summary']> & { total_fee?: number; currency?: string }
    return {
      realtime,
      total: asNumber(legacy.total_net),
      gross: asNumber(legacy.total_gross),
      fee: asNumber(legacy.total_platform_fee ?? summary?.total_fee),
      net: asNumber(legacy.total_net),
      sales: asNumber(legacy.total_purchases) || totalRows,
      tips: 0,
      purchases: asNumber(legacy.total_gross),
      adRevenue: 0,
      views: 0,
      currency: legacy.currency || summary?.currency || 'USD',
    }
  }, [summary, totalRows])

  const hasCpmBreakdown = breakdown.length > 0 && breakdown.some(isCpmRow)
  const payoutProgress = Math.min(100, (metrics.net / 50) * 100)
  const payoutRemaining = Math.max(0, 50 - metrics.net)
  const sourceTotal = metrics.tips + metrics.purchases + metrics.adRevenue || 1
  const sourceRows: Array<{ label: string; value: number; color: LteColor }> = [
    { label: 'Paid series sales', value: metrics.purchases, color: 'success' },
    { label: 'Creator tips', value: metrics.tips, color: 'warning' },
    { label: 'Estimated ad revenue', value: metrics.adRevenue, color: 'info' },
  ]

  if (loading) return <RouteLoader />

  return (
    <AdminLTE className="earnings-page -m-2 min-h-full rounded-[24px] p-3 md:-m-4 md:rounded-[18px] md:p-5">
      <ContentHeader
        title="Earnings & payouts"
        description="Track creator revenue, tips, and estimated ad performance."
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Earnings' }]}
        actions={
          <div className="earnings-toolbar">
            <div className="earnings-date-filter">
              <label><CalendarDays size={14} /><span>From</span><input type="date" value={from} onChange={event => setFrom(event.target.value)} aria-label="Earnings start date" /></label>
              <span className="earnings-date-divider" />
              <label><CalendarDays size={14} /><span>To</span><input type="date" value={to} onChange={event => setTo(event.target.value)} aria-label="Earnings end date" /></label>
            </div>
            <button type="button" className="btn btn-default btn-sm" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
          </div>
        }
      />

      {loadError && (
        <div className="callout callout-danger earnings-error-callout">
          <Info size={18} />
          <span>{loadError}</span>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => void load()}>Retry</button>
        </div>
      )}

      <div className="earnings-stat-grid">
        <SmallBox color="success" value={money(metrics.total)} label="Total estimated earnings" icon={<Wallet size={66} />} />
        <SmallBox color="info" value={money(metrics.purchases)} label="Paid series sales" icon={<ShoppingCart size={66} />} />
        <SmallBox color="warning" value={money(metrics.tips)} label="Creator tips" icon={<Gift size={66} />} />
        <SmallBox color="purple" value={money(metrics.adRevenue)} label="Estimated ad revenue" icon={<ChartNoAxesCombined size={66} />} />
      </div>

      <div className="earnings-overview-grid">
        <AdminCard title="Revenue sources" icon={<LineChart size={18} />} outline="primary">
          <div className="earnings-source-grid">
            <InfoBox color="success" icon={<ShoppingCart size={26} />} text="Paid series sales" number={money(metrics.purchases)} progress={(metrics.purchases / sourceTotal) * 100} progressDescription={`${Math.round((metrics.purchases / sourceTotal) * 100)}% of total`} />
            <InfoBox color="warning" icon={<Gift size={26} />} text="Creator tips" number={money(metrics.tips)} progress={(metrics.tips / sourceTotal) * 100} progressDescription={`${Math.round((metrics.tips / sourceTotal) * 100)}% of total`} />
            <InfoBox color="info" icon={<Eye size={26} />} text="Estimated ads" number={money(metrics.adRevenue)} progress={(metrics.adRevenue / sourceTotal) * 100} progressDescription={`${number(metrics.views)} views tracked`} />
          </div>
          <div className="earnings-source-list">
            {sourceRows.map(source => (
              <div key={source.label} className="earnings-source-row">
                <div><span className={`earnings-source-dot lte-bg-${source.color}`} /><span>{source.label}</span></div>
                <strong>{money(source.value)}</strong>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Payout center" icon={<Banknote size={18} />} outline="warning">
          <div className="earnings-payout-panel">
            <span className="earnings-eyebrow">Estimated available balance</span>
            <strong>{money(metrics.net)}</strong>
            <div className="earnings-payout-meta"><span>Minimum payout</span><b>$50.00</b></div>
            <ProgressBar value={payoutProgress} color={metrics.net >= 50 ? 'success' : 'warning'} size="sm" />
            <div className="earnings-payout-foot"><small>{metrics.net >= 50 ? 'Your balance has reached the payout threshold.' : `${money(payoutRemaining)} remaining to reach the payout threshold.`}</small><LteBadge color={metrics.net >= 50 ? 'success' : 'warning'}>{metrics.net >= 50 ? 'Eligible' : 'Building balance'}</LteBadge></div>
          </div>
          <div className="callout callout-info earnings-payout-note"><Clock3 size={16} /><span>Payouts are reviewed and processed after earnings are confirmed.</span></div>
        </AdminCard>
      </div>

      <div className="callout callout-info earnings-method-callout">
        <Sparkles size={20} />
        <div><strong>How your earnings are calculated</strong><p>Paid series sales and tips are combined with estimated ad revenue. Ads are estimated at a $0.50 CPM and may change when final analytics are confirmed.</p></div>
      </div>

      <AdminCard
        title={hasCpmBreakdown ? 'Ad performance by series' : 'Recent transactions'}
        icon={hasCpmBreakdown ? <ChartNoAxesCombined size={18} /> : <ReceiptText size={18} />}
        outline="success"
        tools={<LteBadge color="secondary">{number(totalRows || breakdown.length)} records</LteBadge>}
        bodyClassName="p-0"
      >
        {hasCpmBreakdown ? (
          <>
            <div className="earnings-desktop-table table-responsive">
              <table className="table table-striped table-hover">
                <thead><tr><th>Series</th><th style={{ textAlign: 'right' }}>Views</th><th style={{ textAlign: 'right' }}>CPM rate</th><th style={{ textAlign: 'right' }}>Estimated revenue</th></tr></thead>
                <tbody>
                  {breakdown.map((item, index) => {
                    const earning = item as CpmBreakdown
                    return <tr key={`${earning.videoId}-${index}`}><td><strong>{earning.title || `Series #${earning.videoId}`}</strong><br /><small className="lte-text-muted">Ad-supported performance</small></td><td style={{ textAlign: 'right' }}>{number(earning.views)}</td><td style={{ textAlign: 'right' }}>{money(earning.cpm)}</td><td style={{ textAlign: 'right' }}><strong className="lte-text-success">+{money(cpmValue(earning))}</strong></td></tr>
                  })}
                </tbody>
              </table>
            </div>
            <div className="earnings-mobile-list">{breakdown.map((item, index) => <CpmPerformanceRow key={`${(item as CpmBreakdown).videoId}-${index}`} earning={item as CpmBreakdown} />)}</div>
          </>
        ) : (
          <>
            <div className="earnings-desktop-table table-responsive">
              <table className="table table-striped table-hover">
                <thead><tr><th>Content details</th><th style={{ textAlign: 'right' }}>Gross sale</th><th style={{ textAlign: 'right' }}>Platform fee</th><th style={{ textAlign: 'right' }}>Your net</th><th style={{ textAlign: 'right' }}>Date</th></tr></thead>
                <tbody>
                  {breakdown.length === 0 ? <tr><td colSpan={5}><div className="empty-state"><ReceiptText size={34} /><h2>No transactions yet</h2><p>Completed series sales will appear here.</p></div></td></tr> : breakdown.map((item, index) => {
                    const earning = item as CreatorEarning & { gross?: number; fee?: number; net?: number }
                    return <tr key={earning.earning_id || index}><td><strong>{earning.video_title || `Series #${earning.video_id}`}</strong><br /><small className="lte-text-muted">TRX-{earning.earning_id}</small></td><td style={{ textAlign: 'right' }}>{money(earning.gross ?? earning.gross_amount)}</td><td style={{ textAlign: 'right' }}><span className="lte-text-danger">-{money(earning.fee ?? earning.platform_fee)}</span></td><td style={{ textAlign: 'right' }}><strong className="lte-text-success">+{money(earning.net ?? earning.net_amount)}</strong></td><td style={{ textAlign: 'right' }}><small className="lte-text-muted">{dateLabel(earning.earned_at)}</small></td></tr>
                  })}
                </tbody>
              </table>
            </div>
            <div className="earnings-mobile-list">{breakdown.length === 0 ? <div className="empty-state"><ReceiptText size={34} /><h2>No transactions yet</h2><p>Completed series sales will appear here.</p></div> : breakdown.map((item, index) => <LegacyTransactionRow key={(item as CreatorEarning).earning_id || index} earning={item as CreatorEarning} />)}</div>
          </>
        )}
      </AdminCard>

      <div className="earnings-footer-note"><Percent size={15} /><span>{metrics.realtime ? 'Figures are estimates until the corresponding payout is confirmed.' : 'Financial totals reflect the selected reporting period.'}</span></div>
    </AdminLTE>
  )
}
