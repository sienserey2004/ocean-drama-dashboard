import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, Clock, Edit2, Film, Filter, Image as ImageIcon,
  Layers, ListVideo, Loader2, Plus, RefreshCw, Search, Trash2,
  X, XCircle,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from '@/app/utils/toast'
import { useAuthStore } from '@/app/stores/authStore'
import { videoApi } from '@/app/api/video.service'
import { adminVideoApi } from '@/app/api/admin.service'
import { categoryApi, tagApi } from '@/app/api/categoryTag.service'
import type { Category, Episode, Tag, Video, VideoRess } from '@/app/types'
import {
  AdminCard, AdminLTE, ContentHeader, LteBadge, Pagination, SmallBox,
  type LteColor,
} from '@/app/module/shared/adminlte'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0),
  is_free: z.boolean(),
  category_ids: z.array(z.number()),
  tag_ids: z.array(z.number()),
})

type VideoFormData = z.infer<typeof schema>

const LIMIT = 10
const FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'pending', label: 'Pending review' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_COLOR: Record<string, LteColor> = {
  published: 'success',
  pending: 'warning',
  rejected: 'danger',
  ready: 'info',
}

export default function MyVideosPage() {
  const { isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const thumbnailInput = useRef<HTMLInputElement>(null)

  const [videos, setVideos] = useState<VideoRess[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [activeVideo, setActiveVideo] = useState<VideoRess | null>(null)
  const [editVideo, setEditVideo] = useState<Video | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [processingEpisodes] = useState<Episode[]>([])

  const {
    control, register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm<VideoFormData>({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, is_free: false, category_ids: [], tag_ids: [] },
  })
  const isFree = watch('is_free')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const params = { page, limit: LIMIT, ...(statusFilter && { status: statusFilter }) }
      const response = isAdmin
        ? await adminVideoApi.list(params)
        : await videoApi.getMyVideos(params)
      setVideos(response.data)
      setTotal(response.total)
    } catch {
      setVideos([])
      setTotal(0)
      setLoadError('Videos could not be loaded. Check the API connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, page, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    Promise.all([categoryApi.list(), tagApi.list()])
      .then(([categoryResponse, tagResponse]) => {
        setCategories(categoryResponse.data)
        setTags(tagResponse.data)
      })
      .catch(() => {})
  }, [])
  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  const displayedVideos = videos.filter(video => {
    if (!search.trim()) return true
    const needle = search.toLowerCase()
    return video.title.toLowerCase().includes(needle)
      || String(video.creator || '').toLowerCase().includes(needle)
      || String(video.video_id).includes(needle)
  })
  const publishedCount = videos.filter(video => String(video.status).toLowerCase() === 'published').length
  const pendingCount = videos.filter(video => String(video.status).toLowerCase() === 'pending').length
  const rejectedCount = videos.filter(video => String(video.status).toLowerCase() === 'rejected').length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const firstRow = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const lastRow = Math.min(page * LIMIT, total)

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setSearch(searchInput.trim())
  }
  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatusFilter('')
    setPage(1)
  }

  const openEdit = async (summary: VideoRess) => {
    try {
      const video = await videoApi.getById(summary.video_id)
      setEditVideo(video)
      reset({
        title: video.title,
        description: video.description || '',
        price: video.price || (video as any).total_price || 0,
        is_free: video.is_free,
        category_ids: video.categories?.map(category => category.category_id) || [],
        tag_ids: video.tags?.map(tag => tag.tag_id) || [],
      })
      setPreview(video.thumbnail_url || null)
      setThumbnail(null)
      setProgress(0)
      setIsEditOpen(true)
    } catch {
      toast.error('Failed to load video details')
    }
  }

  const saveVideo = async (data: VideoFormData) => {
    if (!editVideo) return
    setSubmitting(true)
    try {
      const formData = new window.FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('price', data.is_free ? '0' : data.price.toString())
      formData.append('is_free', data.is_free.toString())
      formData.append('category_ids', data.category_ids.join(','))
      formData.append('tag_ids', data.tag_ids.join(','))
      if (thumbnail) formData.append('thumbnail', thumbnail)
      await videoApi.update(editVideo.video_id, formData, setProgress)
      toast.success('Video updated successfully')
      setIsEditOpen(false)
      await load()
    } catch {
      toast.error('Failed to update video')
    } finally {
      setSubmitting(false)
      setProgress(0)
    }
  }

  const deleteVideo = async () => {
    if (!activeVideo) return
    try {
      if (isAdmin) await adminVideoApi.forceDelete(activeVideo.video_id)
      else await videoApi.delete(activeVideo.video_id)
      toast.success('Video deleted')
      setIsDeleteOpen(false)
      setActiveVideo(null)
      await load()
    } catch {
      toast.error('Failed to delete video')
    }
  }
  const approveVideo = async (video: VideoRess) => {
    try {
      await adminVideoApi.approve(video.video_id)
      toast.success('Video approved')
      await load()
    } catch {
      toast.error('Failed to approve video')
    }
  }
  const rejectVideo = async () => {
    if (!activeVideo || !rejectReason.trim()) return
    try {
      await adminVideoApi.reject(activeVideo.video_id, rejectReason.trim())
      toast.success('Video rejected')
      setIsRejectOpen(false)
      setRejectReason('')
      setActiveVideo(null)
      await load()
    } catch {
      toast.error('Failed to reject video')
    }
  }
  const selectThumbnail = (file: File) => {
    setThumbnail(file)
    setPreview(URL.createObjectURL(file))
  }

  return (
    <AdminLTE className="-m-2 min-h-full rounded-[24px] p-3 md:-m-4 md:rounded-[18px] md:p-5">
      <ContentHeader
        title={isAdmin ? 'Manage Videos' : 'My Videos'}
        description={isAdmin ? 'Review and manage every series published on the platform.' : 'Manage your series, episodes, pricing, and publishing status.'}
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Videos' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-default btn-sm" onClick={() => setIsQueueOpen(true)}>
              <Clock size={15} /> Processing queue
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/videos/create')}>
              <Plus size={15} /> Add new video
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
        <SmallBox color="info" value={total.toLocaleString()} label="Total videos" icon={<Film size={58} />} />
        <SmallBox color="success" value={publishedCount} label="Published on this page" icon={<CheckCircle size={58} />} />
        <SmallBox color="warning" value={pendingCount} label="Pending on this page" icon={<Clock size={58} />} />
        <SmallBox color="danger" value={rejectedCount} label="Rejected on this page" icon={<XCircle size={58} />} />
      </div>

      <AdminCard title="Video filters" icon={<Filter size={17} />} outline="primary" className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end">
          <form className="form-group mb-0" onSubmit={submitSearch}>
            <label htmlFor="video-search">Search videos</label>
            <div className="input-group">
              <input id="video-search" className="form-control" placeholder="Search by title, creator, or ID..." value={searchInput} onChange={event => setSearchInput(event.target.value)} />
              <div className="input-group-append">
                <button type="submit" className="btn btn-primary" aria-label="Search videos"><Search size={16} /></button>
              </div>
            </div>
          </form>
          <div className="form-group mb-0">
            <label htmlFor="video-status">Publishing status</label>
            <select id="video-status" className="form-control" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1) }}>
              {FILTERS.map(filter => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-default" onClick={clearFilters}><RefreshCw size={15} /> Reset</button>
        </div>
      </AdminCard>

      <AdminCard
        title={isAdmin ? 'Platform video library' : 'Your video library'}
        icon={<ListVideo size={17} />}
        bodyClassName="p-0"
        tools={<LteBadge color="secondary">{displayedVideos.length} shown</LteBadge>}
        footer={total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="lte-text-muted text-sm">Showing {firstRow} to {lastRow} of {total.toLocaleString()} entries</span>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      >
        {loading ? (
          <div className="empty-state"><Loader2 size={34} className="mx-auto animate-spin" /><p className="mt-3">Loading videos...</p></div>
        ) : loadError ? (
          <div className="empty-state">
            <XCircle size={48} className="lte-text-danger mx-auto" /><h2>Unable to load videos</h2><p>{loadError}</p>
            <button type="button" className="btn btn-primary mt-3" onClick={load}><RefreshCw size={15} /> Try again</button>
          </div>
        ) : displayedVideos.length === 0 ? (
          <div className="empty-state">
            <Layers size={54} className="mx-auto opacity-40" /><h2>No videos found</h2>
            <p>{search ? 'No videos on this page match your search.' : 'Create your first series to start building your library.'}</p>
            <button type="button" className="btn btn-primary mt-3" onClick={search ? clearFilters : () => navigate('/dashboard/videos/create')}>
              {search ? <><RefreshCw size={15} /> Clear filters</> : <><Plus size={15} /> Add new video</>}
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-striped video-management-table">
              <thead><tr>
                <th style={{ width: 110 }}>Preview</th><th>Video</th>{isAdmin && <th>Creator</th>}
                <th style={{ textAlign: 'center' }}>Episodes</th><th style={{ textAlign: 'right' }}>Price</th><th>Status</th>
                <th style={{ minWidth: isAdmin ? 250 : 170, textAlign: 'right' }}>Actions</th>
              </tr></thead>
              <tbody>{displayedVideos.map(video => (
                <VideoRow
                  key={video.video_id} video={video} isAdmin={isAdmin}
                  onManage={() => navigate(`/dashboard/videos/${video.video_id}/episodes`)}
                  onEdit={() => openEdit(video)}
                  onDelete={() => { setActiveVideo(video); setIsDeleteOpen(true) }}
                  onApprove={() => approveVideo(video)}
                  onReject={() => { setActiveVideo(video); setIsRejectOpen(true) }}
                />
              ))}</tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <LteDialog open={isDeleteOpen && !!activeVideo} title="Delete video" icon={<Trash2 size={18} />} onClose={() => setIsDeleteOpen(false)}>
        {activeVideo && <>
          <VideoSummary video={activeVideo} />
          <div className="callout callout-danger">This permanently deletes the series and all of its episodes. This action cannot be undone.</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={deleteVideo}><Trash2 size={15} /> Delete video</button>
          </div>
        </>}
      </LteDialog>

      <LteDialog open={isRejectOpen && !!activeVideo} title="Reject video" icon={<XCircle size={18} />} onClose={() => setIsRejectOpen(false)}>
        {activeVideo && <>
          <VideoSummary video={activeVideo} />
          <div className="form-group">
            <label htmlFor="reject-reason">Reason for rejection</label>
            <textarea id="reject-reason" className="form-control textarea-control" rows={4} placeholder="Explain what the creator needs to change..." value={rejectReason} onChange={event => setRejectReason(event.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default" onClick={() => setIsRejectOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" disabled={!rejectReason.trim()} onClick={rejectVideo}>Reject video</button>
          </div>
        </>}
      </LteDialog>

      <LteDialog open={isQueueOpen} title="Processing queue" icon={<Clock size={18} />} onClose={() => setIsQueueOpen(false)}>
        {processingEpisodes.length === 0 ? (
          <div className="empty-state compact"><Clock size={42} className="mx-auto opacity-40" /><h2>Queue is clear</h2><p>Episodes appear here while they are being encoded or reviewed.</p></div>
        ) : (
          <div className="queue-list">{processingEpisodes.map(episode => (
            <div className="queue-item" key={episode.episode_id}><Clock size={18} className="lte-text-warning" /><div><strong>{episode.title}</strong><small>Processing...</small></div></div>
          ))}</div>
        )}
        <div className="modal-footer"><button type="button" className="btn btn-default" onClick={() => setIsQueueOpen(false)}>Close</button></div>
      </LteDialog>

      <LteDialog open={isEditOpen} title="Edit video" icon={<Edit2 size={18} />} onClose={() => !submitting && setIsEditOpen(false)} size="lg">
        <form id="edit-video-form" onSubmit={handleSubmit(saveVideo)}>
          <div className="edit-video-grid">
            <div>
              <div className="form-group">
                <label>Thumbnail artwork</label>
                <button type="button" className="thumbnail-picker" onClick={() => thumbnailInput.current?.click()}>
                  {preview ? <img src={preview} alt="Video thumbnail preview" /> : <span><ImageIcon size={38} /> Select an image</span>}
                </button>
                <input ref={thumbnailInput} type="file" accept="image/*" hidden onChange={event => event.target.files?.[0] && selectThumbnail(event.target.files[0])} />
              </div>
              {progress > 0 && <div className="upload-progress">
                <div><span>Uploading thumbnail</span><strong>{progress}%</strong></div>
                <div className="progress progress-sm"><span className="progress-bar lte-bg-primary" style={{ width: `${progress}%` }} /></div>
              </div>}
            </div>
            <div>
              <div className="form-group">
                <label htmlFor="edit-title">Title</label>
                <input id="edit-title" className={`form-control ${errors.title ? 'is-invalid' : ''}`} {...register('title')} />
                {errors.title && <small className="invalid-feedback">{errors.title.message}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea id="edit-description" rows={5} className={`form-control textarea-control ${errors.description ? 'is-invalid' : ''}`} {...register('description')} />
                {errors.description && <small className="invalid-feedback">{errors.description.message}</small>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-access">Access</label>
                  <Controller name="is_free" control={control} render={({ field }) => (
                    <select id="edit-access" className="form-control" value={field.value ? 'free' : 'paid'} onChange={event => field.onChange(event.target.value === 'free')}>
                      <option value="free">Free</option><option value="paid">Paid</option>
                    </select>
                  )} />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-price">Price (USD)</label>
                  <input id="edit-price" type="number" min="0" step="0.01" className="form-control" readOnly={isFree} {...register('price')} />
                </div>
              </div>
            </div>
          </div>
          <div className="form-row selection-row">
            <CheckboxGroup name="category_ids" label="Categories" items={categories.map(item => ({ id: item.category_id, label: item.name }))} control={control} />
            <CheckboxGroup name="tag_ids" label="Tags" items={tags.map(item => ({ id: item.tag_id, label: item.name }))} control={control} />
          </div>
        </form>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" disabled={submitting} onClick={() => setIsEditOpen(false)}>Cancel</button>
          <button type="submit" form="edit-video-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save changes'}
          </button>
        </div>
      </LteDialog>
    </AdminLTE>
  )
}

function VideoRow({ video, isAdmin, onManage, onEdit, onDelete, onApprove, onReject }: {
  video: VideoRess; isAdmin: boolean; onManage: () => void; onEdit: () => void
  onDelete: () => void; onApprove: () => void; onReject: () => void
}) {
  const status = String(video.status || 'pending').toLowerCase()
  return <tr>
    <td>{video.thumbnail_url ? <img className="table-thumb" src={video.thumbnail_url} alt={video.title} /> : <div className="table-thumb table-thumb-placeholder"><Film size={22} /></div>}</td>
    <td><div className="lte-text-bold video-table-title">{video.title}</div><small className="lte-text-muted">Video ID: #{video.video_id}</small></td>
    {isAdmin && <td><div className="creator-cell"><span className="user-avatar">{String(video.creator || 'U').charAt(0).toUpperCase()}</span><span>{video.creator || 'Unknown creator'}</span></div></td>}
    <td style={{ textAlign: 'center' }}><LteBadge color="secondary">{video.episodes_count || 0}</LteBadge></td>
    <td style={{ textAlign: 'right' }} className="lte-text-bold">${Number(video.price || 0).toFixed(2)}</td>
    <td><LteBadge color={STATUS_COLOR[status] || 'secondary'}>{status}</LteBadge></td>
    <td><div className="table-actions">
      {isAdmin && status === 'pending' && <>
        <button type="button" className="btn btn-success btn-sm" onClick={onApprove} title="Approve"><CheckCircle size={14} /> Approve</button>
        <button type="button" className="btn btn-danger btn-sm" onClick={onReject} title="Reject"><XCircle size={14} /></button>
      </>}
      <button type="button" className="btn btn-primary btn-sm" onClick={onManage} title="Manage episodes"><Layers size={14} /> Episodes</button>
      <button type="button" className="btn btn-default btn-sm" onClick={onEdit} title="Edit video"><Edit2 size={14} /></button>
      <button type="button" className="btn btn-default btn-sm lte-text-danger" onClick={onDelete} title="Delete video"><Trash2 size={14} /></button>
    </div></td>
  </tr>
}

function VideoSummary({ video }: { video: VideoRess }) {
  return <div className="video-summary">
    {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" /> : <span className="video-summary-placeholder"><Film size={24} /></span>}
    <div><strong>{video.title}</strong><small>Video ID: #{video.video_id}</small></div>
  </div>
}

function LteDialog({ open, title, icon, onClose, size = 'md', children }: {
  open: boolean; title: string; icon?: React.ReactNode; onClose: () => void
  size?: 'md' | 'lg'; children: React.ReactNode
}) {
  if (!open) return null
  return <div className="lte-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className={`lte-modal-dialog lte-modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="lte-modal-header"><h3>{icon}{title}</h3><button type="button" className="btn-tool" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <div className="lte-modal-body">{children}</div>
    </section>
  </div>
}

function CheckboxGroup({ name, label, items, control }: {
  name: 'category_ids' | 'tag_ids'; label: string
  items: { id: number; label: string }[]; control: any
}) {
  return <Controller name={name} control={control} render={({ field }) => (
    <fieldset className="form-group checkbox-fieldset">
      <legend>{label}</legend>
      <div className="checkbox-list">
        {items.length === 0 ? <small className="lte-text-muted">No {label.toLowerCase()} available.</small> : items.map(item => {
          const checked = field.value.includes(item.id)
          return <label key={item.id}>
            <input type="checkbox" checked={checked} onChange={() => field.onChange(checked ? field.value.filter((id: number) => id !== item.id) : [...field.value, item.id])} />
            {item.label}
          </label>
        })}
      </div>
    </fieldset>
  )} />
}
