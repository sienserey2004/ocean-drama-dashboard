import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  FileVideo,
  Library,
  Lock,
  MoreVertical,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import { useSubscriptionStore } from '@/app/stores/subscriptionStore'
import { creatorApi, type CreatorStats } from '@/app/api/creator.service'
import type { Video } from '@/app/types'
import { RouteLoader } from '@/_ocean/ui'
import {
  AdminCard,
  AdminLTE,
  ContentHeader,
  InfoBox,
  LteBadge,
  SmallBox,
  type LteColor,
} from '@/app/module/shared/adminlte'

const compactNumber = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

const formatMoney = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (value?: string) => {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusColor = (status?: string): LteColor => {
  if (status === 'published' || status === 'ready') return 'success'
  if (status === 'rejected' || status === 'failed') return 'danger'
  return 'warning'
}

const isPublished = (status?: string) => status === 'published' || status === 'ready'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { subscription } = useSubscriptionStore()
  const [statsData, setStatsData] = useState<CreatorStats | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const isAdmin = user?.role === 'admin'
  const isPremium = subscription?.status === 'active'
  const isLocked = !isAdmin && !isPremium

  const loadData = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [stats, recentVideos] = await Promise.all([
        creatorApi.getStats(),
        creatorApi.getRecentVideos(5),
      ])
      setStatsData(stats)
      setVideos(recentVideos.data || [])
    } catch (error) {
      console.error('Dashboard load error', error)
      setStatsData(null)
      setVideos([])
      setLoadError('Studio data could not be loaded. Check the API connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  const publishedCount = useMemo(() => videos.filter(video => isPublished(video.status)).length, [videos])
  const totalViews = statsData?.total_views || 0
  const totalFollowers = statsData?.total_followers || 0
  const totalVideos = statsData?.total_videos || 0
  const totalEarnings = statsData?.total_earnings || 0
  const profileReady = Boolean(user?.name && user?.email)

  if (loading) return <RouteLoader />

  return (
    <AdminLTE className="studio-page -m-2 min-h-full rounded-[24px] p-3 md:-m-4 md:rounded-[18px] md:p-5">
      <ContentHeader
        title="Creator Studio"
        description="Publish, measure, and grow your drama series from one workspace."
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'App Studio' }]}
        actions={
          <div className="studio-header-actions">
            <button type="button" className="btn btn-default btn-sm" onClick={() => void loadData()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/videos/create')}><Plus size={15} /> New series</button>
          </div>
        }
      />

      <div className={`studio-access-banner ${isLocked ? 'is-locked' : 'is-ready'}`}>
        <span className="studio-access-icon">{isLocked ? <Lock size={22} /> : isAdmin ? <ShieldCheck size={22} /> : <Sparkles size={22} />}</span>
        <div className="studio-access-copy">
          <strong>{isLocked ? 'Creator monetization is locked' : isAdmin ? 'Admin studio workspace' : 'Your creator studio is ready'}</strong>
          <p>{isLocked ? 'Upgrade to Premium Creator to unlock payout tracking, coin pricing, and monetization tools.' : isAdmin ? 'Review platform content and monitor creator performance from this workspace.' : `Your ${subscription?.plan?.name || 'Premium Creator'} plan unlocks revenue tools and publishing insights.`}</p>
        </div>
        {isLocked ? <button type="button" className="btn btn-warning btn-sm" onClick={() => navigate('/subscription-plan')}><Zap size={15} /> Upgrade plan</button> : <LteBadge color="success">Active access</LteBadge>}
      </div>

      {loadError && (
        <div className="callout callout-danger studio-error-callout">
          <AlertCircle size={18} /><span>{loadError}</span><button type="button" className="btn btn-danger btn-sm" onClick={() => void loadData()}>Retry</button>
        </div>
      )}

      <div className="studio-stat-grid">
        <SmallBox color="info" value={compactNumber(totalViews)} label="Total views" icon={<Eye size={66} />} footerText="View analytics" to="/dashboard/analytics" />
        {isLocked ? (
          <SmallBox color="warning" value="Locked" label="Creator earnings" icon={<Lock size={66} />} footerText="Unlock payouts" to="/subscription-plan" />
        ) : (
          <SmallBox color="success" value={formatMoney(totalEarnings)} label="Estimated earnings" icon={<Wallet size={66} />} footerText="Open earnings" to="/dashboard/earnings" />
        )}
        <SmallBox color="purple" value={compactNumber(totalFollowers)} label="Followers" icon={<Users size={66} />} footerText="View profile" to="/dashboard/profile" />
        <SmallBox color="warning" value={totalVideos} label="Total series" icon={<FileVideo size={66} />} footerText="Manage series" to="/dashboard/videos" />
      </div>

      <div className="studio-content-grid">
        <div className="studio-main-column">
          <AdminCard title="Performance overview" icon={<TrendingUp size={18} />} outline="primary" tools={<LteBadge color="secondary">Live summary</LteBadge>}>
            <div className="studio-performance-grid">
              <InfoBox color="info" icon={<Eye size={26} />} text="Total views" number={compactNumber(totalViews)} progress={Math.min(100, totalViews ? 100 : 0)} progressDescription="Across all published series" />
              <InfoBox color="purple" icon={<Users size={26} />} text="Audience" number={compactNumber(totalFollowers)} progress={Math.min(100, totalFollowers ? 100 : 0)} progressDescription="Followers and returning viewers" />
            </div>
            <div className="studio-chart-placeholder">
              <div className="studio-chart-icon"><BarChart3 size={28} /></div>
              <div><strong>Weekly analytics are coming soon</strong><p>Detailed view and engagement trends will appear here as your series collect more activity.</p></div>
            </div>
          </AdminCard>

          <AdminCard title="Recent series updates" icon={<Library size={18} />} outline="success" tools={<button type="button" className="btn btn-tool" onClick={() => navigate('/dashboard/videos')}>View all <ArrowRight size={14} /></button>} bodyClassName="p-0">
            {videos.length === 0 ? (
              <div className="empty-state studio-empty-state"><FileVideo size={38} /><h2>No series uploaded yet</h2><p>Create your first drama series to start building your studio.</p><button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/videos/create')}><Plus size={15} /> Create series</button></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover studio-series-table">
                  <thead><tr><th>Series</th><th>Views</th><th>Status</th><th>Updated</th><th style={{ width: 60 }} /></tr></thead>
                  <tbody>
                    {videos.map(video => (
                      <tr key={video.video_id}>
                        <td><div className="studio-series-cell"><div className="studio-series-thumb">{video.thumbnail_url ? <img src={video.thumbnail_url} alt="" /> : <Play size={20} />}</div><div><strong>{video.title}</strong><small>{video.episode_count || 0} episodes</small></div></div></td>
                        <td>{compactNumber(video.view_count || 0)}</td>
                        <td><LteBadge color={statusColor(video.status)}>{(video.status || 'pending').toUpperCase()}</LteBadge></td>
                        <td><small className="lte-text-muted">{formatDate(video.updated_at || video.created_at)}</small></td>
                        <td><button type="button" className="btn-tool studio-row-action" onClick={() => navigate(`/dashboard/videos/${video.video_id}/episodes`)} aria-label={`Open ${video.title}`}><MoreVertical size={17} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>

        <aside className="studio-side-column">
          <AdminCard title="Studio actions" icon={<Zap size={18} />} outline="warning">
            <div className="studio-action-list">
              <button type="button" onClick={() => navigate('/dashboard/videos/create')}><span className="studio-action-icon lte-bg-primary"><Upload size={17} /></span><span><strong>Upload a series</strong><small>Start a new submission</small></span><ArrowRight size={15} /></button>
              <button type="button" onClick={() => navigate('/dashboard/videos')}><span className="studio-action-icon lte-bg-info"><Library size={17} /></span><span><strong>Manage content</strong><small>Edit videos and episodes</small></span><ArrowRight size={15} /></button>
              <button type="button" onClick={() => navigate('/dashboard/earnings')}><span className="studio-action-icon lte-bg-success"><DollarSign size={17} /></span><span><strong>Review earnings</strong><small>{isLocked ? 'Upgrade to unlock payouts' : 'Revenue and payout details'}</small></span><ArrowRight size={15} /></button>
            </div>
          </AdminCard>

          <AdminCard title="Publishing checklist" icon={<CheckCircle2 size={18} />} outline="info">
            <ul className="studio-checklist">
              <li className={profileReady ? 'complete' : ''}><span>{profileReady ? <CheckCircle2 size={15} /> : <span>1</span>}</span><div><strong>Complete your profile</strong><small>{profileReady ? 'Profile details are ready' : 'Add your account details'}</small></div></li>
              <li className={totalVideos > 0 ? 'complete' : ''}><span>{totalVideos > 0 ? <CheckCircle2 size={15} /> : <span>2</span>}</span><div><strong>Publish your first series</strong><small>{totalVideos > 0 ? `${totalVideos} series in your workspace` : 'Upload a series to begin'}</small></div></li>
              <li className={!isLocked ? 'complete' : ''}><span>{!isLocked ? <CheckCircle2 size={15} /> : <span>3</span>}</span><div><strong>Unlock monetization</strong><small>{isLocked ? 'Premium Creator access required' : 'Earnings tools are active'}</small></div></li>
            </ul>
          </AdminCard>

          <AdminCard title="Creator tip" icon={<Sparkles size={18} />}>
            <div className="studio-tip"><div className="studio-tip-icon"><TrendingUp size={20} /></div><div><strong>Keep viewers coming back</strong><p>Publish consistently and use strong episode titles so your audience knows what to watch next.</p></div></div>
          </AdminCard>
        </aside>
      </div>

      <div className="studio-footer-note"><Clock3 size={15} /><span>Studio totals update when new content activity is processed.</span></div>
    </AdminLTE>
  )
}
