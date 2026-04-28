import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, MoreVertical, Play, Edit2, Trash2,
  CheckCircle, XCircle, Clock, Info, X, ChevronRight, Image as ImageIcon,
  Layers, Folder
} from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/app/stores/authStore'
import { videoApi } from '@/app/api/video.service'
import { adminVideoApi } from '@/app/api/admin.service'
import { episodeApi } from '@/app/api/episode.service'
import { categoryApi, tagApi } from '@/app/api/categoryTag.service'
import type { Video, Category, Tag, VideoRess, Episode } from '@/app/types'
import toast from 'react-hot-toast'

// Form Schema
const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  price: z.coerce.number().min(0),
  is_free: z.boolean(),
  category_ids: z.array(z.number()),
  tag_ids: z.array(z.number()),
})
type VideoFormData = z.infer<typeof schema>

const STATUS_CONFIG: Record<string, { color: string, bg: string, label: string, icon: any }> = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Pending', icon: Clock },
  published: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Published', icon: CheckCircle },
  rejected: { color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Rejected', icon: XCircle },
}

export default function MyVideosPage() {
  const { isAdmin, user } = useAuthStore()
  const navigate = useNavigate()

  // State
  const [videos, setVideos] = useState<VideoRess[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState<VideoRess | null>(null)
  const [editVideo, setEditVideo] = useState<Video | null>(null)

  // Modal/Drawer States
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isQueueOpen, setIsQueueOpen] = useState(false)

  const [rejectReason, setRejectReason] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [dragging, setDragging] = useState(false)

  const [processingEpisodes, setProcessingEpisodes] = useState<Episode[]>([])
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const LIMIT = 10

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<VideoFormData>({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, is_free: false, category_ids: [], tag_ids: [] },
  })

  // Data Loading
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, ...(statusFilter && { status: statusFilter }) }
      const res = isAdmin
        ? await adminVideoApi.list(params)
        : await videoApi.getMyVideos(params)
      setVideos(res.data as any)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, page, statusFilter, user?.user_id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    categoryApi.list().then(r => setCategories(r.data))
    tagApi.list().then(r => setTags(r.data))
  }, [])

  // Actions
  const openCreate = () => { navigate('/dashboard/videos/create') }

  const openEdit = async (vs: VideoRess) => {
    try {
      const v = await videoApi.getById(vs.video_id)
      setEditVideo(v)
      reset({
        title: v.title,
        description: v.description || '',
        price: v.price || (v as any).total_price || 0,
        is_free: v.is_free,
        category_ids: v.categories?.map(c => c.category_id) || [],
        tag_ids: v.tags?.map(t => t.tag_id) || []
      })
      setPreview(v.thumbnail_url || null)
      setFile(null)
      setProgress(0)
      setIsEditOpen(true)
      setIsDrawerOpen(false) // Close mobile options if open
    } catch {
      toast.error('Failed to load video details')
    }
  }

  const onSubmit = async (data: VideoFormData) => {
    if (!editVideo) return
    setSubmitting(true)
    try {
      const fd = new window.FormData()
      fd.append('title', data.title)
      fd.append('description', data.description)
      fd.append('price', data.price.toString())
      fd.append('is_free', data.is_free.toString())
      fd.append('category_ids', data.category_ids.join(','))
      fd.append('tag_ids', data.tag_ids.join(','))
      if (file) fd.append('thumbnail', file)

      await videoApi.update(editVideo.video_id, fd, (pct) => setProgress(pct))
      toast.success('Video updated successfully')
      setIsEditOpen(false)
      load()
    } catch {
      toast.error('Failed to update video')
    } finally {
      setSubmitting(false)
      setProgress(0)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this video and all its episodes?')) return
    try {
      if (isAdmin) await adminVideoApi.forceDelete(id)
      else await videoApi.delete(id)
      toast.success('Video deleted')
      load()
      setIsDrawerOpen(false)
    } catch { }
  }

  const handleApprove = async (id: number) => {
    try {
      await adminVideoApi.approve(id)
      toast.success('Video approved')
      load()
      setIsDrawerOpen(false)
    } catch { }
  }

  const handleReject = async () => {
    if (!activeVideo) return
    try {
      await adminVideoApi.reject(activeVideo.video_id, rejectReason)
      toast.success('Video rejected')
      setIsRejectOpen(false)
      setRejectReason('')
      load()
    } catch { }
  }

  const handleThumbnailFile = (f: File) => {
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  // Mobile Options Drawer (Action Overlay)
  const openOptions = (v: VideoRess) => {
    setActiveVideo(v)
    setIsDrawerOpen(true)
  }

  const filters = [
    { id: '', label: 'All Series' },
    { id: 'published', label: 'Published' },
    { id: 'pending', label: 'Pending' },
    { id: 'rejected', label: 'Rejected' }
  ]

  return (
    <div className="min-h-screen bg-[#08090C] text-white flex flex-col pb-20 sm:pb-0 font-sans">
      {/* Sticky Navigation */}
      <header className="sticky top-0 z-30 bg-[#08090C]/80 backdrop-blur-xl border-b border-white/5 px-4 py-2.5 sm:px-8 sm:py-3.5 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Library</h1>
          <p className="text-[10px] sm:text-xs text-white/40 font-bold uppercase tracking-wider">
            {isAdmin ? 'Admin Overview' : 'My Drama Series'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsQueueOpen(true)}
            className="p-2.5 sm:px-4 sm:py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Clock size={18} />
            <span className="hidden sm:inline font-bold text-sm">Queue</span>
          </button>
          <button
            onClick={openCreate}
            className="bg-gradient-to-tr from-red-600 to-orange-500 text-white p-2.5 sm:px-5 sm:py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Initialize Series</span>
          </button>
        </div>
      </header>

      {/* Stats & Filters Row */}
      <div className="p-4 sm:p-8 space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:w-auto">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => { setStatusFilter(f.id); setPage(1) }}
                className={`px-5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${statusFilter === f.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="px-4 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input
                type="text"
                placeholder="Search series..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 w-64 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400">Loading your library...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder className="text-slate-300" size={40} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">No Series Found</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
              Start by creating your first drama series to reach your audience.
            </p>
            <button onClick={openCreate} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-transform">
              Create New Series
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {videos.map(v => (
              <VideoCard
                key={v.video_id}
                video={v}
                onEdit={() => openEdit(v)}
                onManage={() => navigate(`/dashboard/videos/${v.video_id}/episodes`)}
                onOptions={() => openOptions(v)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Options Overlay (Bottom Sheet) */}
      {isDrawerOpen && activeVideo && (
        <div className="fixed inset-0 z-[1200] p-4 pb-28 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] animate-fade-in" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] p-6 shadow-2xl animate-slide-up border border-slate-100">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>

            <div className="flex items-center gap-4 mb-8">
              <img src={activeVideo.thumbnail_url} className="w-16 h-16 rounded-2xl object-cover" alt="" />
              <div>
                <h3 className="font-extrabold text-slate-900">{activeVideo.title}</h3>
                <p className="text-xs text-slate-500 font-bold">ID: #{activeVideo.video_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => navigate(`/dashboard/videos/${activeVideo.video_id}/episodes`)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 text-indigo-700 font-bold transition-all active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Play size={20} fill="currentColor" />
                </div>
                Manage Episodes
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openEdit(activeVideo)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 text-slate-700 font-bold"
                >
                  <Edit2 size={20} />
                  <span className="text-xs">Edit Details</span>
                </button>
                <button
                  onClick={() => handleDelete(activeVideo.video_id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-50 text-rose-600 font-bold"
                >
                  <Trash2 size={20} />
                  <span className="text-xs">Delete</span>
                </button>
              </div>

              {isAdmin && activeVideo.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => handleApprove(activeVideo.video_id)}
                    className="p-4 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => { setIsRejectOpen(true); setIsDrawerOpen(false) }}
                    className="p-4 rounded-2xl border-2 border-rose-100 text-rose-600 font-bold flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Morphed) */}
      {isEditOpen && (
        <div className="fixed inset-0 z-80 pb-20 flex items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => !submitting && setIsEditOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Edit Series</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Update your drama details</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-all">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <form id="edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Thumbnail Side */}
                  <div className="space-y-4">
                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Display Artwork</label>
                    <div
                      onClick={() => thumbInputRef.current?.click()}
                      className={`relative aspect-[16/9] rounded-3xl overflow-hidden border-2 border-dashed transition-all cursor-pointer group ${preview ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
                        }`}
                    >
                      {preview ? (
                        <>
                          <img src={preview} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-bold text-sm bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md">Change Cover</p>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-500">
                            <ImageIcon size={32} />
                          </div>
                          <p className="text-xs font-bold text-slate-500">Tap to upload thumbnail</p>
                        </div>
                      )}
                      <input
                        ref={thumbInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleThumbnailFile(e.target.files[0])}
                      />
                    </div>
                    {progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-extrabold text-slate-500 uppercase">
                          <span>Uploading</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Side */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-500 uppercase ml-1">Series Title</label>
                      <input
                        {...register('title')}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter title..."
                      />
                      {errors.title && <p className="text-[10px] text-rose-500 font-bold px-1">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-500 uppercase ml-1">Description</label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="What's this series about?"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <label className="text-xs font-extrabold text-slate-500 uppercase">Pricing Model</label>
                    <div className="flex gap-2">
                      <Controller
                        name="is_free"
                        control={control}
                        render={({ field }) => (
                          <>
                            <button
                              type="button"
                              onClick={() => field.onChange(true)}
                              className={`flex-1 py-3 rounded-2xl font-bold transition-all ${field.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                            >
                              Free
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange(false)}
                              className={`flex-1 py-3 rounded-2xl font-bold transition-all ${!field.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                            >
                              Premium
                            </button>
                          </>
                        )}
                      />
                    </div>
                    <input
                      type="number"
                      {...register('price')}
                      className="w-full bg-white/50 border-none rounded-2xl p-3 font-bold text-slate-900"
                      placeholder="Price in USD"
                    />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <label className="text-xs font-extrabold text-slate-500 uppercase">Tags & Discovery</label>
                    <div className="flex flex-wrap gap-2">
                      {/* Simplified tag selection for UI demo */}
                      {categories.slice(0, 4).map(c => (
                        <button key={c.category_id} type="button" className="px-4 py-2 rounded-xl bg-white text-slate-600 text-xs font-bold shadow-sm">
                          {c.name}
                        </button>
                      ))}
                      <button type="button" className="px-4 py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold">
                        + Add More
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Actions (Sticky Bottom on Mobile) */}
            <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 sm:flex-none px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                form="edit-form"
                type="submit"
                disabled={submitting}
                className="flex-[2] sm:flex-none sm:px-12 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {submitting ? 'Saving Changes...' : 'Save Series'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VideoCard({ video, onEdit, onManage, onOptions, isAdmin }: { video: VideoRess, onEdit: () => void, onManage: () => void, onOptions: () => void, isAdmin: boolean }) {
  const statusKey = (video.status || 'pending').toLowerCase()
  const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  return (
    <div className="group relative bg-white/[0.03] backdrop-blur-md rounded-[2rem] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300">
      {/* Layout Morph: Mobile (Row) vs Desktop (Vertical) */}
      <div className="flex flex-row sm:flex-col p-3 sm:p-0 gap-4 sm:gap-0 h-full">
        {/* Thumbnail Area */}
        <div className="relative w-24 h-24 sm:w-full sm:aspect-video rounded-2xl sm:rounded-none overflow-hidden shrink-0">
          <img src={video.thumbnail_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={video.title} />

          {/* Status Badge - Floating on Desktop, Inline on Mobile (hidden below) */}
          <div className={`hidden sm:flex absolute top-3 left-3 items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md ${status.bg} ${status.color}`}>
            <StatusIcon size={12} />
            <span className="text-[10px] font-black uppercase tracking-wider">{status.label}</span>
          </div>

          {/* Desktop Hover Overlay */}
          <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-3">
            <button onClick={onManage} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg">
              <Play size={20} fill="currentColor" />
            </button>
            <button onClick={onEdit} className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg">
              <Edit2 size={20} />
            </button>
          </div>
        </div>

        {/* Info Area */}
        <div className="flex-1 flex flex-col justify-between sm:p-5">
          <div className="space-y-1">
            <div className="flex sm:hidden items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${status.bg} ${status.color}`}>
                {status.label}
              </span>
              <span className="text-[10px] text-white/20 font-bold">#{video.video_id}</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white/90 line-clamp-1 group-hover:text-red-500 transition-colors">
              {video.title}
            </h3>
            <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-white/40">
              <span className="flex items-center gap-1">
                <Layers size={12} />
                {video.episodes_count || 0} eps
              </span>
              <span className="w-1 h-1 bg-white/10 rounded-full"></span>
              <span className="text-emerald-400">${(video.price || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 sm:mt-4">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/60">
                  {(video.creator || 'U')[0]}
                </div>
                <span className="text-[10px] font-black text-white/40 uppercase truncate max-w-[80px]">{video.creator}</span>
              </div>
            ) : (
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                Series ID #{video.video_id}
              </div>
            )}

            {/* Action Trigger */}
            <button
              onClick={(e) => { e.stopPropagation(); onOptions() }}
              className="p-2 sm:hidden text-white/20 hover:text-white"
            >
              <MoreVertical size={20} />
            </button>
            <button
              onClick={onManage}
              className="hidden sm:flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest hover:gap-2 transition-all"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
