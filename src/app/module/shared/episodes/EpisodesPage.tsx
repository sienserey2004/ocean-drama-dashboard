import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus, Edit2, Trash2, ArrowLeft, Play, Folder,
  X, Eye, Upload, FileVideo, CheckCircle,
  UploadCloud, Crown, Clock, Lock, Unlock, Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Episode } from '@/app/types'
import toast from '@/app/utils/toast'
import { episodeApi } from '@/app/api/episode.service'
import HLSPlayer from '@/app/module/client/library/components/HLSPlayer'
import { useProcessingStatus } from '@/app/utils/useProcessingStatus'
import { useAuthStore } from '@/app/stores/authStore'
import { useSubscriptionStore } from '@/app/stores/subscriptionStore'
import {
  AdminLTE, ContentHeader, AdminCard, SmallBox, LteBadge, ProgressBar, LteDialog,
  type LteColor,
} from '@/app/module/shared/adminlte'
import { RouteLoader } from '@/_ocean/ui'

const schema = z.object({
  episode_number: z.coerce.number().min(1),
  title: z.string().min(1, 'Required'),
  duration: z.coerce.number().min(1, 'Duration in seconds'),
})
type FormData = z.infer<typeof schema>

const STATUS_COLOR: Record<string, LteColor> = {
  READY:       'success',
  TRANSCODING: 'info',
  UPLOADING:   'info',
  PENDING:     'warning',
  FAILED:      'danger',
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

type VideoThumbnailProps = {
  file: File | null
  thumbnailUrl?: string
  videoUrl?: string
  label: string
}

/**
 * Uses the first useful frame of a newly selected video as its local cover.
 * Once the upload is processed, the API-provided episode thumbnail takes over.
 */
function VideoThumbnail({ file, thumbnailUrl, videoUrl, label }: VideoThumbnailProps) {
  const [localSource, setLocalSource] = useState('')
  const [generatedThumbnail, setGeneratedThumbnail] = useState('')
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    if (!file) {
      setLocalSource('')
      return
    }

    const source = URL.createObjectURL(file)
    setLocalSource(source)
    return () => URL.revokeObjectURL(source)
  }, [file])

  useEffect(() => {
    setGeneratedThumbnail('')
    setVideoFailed(false)
    if (!localSource) return

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = localSource

    const capture = () => {
      if (!video.videoWidth || !video.videoHeight) return
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (!context) return
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      setGeneratedThumbnail(canvas.toDataURL('image/jpeg', 0.82))
    }

    const handleMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(1, video.duration / 2)
      } else {
        capture()
      }
    }

    video.addEventListener('loadedmetadata', handleMetadata)
    video.addEventListener('seeked', capture, { once: true })
    video.addEventListener('error', () => setVideoFailed(true), { once: true })
    video.load()

    return () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [localSource])

  const source = localSource || videoUrl
  const image = generatedThumbnail || (!file ? thumbnailUrl : '')

  return (
    <div className="episode-media-thumbnail" aria-label={label}>
      {image && !videoFailed ? (
        <img src={image} alt="" onError={() => setVideoFailed(true)} />
      ) : source && !videoFailed ? (
        <video src={source} muted playsInline preload="metadata" />
      ) : (
        <FileVideo size={28} />
      )}
      <span className="episode-media-thumbnail-label">{label}</span>
      {file && <span className="episode-media-thumbnail-badge">New thumbnail</span>}
    </div>
  )
}

export default function EpisodesPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()

  // Reachable from both My Videos and Browse, so go back the way we came in.
  // `history.state.idx` is 0 when this page was opened directly by URL.
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/dashboard/videos')
  }

  const { role } = useAuthStore()
  const { subscription } = useSubscriptionStore()
  const isAdmin = role === 'admin'
  const isPremium = subscription?.status === 'active'
  const canUploadFull = isAdmin || isPremium
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [totalEpisodes, setTotalEpisodes] = useState(0)
  const [videoTitle, setVideoTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEp, setEditEp] = useState<Episode | null>(null)
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [currentVideoTitle, setCurrentVideoTitle] = useState('')
  const [currentVideoType, setCurrentVideoType] = useState<'preview' | 'full'>('full')
  const [currentEpisodeId, setCurrentEpisodeId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isFullFree, setIsFullFree] = useState(false)

  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [fullFile, setFullFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const uploadToastId = useRef<string | null>(null)
  const processingEpisodeId = useRef<number | null>(null)

  const processingStatus = useProcessingStatus()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 60 },
  })

  const load = useCallback(async (withLoader = true) => {
    if (!videoId) return
    if (withLoader) setLoading(true)
    try {
      const eps = await episodeApi.list(Number(videoId), { limit: 100 }) as unknown as {
        video_title: string; total: number; data: Episode[]
      }
      setVideoTitle(eps.video_title || 'Video Navigation')
      setTotalEpisodes(eps.total || eps.data.length || 0)
      setEpisodes(eps.data || [])
    } catch { }
    if (withLoader) setLoading(false)
  }, [videoId])

  useEffect(() => { load() }, [load])

  // Keep one toast alive from the browser upload through background HLS work.
  // Socket events update this immediately; the processing hook falls back to polling.
  useEffect(() => {
    const id = uploadToastId.current
    if (!id || processingStatus.status === 'idle') return

    if (processingStatus.status === 'READY' || processingStatus.isReady) {
      toast.success('Video processing complete — thumbnail is ready', { id })
      uploadToastId.current = null
      void load(false)
      return
    }

    if (processingStatus.status === 'FAILED') {
      toast.error(processingStatus.error || 'Video processing failed', { id })
      uploadToastId.current = null
      return
    }

    toast.loading(
      `Processing video · ${processingStatus.status.toLowerCase()} · ${processingStatus.progress}%`,
      { id },
    )
  }, [load, processingStatus.error, processingStatus.isReady, processingStatus.progress, processingStatus.status])

  useEffect(() => {
    const episodeId = processingEpisodeId.current
    const status = processingStatus.status
    if (!episodeId || status === 'idle') return

    setEpisodes(current => current.map(episode => (
      episode.episode_id === episodeId
        ? {
            ...episode,
            status: processingStatus.isReady ? 'READY' : status,
            progress: processingStatus.progress,
          }
        : episode
    )))
  }, [processingStatus.isReady, processingStatus.progress, processingStatus.status])

  const handlePlayVideo = (epId: number, url: string, title: string, type: 'preview' | 'full') => {
    setCurrentEpisodeId(epId)
    setCurrentVideoUrl(url)
    setCurrentVideoTitle(title)
    setCurrentVideoType(type)
    setVideoPlayerOpen(true)
  }

  const closePlayer = () => {
    setVideoPlayerOpen(false)
    setCurrentVideoUrl('')
  }

  const openCreate = () => {
    setEditEp(null)
    processingEpisodeId.current = null
    setPreviewFile(null)
    setFullFile(null)
    setUploadProgress(0)
    processingStatus.reset()
    setIsFullFree(false)
    reset({ episode_number: episodes.length + 1, title: '', duration: 60 })
    setDialogOpen(true)
  }

  const openEdit = (ep: Episode) => {
    setEditEp(ep)
    processingEpisodeId.current = null
    setPreviewFile(null)
    setFullFile(null)
    setUploadProgress(0)
    processingStatus.reset()
    // Seed the toggle from the episode being edited — resetting it to false here
    // silently demoted every free episode to paid on save.
    setIsFullFree(ep.is_full_free === true)
    reset({ episode_number: ep.episode_number, title: ep.title, duration: ep.duration })
    setDialogOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setUploadProgress(0)
    const uploaded = Boolean(previewFile || fullFile)
    const toastId = uploaded ? `episode-upload-${videoId || 'new'}-${editEp?.episode_id || 'new'}-${Date.now()}` : null
    const uploadLabel = previewFile && fullFile
      ? 'preview and full videos'
      : previewFile
        ? 'preview video'
        : 'full video'

    if (toastId) {
      uploadToastId.current = toastId
      toast.loading(`Uploading ${uploadLabel} · 0%`, { id: toastId })
    }

    const handleUploadProgress = (pct: number) => {
      setUploadProgress(pct)
      if (toastId) toast.loading(`Uploading ${uploadLabel} · ${pct}%`, { id: toastId })
    }

    try {
      const fd = new window.FormData()
      fd.append('episode_number', String(data.episode_number))
      fd.append('title', data.title)
      fd.append('duration', String(data.duration))
      // The API reads `is_full_free`; episodes carry no price of their own.
      fd.append('is_full_free', String(isFullFree))

      if (previewFile) fd.append('preview_video', previewFile)
      if (fullFile) fd.append('full_video', fullFile)

      let result
      if (editEp) {
        result = await episodeApi.update(editEp.episode_id, fd, handleUploadProgress)
      } else {
        result = await episodeApi.create(Number(videoId), fd, handleUploadProgress)
      }

      // Only a new upload kicks off transcoding — a metadata-only edit is done,
      // so close out instead of polling a job that will never start.
      if (uploaded && result?.episode_id) {
        processingEpisodeId.current = result.episode_id
        if (toastId) toast.loading('Upload complete · waiting for video processing · 0%', { id: toastId })
        processingStatus.startPolling(result.episode_id)
      } else {
        toast.success(editEp ? 'Episode updated' : 'Episode created successfully', toastId ? { id: toastId } : undefined)
        uploadToastId.current = null
        setDialogOpen(false)
      }

      await load(false)
    } catch (err: any) {
      console.error(err)
      const message = err?.response?.data?.message || 'Failed to save episode'
      if (toastId) {
        toast.error(message, { id: toastId })
        uploadToastId.current = null
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseDialog = () => {
    if (submitting) return
    setDialogOpen(false)
    processingEpisodeId.current = null
    processingStatus.stop()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this episode permanently?')) return
    try {
      await episodeApi.delete(id)
      toast.success('Episode deleted')
      load()
    } catch { }
  }

  if (loading) return <RouteLoader />

  const freeCount  = episodes.filter(ep => ep.is_full_free).length
  const readyCount = episodes.filter(ep => ep.status === 'READY').length
  const runtime    = episodes.reduce((sum, ep) => sum + (ep.duration || 0), 0)

  return (
    <AdminLTE className="-m-2 min-h-full rounded-[24px] p-3 md:-m-4 md:rounded-[18px] md:p-5">
      <ContentHeader
        title={videoTitle}
        description="Manage episodes and content delivery for this series."
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Videos', to: '/dashboard/videos' },
          { label: 'Episodes' },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-default" onClick={goBack}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Episode
            </button>
          </>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
        <SmallBox color="info" value={totalEpisodes} label="Total episodes" icon={<Folder size={48} />} />
        <SmallBox color="success" value={readyCount} label="Ready to stream" icon={<CheckCircle size={48} />} />
        <SmallBox color="warning" value={freeCount} label="Free episodes" icon={<Unlock size={48} />} />
        <SmallBox color="purple" value={fmtDuration(runtime)} label="Total runtime" icon={<Clock size={48} />} />
      </div>

      <AdminCard
        title="Episodes"
        icon={<Play size={16} />}
        bodyClassName="p-0"
        tools={
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> Add Episode
          </button>
        }
        footer={
          <span className="lte-text-muted text-sm">
            Asynchronous processing is enabled — uploads are transcoded to HLS in the background.
          </span>
        }
      >
        {episodes.length === 0 ? (
          <div className="empty-state">
            <Play size={56} className="mx-auto opacity-40" />
            <h2>No episodes yet</h2>
            <p>Add the first episode to start building this series.</p>
            <button type="button" className="btn btn-primary mt-3" onClick={openCreate}>
              <Plus size={14} /> Add First Episode
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Title</th>
                  <th style={{ width: 100 }}>Runtime</th>
                  <th style={{ width: 170 }}>Status</th>
                  <th style={{ width: 160 }}>Videos</th>
                  <th style={{ width: 110 }}>Access</th>
                  <th style={{ width: 110 }}>Created</th>
                  <th style={{ width: 110, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map(ep => (
                  <tr key={ep.episode_id}>
                    <td className="lte-text-primary lte-text-bold">
                      {ep.episode_number.toString().padStart(2, '0')}
                    </td>
                    <td className="lte-text-bold">{ep.title}</td>
                    <td>{fmtDuration(ep.duration)}</td>
                    <td>
                      {ep.status ? (
                        <>
                          <LteBadge color={STATUS_COLOR[ep.status] ?? 'secondary'}>{ep.status}</LteBadge>
                          {ep.status !== 'READY' && ep.status !== 'FAILED' && (
                            <ProgressBar
                              value={ep.progress || 0}
                              size="xs"
                              color={STATUS_COLOR[ep.status] ?? 'primary'}
                            />
                          )}
                        </>
                      ) : (
                        <span className="lte-text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          disabled={!ep.preview_video_url}
                          onClick={() => handlePlayVideo(ep.episode_id, ep.preview_video_url, `Preview - ${ep.title}`, 'preview')}
                        >
                          <Eye size={13} /> Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={!ep.full_video_url}
                          onClick={() => handlePlayVideo(ep.episode_id, ep.full_video_url!, `Full - ${ep.title}`, 'full')}
                        >
                          <Play size={13} /> Full
                        </button>
                      </div>
                    </td>
                    <td>
                      {ep.has_access ? (
                        <LteBadge color="success"><Unlock size={11} /> Open</LteBadge>
                      ) : (
                        <LteBadge color="secondary"><Lock size={11} /> Locked</LteBadge>
                      )}
                    </td>
                    <td>{ep.created_at ? new Date(ep.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-default"
                          onClick={() => openEdit(ep)}
                          aria-label={`Edit episode ${ep.episode_number}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(ep.episode_id)}
                          aria-label={`Delete episode ${ep.episode_number}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>


      {/* Add / Edit Episode dialog. LteDialog renders inline at z-index 1400,
          above the shell's header (1100) and sidebar (1200). */}
      <LteDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        size="lg"
        icon={editEp ? <Edit2 size={18} /> : <Plus size={18} />}
        title={editEp ? `Edit Episode ${editEp.episode_number}` : 'Add New Episode'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ep-number">Episode #</label>
              <input
                id="ep-number"
                type="number"
                min={1}
                className={`form-control ${errors.episode_number ? 'is-invalid' : ''}`}
                {...register('episode_number')}
              />
              {errors.episode_number && <span className="invalid-feedback">{errors.episode_number.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="ep-duration">Runtime (sec)</label>
              <input
                id="ep-duration"
                type="number"
                min={1}
                className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
                {...register('duration')}
              />
              {errors.duration && <span className="invalid-feedback">{errors.duration.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ep-title">Episode Title</label>
            <input
              id="ep-title"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              {...register('title')}
            />
            {errors.title && <span className="invalid-feedback">{errors.title.message}</span>}
          </div>

          <div className="form-group checkbox-list">
            <label>
              <input type="checkbox" checked={isFullFree} onChange={e => setIsFullFree(e.target.checked)} />
              Free episode - viewers can watch the full video without paying
            </label>
          </div>

          <div className="selection-row">
            <p className="lte-text-bold mb-2">Video Content</p>

            {(submitting || uploadProgress > 0) && (
              <div className="upload-progress">
                <div>
                  <span>Uploading to server...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar value={uploadProgress} color="primary" />
              </div>
            )}

            {processingStatus.status !== 'idle' && processingStatus.status !== 'READY' && (
              <div className="upload-progress">
                <div>
                  <span className={processingStatus.status === 'FAILED' ? 'lte-text-danger' : 'lte-text-success'}>
                    {processingStatus.status === 'FAILED' ? 'Processing failed' : `${processingStatus.status}...`}
                  </span>
                  <span>{processingStatus.progress}%</span>
                </div>
                <ProgressBar
                  value={processingStatus.progress}
                  color={processingStatus.status === 'FAILED' ? 'danger' : 'success'}
                />
                {processingStatus.error && (
                  <p className="lte-text-danger mt-1 text-xs">Error: {processingStatus.error}</p>
                )}
                {processingStatus.status === 'TRANSCODING' && (
                  <p className="lte-text-muted mt-1 text-xs">
                    Generating HLS variants (360p, 480p, 720p, 1080p)...
                  </p>
                )}
              </div>
            )}

            {processingStatus.isReady && (
              <p className="lte-text-success lte-text-bold flex items-center gap-2">
                <CheckCircle size={16} /> Episode is ready for playback.
              </p>
            )}

            {!submitting && !processingStatus.isPolling && (
              <div className="episode-media-grid">
                <div className="episode-media-field">
                  <div className="episode-media-heading">
                    <label htmlFor="ep-preview">Preview Video</label>
                    <LteBadge color="info"><Eye size={11} /> Thumbnail source</LteBadge>
                  </div>
                  <VideoThumbnail
                    file={previewFile}
                    thumbnailUrl={editEp?.thumbnail_url}
                    videoUrl={editEp?.preview_video_url}
                    label={previewFile ? 'Preview frame' : 'Current preview thumbnail'}
                  />
                  <label htmlFor="ep-preview" className="btn btn-default w-full justify-start">
                    <FileVideo size={16} />
                    {previewFile ? previewFile.name : (editEp?.preview_video_url ? 'Change preview video' : 'Select preview video')}
                  </label>
                  <input
                    id="ep-preview"
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={e => setPreviewFile(e.target.files?.[0] || null)}
                  />
                  <small className="episode-media-help">The processed preview frame is also used as this episode’s thumbnail.</small>
                </div>

                <div className="episode-media-field">
                  <div className="episode-media-heading">
                    <label htmlFor="ep-full">Full Video</label>
                    {canUploadFull && <LteBadge color="success"><UploadCloud size={11} /> Premium upload</LteBadge>}
                  </div>
                  <VideoThumbnail
                    file={fullFile}
                    thumbnailUrl={previewFile ? '' : editEp?.thumbnail_url}
                    videoUrl={editEp?.full_video_url}
                    label={fullFile ? 'Full video frame' : 'Current full video'}
                  />
                  {!canUploadFull ? (
                    <div className="callout">
                      <p className="lte-text-bold flex items-center gap-2">
                        <Crown size={16} className="lte-text-warning" /> Full video upload is restricted
                      </p>
                      <p className="lte-text-muted text-sm">Become a member to upload full videos.</p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm mt-3"
                        onClick={() => navigate('/subscription-plan')}
                      >
                        Upgrade to start business
                      </button>
                    </div>
                  ) : (
                    <>
                      <label htmlFor="ep-full" className="btn btn-default w-full justify-start">
                        <UploadCloud size={16} />
                        {fullFile ? fullFile.name : (editEp?.full_video_url ? 'Change full video' : 'Select full video')}
                      </label>
                      <input
                        id="ep-full"
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={e => setFullFile(e.target.files?.[0] || null)}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {editEp && !previewFile && !fullFile && !submitting && !processingStatus.isPolling && (
              <p className="lte-text-muted text-sm">Leave the file pickers empty to keep the existing videos.</p>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-default" onClick={handleCloseDialog} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : <><Upload size={16} /> {editEp ? 'Save Changes' : 'Create Episode'}</>}
            </button>
          </div>
        </form>
      </LteDialog>

      {/* Video player. Same backdrop contract as LteDialog, but the body is a
          black stage rather than a padded form. */}
      {videoPlayerOpen && (
        <div
          className="lte-modal-backdrop"
          role="presentation"
          onMouseDown={e => e.target === e.currentTarget && closePlayer()}
        >
          <section
            className="lte-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={currentVideoTitle}
            style={{ maxWidth: currentVideoType === 'preview' ? 380 : 920 }}
          >
            <div className="lte-modal-header">
              <h3>{currentVideoTitle}</h3>
              <button type="button" className="btn-tool" onClick={closePlayer} aria-label="Close player">
                <X size={20} />
              </button>
            </div>
            <div
              className="flex w-full items-center justify-center bg-black"
              style={{ aspectRatio: currentVideoType === 'preview' ? '9/16' : '16/9', maxHeight: '78vh' }}
            >
              {!currentVideoUrl ? (
                <p className="text-white">Video not available</p>
              ) : (
                <HLSPlayer
                  key={currentVideoUrl + currentEpisodeId}
                  url={currentVideoUrl}
                  episodeId={currentEpisodeId || undefined}
                  type={currentVideoType}
                  autoPlay
                />
              )}
            </div>
          </section>
        </div>
      )}
    </AdminLTE>
  )
}
