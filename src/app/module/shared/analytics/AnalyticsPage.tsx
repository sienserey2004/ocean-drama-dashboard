import { useEffect, useState } from 'react'
import {
  Users, DollarSign, ShoppingCart, Eye, ThumbsUp, MessageCircle,
  TrendingUp, LineChart, Clock, Share2, Bookmark, Percent, PlayCircle, Lightbulb,
} from 'lucide-react'
import { RouteLoader } from '@/_ocean/ui'
import { useAuthStore } from '@/app/stores/authStore'
import type { AnalyticsOverview, EarningsSummary } from '@/app/types'
import { paymentApi } from '@/app/api/payment.service'
import { analyticsApi } from '@/app/api/admin.service'
import { AdminLTE, ContentHeader, SmallBox, InfoBox, AdminCard, LteBadge, ProgressBar } from '../adminlte'

export default function AnalyticsPage() {
  const { isAdmin } = useAuthStore()
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

  if (loading) return <RouteLoader />

  const perf = insights?.performance
  const eng = insights?.engagement

  // The wrapper bleeds over DashboardLayout's glass-panel padding so AdminLTE's
  // flat #f4f6f9 body reads as the page background; the radius tracks that
  // panel's inner curve until the shell itself is converted.
  return (
    <AdminLTE className="-m-2 min-h-full rounded-[24px] p-3 md:-m-4 md:rounded-[18px] md:p-5">
      <ContentHeader
        title={isAdmin ? 'Platform Insights' : 'Content Performance'}
        description={
          isAdmin
            ? 'Real-time analysis of platform performance and audience engagement.'
            : 'Your earnings and content performance at a glance.'
        }
        breadcrumb={[{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }]}
        actions={
          isAdmin ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: '#28a745' }} />
              <span className="text-sm lte-text-muted">Live Monitoring</span>
            </span>
          ) : undefined
        }
      />

      {isAdmin && insights && (
        <>
          {/* Headline KPIs — AdminLTE small-boxes */}
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            <SmallBox
              color="info"
              value={perf?.total_users?.toLocaleString()}
              label="Total Users"
              icon={<Users size={70} />}
              footerText="Manage users"
              to="/dashboard/profile"
            />
            <SmallBox
              color="success"
              value={`$${perf?.total_revenue?.toLocaleString()}`}
              label="Gross Revenue"
              icon={<DollarSign size={70} />}
              footerText="View earnings"
              to="/dashboard/earnings"
            />
            <SmallBox
              color="warning"
              value={perf?.total_views?.toLocaleString()}
              label="Total Video Views"
              icon={<Eye size={70} />}
              footerText="Browse videos"
              to="/dashboard/browse"
            />
            <SmallBox
              color="danger"
              value={`${Math.round(perf?.total_watch_time / 3600).toLocaleString()}h`}
              label="Total Watch Time"
              icon={<Clock size={70} />}
              footerText="All content"
              to="/dashboard/videos"
            />
          </div>

          {/* Secondary metrics — info-boxes */}
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox
              color="purple"
              icon={<PlayCircle size={30} />}
              text="Daily Active Users"
              number={perf?.dau?.toLocaleString()}
            />
            <InfoBox
              color="maroon"
              icon={<Users size={30} />}
              text="Monthly Active Users"
              number={perf?.mau?.toLocaleString()}
            />
            <InfoBox
              color="indigo"
              icon={<Percent size={30} />}
              text="Conversion Rate"
              number={`${(eng?.conversion_rate * 100).toFixed(1)}%`}
              progress={eng?.conversion_rate * 100}
              progressDescription="Views → Sales"
            />
            <InfoBox
              color="teal"
              icon={<TrendingUp size={30} />}
              text="Completion Rate"
              number={`${(eng?.avg_completion_rate * 100).toFixed(1)}%`}
              progress={eng?.avg_completion_rate * 100}
              progressDescription="Average watch depth"
            />
          </div>

          <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-12">
            {/* Top content table */}
            <div className="lg:col-span-7">
              <AdminCard
                outline="primary"
                icon={<LineChart size={18} />}
                title="Top Content Performance"
                tools={<LteBadge color="secondary">Per Episode</LteBadge>}
                bodyClassName="p-0"
              >
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Episode Title</th>
                        <th style={{ textAlign: 'right' }}>Views</th>
                        <th style={{ width: 160 }}>Completion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.content.top_episodes.map((ep: any) => (
                        <tr key={ep.episode_id}>
                          <td>
                            <span className="text-bold">{ep.title}</span>
                            <br />
                            <small className="lte-text-muted">{ep.video_title}</small>
                          </td>
                          <td style={{ textAlign: 'right' }}>{ep.view_count.toLocaleString()}</td>
                          <td>
                            <ProgressBar
                              value={ep.completion_rate * 100}
                              color={ep.completion_rate > 0.7 ? 'success' : 'warning'}
                              size="xs"
                            />
                            <small className="lte-text-muted">{Math.round(ep.completion_rate * 100)}% completion</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AdminCard>
            </div>

            {/* Social engagement */}
            <div className="lg:col-span-5">
              <AdminCard
                outline="info"
                icon={<ThumbsUp size={18} />}
                title="Social Engagement"
                footer={
                  <div className="flex items-start gap-2">
                    <Lightbulb size={16} className="lte-text-warning shrink-0" style={{ marginTop: 2 }} />
                    <small className="lte-text-muted">
                      Users are dropping off around the 2-minute mark in free previews. Consider moving your
                      &ldquo;hooks&rdquo; earlier in the episode.
                    </small>
                  </div>
                }
              >
                <InfoBox color="danger" icon={<ThumbsUp size={30} />} text="Total Likes" number={eng?.likes?.toLocaleString()} />
                <InfoBox color="success" icon={<MessageCircle size={30} />} text="Member Comments" number={eng?.comments?.toLocaleString()} />
                <InfoBox color="primary" icon={<Share2 size={30} />} text="Video Shares" number={eng?.shares?.toLocaleString()} />
                <InfoBox color="warning" icon={<Bookmark size={30} />} text="Favorites / Saves" number={eng?.favorites?.toLocaleString()} />
              </AdminCard>
            </div>
          </div>
        </>
      )}

      {/* Creator financials */}
      {earnings?.summary && (
        <AdminCard outline="success" icon={<DollarSign size={18} />} title="Creator Financial Performance">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="description-block">
              <h5 className="description-header">${earnings.summary.total_net.toLocaleString()}</h5>
              <span className="description-text">Portfolio Balance</span>
            </div>
            <div className="description-block">
              <h5 className="description-header">${earnings.summary.total_gross.toLocaleString()}</h5>
              <span className="description-text">Projected Sales</span>
            </div>
            <div className="description-block">
              <h5 className="description-header">
                <ShoppingCart size={16} className="mr-1 inline" />
                {earnings.summary.total_purchases}
              </h5>
              <span className="description-text">Paid Conversions</span>
            </div>
          </div>
        </AdminCard>
      )}
    </AdminLTE>
  )
}
