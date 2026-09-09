import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, ArrowUpDown, Layers, RotateCcw, Loader2,
  Film, Eye, ThumbsUp, Gift, List,
} from 'lucide-react'
import {
  AdminLTE, ContentHeader, AdminCard, SmallBox, LteBadge, Pagination,
  type LteColor,
} from '@/app/module/shared/adminlte'
import type { Video, Category, VideoStatus } from '@/app/types'
import { videoApi } from '@/app/api/video.service'
import { categoryApi } from '@/app/api/categoryTag.service'

const SORT_OPTIONS = [
  { value: 'latest',  label: 'Latest Release' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'liked',   label: 'Top Rated' },
]

const STATUS_COLOR: Record<VideoStatus, LteColor> = {
  published: 'success',
  ready:     'info',
  pending:   'warning',
  rejected:  'danger',
  failed:    'danger',
}

const LIMIT = 12

export default function BrowseVideosPage() {
  const navigate = useNavigate()

  const [videos, setVideos]         = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)

  // `searchInput` is what the box holds; `search` is what has been submitted,
  // so typing no longer fires a request per keystroke.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('')
  const [sort, setSort]               = useState('latest')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit: LIMIT, sort }
      if (category) params.category = category
      if (search)   params.q = search

      const res = search
        ? await videoApi.search({ q: search, category: category || undefined, page, limit: LIMIT })
        : await videoApi.list(params)

      setVideos(res.data)
      setTotal(res.total)
    } catch {
      setVideos([])
      setTotal(0)
    }
    setLoading(false)
  }, [page, category, sort, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    categoryApi.list().then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const firstRow   = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const lastRow    = Math.min(page * LIMIT, total)

  // Aggregates cover the loaded page only — the API returns no global totals.
  const freeCount    = videos.filter(v => v.is_free).length
  const episodeCount = videos.reduce((sum, v) => sum + (v.episode_count || 0), 0)
  const viewCount    = videos.reduce((sum, v) => sum + (v.view_count || 0), 0)

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategory('')
    setSort('latest')
    setPage(1)
  }

  return (
    <AdminLTE className="-m-2 rounded-[24px] p-3 md:-m-4 md:p-4">
      <ContentHeader
        title="Browse Videos"
        description="Every drama title on the platform, across all creators."
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Browse' }]}
      />

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
        <SmallBox
          color="info"
          value={total.toLocaleString()}
          label="Titles matching filters"
          icon={<Film size={48} />}
        />
        <SmallBox
          color="success"
          value={freeCount}
          label="Free titles on this page"
          icon={<Gift size={48} />}
        />
        <SmallBox
          color="warning"
          value={episodeCount.toLocaleString()}
          label="Episodes on this page"
          icon={<List size={48} />}
        />
        <SmallBox
          color="danger"
          value={viewCount.toLocaleString()}
          label="Views on this page"
          icon={<Eye size={48} />}
        />
      </div>

      {/* Filters */}
      <AdminCard title="Filters" icon={<Filter size={16} />} outline="primary" className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <form className="form-group mb-0" onSubmit={submitSearch}>
            <label htmlFor="browse-search">Search</label>
            <div className="input-group">
              <input
                id="browse-search"
                className="form-control"
                placeholder="Search titles..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <div className="input-group-append">
                <button type="submit" className="btn btn-primary" aria-label="Search">
                  <Search size={16} />
                </button>
              </div>
            </div>
          </form>

          <div className="form-group mb-0">
            <label htmlFor="browse-category">Category</label>
            <select
              id="browse-category"
              className="form-control"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1) }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <label htmlFor="browse-sort">
              <ArrowUpDown size={13} className="mr-1 inline" />
              Sort by
            </label>
            <select
              id="browse-sort"
              className="form-control"
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </AdminCard>

      {/* Results */}
      <AdminCard
        title="All Videos"
        icon={<Layers size={16} />}
        bodyClassName="p-0"
        tools={
          <button type="button" className="btn btn-default btn-sm" onClick={resetFilters}>
            <RotateCcw size={14} /> Reset
          </button>
        }
        footer={
          total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <span className="lte-text-muted text-sm">
                Showing {firstRow} to {lastRow} of {total.toLocaleString()} entries
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )
        }
      >
        {loading ? (
          <div className="empty-state">
            <Loader2 size={32} className="mx-auto animate-spin" />
            <p className="mt-3">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="empty-state">
            <Layers size={56} className="mx-auto opacity-40" />
            <h2>No results found</h2>
            <p className="mx-auto max-w-md">
              No videos match your search. Try adjusting the filters or clearing the keyword.
            </p>
            <button type="button" className="btn btn-primary mt-3" onClick={resetFilters}>
              <RotateCcw size={14} /> Reset All Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Preview</th>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Episodes</th>
                  <th style={{ textAlign: 'right' }}>Views</th>
                  <th style={{ textAlign: 'right' }}>Likes</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ width: 90 }} />
                </tr>
              </thead>
              <tbody>
                {videos.map(video => (
                  <VideoRow
                    key={video.video_id}
                    video={video}
                    onOpen={() => navigate(`/dashboard/videos/${video.video_id}/episodes`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminLTE>
  )
}

function VideoRow({ video, onOpen }: { video: Video; onOpen: () => void }) {
  const categoryNames = (video.categories || []).map((c: any) => (typeof c === 'string' ? c : c.name))

  return (
    <tr className="cursor-pointer" onClick={onOpen}>
      <td>
        <img
          className="table-thumb"
          src={video.thumbnail_url || `https://picsum.photos/seed/${video.video_id}/192/108`}
          alt={video.title}
        />
      </td>
      <td>
        <div className="lte-text-bold">{video.title}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {categoryNames.slice(0, 3).map((name: string) => (
            <LteBadge key={name} color="secondary">{name}</LteBadge>
          ))}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {video.creator?.profile_image ? (
            <img className="user-avatar" src={video.creator.profile_image} alt={video.creator.name} />
          ) : (
            <span className="user-avatar flex items-center justify-center text-xs font-bold text-white">
              {(video.creator?.name || 'S').charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-sm">{video.creator?.name || 'Studio'}</span>
        </div>
      </td>
      <td>
        <LteBadge color={STATUS_COLOR[video.status] ?? 'secondary'}>{video.status}</LteBadge>
      </td>
      <td style={{ textAlign: 'right' }}>{video.episode_count || 0}</td>
      <td style={{ textAlign: 'right' }}>{(video.view_count || 0).toLocaleString()}</td>
      <td style={{ textAlign: 'right' }}>
        <span className="inline-flex items-center gap-1">
          <ThumbsUp size={13} className="lte-text-muted" />
          {(video.like_count || 0).toLocaleString()}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        {video.is_free
          ? <span className="lte-text-success lte-text-bold">FREE</span>
          : <span className="lte-text-bold">${(video.price || 0).toFixed(2)}</span>}
      </td>
      <td>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={e => { e.stopPropagation(); onOpen() }}
        >
          View
        </button>
      </td>
    </tr>
  )
}
