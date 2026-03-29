import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, Typography, Button, TextField, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Alert, LinearProgress, Paper,
  Stack, Avatar, Grid
} from '@mui/material'
import { Add, Edit, Delete, ArrowBack, PlayArrow, FolderSpecial, Close, Visibility, UploadFile, VideoFile, CheckCircle } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Episode } from '@/types'
import toast from 'react-hot-toast'
import { episodeApi } from '@/api/episode.service'

const schema = z.object({
  episode_number: z.coerce.number().min(1),
  title: z.string().min(1, 'Required'),
  duration: z.coerce.number().min(1, 'Duration in seconds'),
  price: z.coerce.number().min(0).optional(),
  is_free: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function fmtBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface VideoDropZoneProps {
  label: string
  accept?: string
  file: File | null
  onFile: (f: File) => void
  color?: string
}

function VideoDropZone({ label, file, onFile, color = '#6366f1' }: VideoDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) onFile(f)
  }

  return (
    <Box>
      <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', mb: 1, display: 'block' }}>
        {label}
      </Typography>
      <Box
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: `2px dashed`,
          borderColor: dragging ? color : file ? 'success.main' : 'divider',
          borderRadius: '16px',
          p: 2,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          bgcolor: dragging ? `${color}10` : file ? 'success.lighter' : 'action.hover',
          '&:hover': { borderColor: color, bgcolor: `${color}10` },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />

        {previewUrl ? (
          <Stack spacing={1.5}>
            {/* Compact video preview */}
            <Box sx={{ borderRadius: '10px', overflow: 'hidden', bgcolor: 'black', width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                src={previewUrl}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                controls
                onClick={e => e.stopPropagation()}
              />
            </Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{file?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{file ? fmtBytes(file.size) : ''}</Typography>
              </Box>
              <Chip label="Change" size="small" sx={{ fontWeight: 700 }} />
            </Stack>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1} py={3}>
            <VideoFile sx={{ fontSize: 40, color, opacity: 0.6 }} />
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              Drag & drop or click to select
            </Typography>
            <Typography variant="caption" color="text.disabled">MP4, MOV, MKV supported</Typography>
          </Stack>
        )}
      </Box>
    </Box>
  )
}

export default function EpisodesPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
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
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // File states for new episode
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [fullFile, setFullFile] = useState<File | null>(null)
  const [isFree, setIsFree] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_free: false, duration: 60, price: 0 },
  })

  const load = useCallback(async () => {
    if (!videoId) return
    setLoading(true)
    try {
      const eps = await episodeApi.list(Number(videoId), { limit: 100 }) as unknown as {
        video_title: string; total: number; data: Episode[]
      }
      setVideoTitle(eps.video_title || 'Video Navigation')
      setTotalEpisodes(eps.total || eps.data.length || 0)
      setEpisodes(eps.data || [])
    } catch {}
    setLoading(false)
  }, [videoId])

  useEffect(() => { load() }, [load])

  const handlePlayVideo = (url: string, title: string, type: 'preview' | 'full') => {
    setCurrentVideoUrl(url)
    setCurrentVideoTitle(title)
    setCurrentVideoType(type)
    setVideoPlayerOpen(true)
  }

  const openCreate = () => {
    setEditEp(null)
    setPreviewFile(null)
    setFullFile(null)
    setIsFree(false)
    setUploadProgress(0)
    reset({ episode_number: episodes.length + 1, title: '', duration: 60, price: 0, is_free: false })
    setDialogOpen(true)
  }

  const openEdit = (ep: Episode) => {
    setEditEp(ep)
    setPreviewFile(null)
    setFullFile(null)
    setIsFree(false)
    setUploadProgress(0)
    reset({ episode_number: ep.episode_number, title: ep.title, duration: ep.duration })
    setDialogOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!editEp && !previewFile) {
      toast.error('Please select a preview video file')
      return
    }
    setSubmitting(true)
    try {
      const fd = new window.FormData()
      fd.append('episode_number', String(data.episode_number))
      fd.append('title', data.title)
      fd.append('duration', String(data.duration))
      if (data.price !== undefined) fd.append('price', String(data.price))
      fd.append('is_free', String(isFree))
      if (previewFile) fd.append('preview_video', previewFile)
      if (fullFile) fd.append('full_video', fullFile)

      if (editEp) {
        await episodeApi.update(editEp.episode_id, fd, (pct) => setUploadProgress(pct))
        toast.success('Episode updated')
      } else {
        await episodeApi.create(Number(videoId), fd, (pct) => setUploadProgress(pct))
        toast.success('Episode created!')
      }
      setDialogOpen(false)
      load()
    } catch {
      toast.error('Failed to save episode')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this episode permanently?')) return
    try {
      await episodeApi.delete(id)
      toast.success('Episode deleted')
      load()
    } catch {}
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress thickness={5} />
    </Box>
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 6 }}>
        <IconButton
          onClick={() => navigate('/dashboard/videos')}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 0.5 }}>
            {videoTitle}
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Manage episodes and content delivery for this series.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreate}
          sx={{ borderRadius: '12px', px: 3, py: 1.2, fontWeight: 700 }}
        >
          Add Episode
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', borderRadius: '12px' }}><FolderSpecial /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800}>{totalEpisodes}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Episodes</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Alert severity="info" sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'info.light', bgcolor: 'info.lighter' }}>
            <Typography variant="body2" fontWeight={600}>Expert Tip:</Typography>
            Upload both a <strong>Preview Clip</strong> (teaser) and the <strong>Full Episode</strong> for the best viewer experience.
          </Alert>
        </Grid>
      </Grid>

      {/* Table */}
      <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Runtime</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Videos</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Access</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {episodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Stack spacing={2} alignItems="center">
                      <PlayArrow sx={{ fontSize: 60, color: 'text.disabled', opacity: 0.3 }} />
                      <Typography variant="h6" fontWeight={700}>No episodes yet</Typography>
                      <Button variant="outlined" sx={{ borderRadius: '10px' }} onClick={openCreate}>Add First Episode</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : episodes.map((ep) => (
                <TableRow key={ep.episode_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {ep.episode_number.toString().padStart(2, '0')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{ep.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>{fmtDuration(ep.duration)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        onClick={ep.preview_video_url ? () => handlePlayVideo(ep.preview_video_url, `Preview · ${ep.title}`, 'preview') : undefined}
                        label="Preview"
                        size="small"
                        icon={<Visibility sx={{ fontSize: '14px !important' }} />}
                        color={ep.preview_video_url ? 'success' : 'default'}
                        variant={ep.preview_video_url ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, cursor: ep.preview_video_url ? 'pointer' : 'default' }}
                      />
                      <Chip
                        onClick={ep.full_video_url ? () => handlePlayVideo(ep.full_video_url!, `Full · ${ep.title}`, 'full') : undefined}
                        label="Full"
                        size="small"
                        icon={<PlayArrow sx={{ fontSize: '14px !important' }} />}
                        color={ep.full_video_url ? 'primary' : 'default'}
                        variant={ep.full_video_url ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, cursor: ep.full_video_url ? 'pointer' : 'default' }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {ep.has_access ? (
                      <Chip label="Has Access" size="small" color="success" sx={{ fontWeight: 700, borderRadius: '8px' }} />
                    ) : (
                      <Chip label="Locked" size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: '8px' }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => openEdit(ep)} sx={{ bgcolor: 'action.hover' }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(ep.episode_id)} sx={{ bgcolor: 'error.lighter' }}><Delete fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Episode Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editEp ? `Edit Episode ${editEp.episode_number}` : 'Add New Episode'}
          <IconButton size="small" onClick={() => !submitting && setDialogOpen(false)} disabled={submitting}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3}>
              {/* Basic Info */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Episode #"
                  type="number"
                  {...register('episode_number')}
                  error={!!errors.episode_number}
                  helperText={errors.episode_number?.message}
                  sx={{ flex: 1 }}
                  InputProps={{ inputProps: { min: 1 } }}
                />
                <TextField
                  label="Duration (sec)"
                  type="number"
                  {...register('duration')}
                  error={!!errors.duration}
                  helperText={errors.duration?.message}
                  sx={{ flex: 1 }}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Stack>

              <TextField
                label="Episode Title"
                fullWidth
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Price"
                  type="number"
                  {...register('price')}
                  sx={{ flex: 1 }}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  disabled={isFree}
                />
                <Paper sx={{ flex: 1, p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: isFree ? 'success.light' : 'divider', display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={<Switch checked={isFree} onChange={e => setIsFree(e.target.checked)} color="success" size="small" />}
                    label={<Typography variant="body2" fontWeight={700}>Free Episode</Typography>}
                    sx={{ m: 0 }}
                  />
                </Paper>
              </Stack>

              {/* File upload areas */}
              <VideoDropZone
                label={editEp && !previewFile ? (editEp.preview_video_url ? '🟢 Preview Clip — (leave empty to keep current)' : 'Preview Clip (Teaser) *') : 'Preview Clip (Teaser) *'}
                file={previewFile}
                onFile={setPreviewFile}
                color="#10b981"
              />
              {/* Show existing preview URL as reference when editing */}
              {editEp && !previewFile && editEp.preview_video_url && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5, mt: -1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700} color="success.main">Current preview video set</Typography>
                    <Typography variant="caption" display="block" color="text.secondary" noWrap>{editEp.preview_video_url.split('?')[0].split('/').pop()}</Typography>
                  </Box>
                </Paper>
              )}

              <VideoDropZone
                label={editEp && !fullFile ? (editEp.full_video_url ? '🟣 Full Episode — (leave empty to keep current)' : 'Full Episode Video') : 'Full Episode Video'}
                file={fullFile}
                onFile={setFullFile}
                color="#6366f1"
              />
              {editEp && !fullFile && editEp.full_video_url && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5, mt: -1 }}>
                  <CheckCircle sx={{ color: 'primary.main', fontSize: 16 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700} color="primary">Current full episode set</Typography>
                    <Typography variant="caption" display="block" color="text.secondary" noWrap>{editEp.full_video_url.split('?')[0].split('/').pop()}</Typography>
                  </Box>
                </Paper>
              )}

              {/* Upload Progress */}
              {submitting && uploadProgress > 0 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight={700}>Uploading...</Typography>
                    <Typography variant="caption" fontWeight={700}>{uploadProgress}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 6 }} />
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => !submitting && setDialogOpen(false)} disabled={submitting} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || (!editEp && !previewFile)}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <UploadFile />}
              sx={{ px: 4, borderRadius: '10px', fontWeight: 800 }}
            >
              {submitting ? 'Uploading...' : editEp ? 'Save Changes' : 'Upload & Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog
        open={videoPlayerOpen}
        onClose={() => { setVideoPlayerOpen(false); setCurrentVideoUrl('') }}
        maxWidth={currentVideoType === 'preview' ? 'xs' : 'md'}
        fullWidth
        PaperProps={{ sx: { bgcolor: 'black', borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>{currentVideoTitle}</Typography>
          <IconButton size="small" onClick={() => { setVideoPlayerOpen(false); setCurrentVideoUrl('') }} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Box sx={{
          width: '100%',
          aspectRatio: currentVideoType === 'preview' ? '9/16' : '16/9',
          bgcolor: 'black',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          maxHeight: '80vh',
        }}>
          {currentVideoUrl ? (
            <video src={currentVideoUrl} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
          ) : (
            <Typography sx={{ color: 'white' }}>Video not available</Typography>
          )}
        </Box>
      </Dialog>
    </Box>
  )
}
