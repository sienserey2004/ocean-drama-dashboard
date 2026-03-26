import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, Typography, Button, TextField, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Tooltip, Alert, LinearProgress,
} from '@mui/material'
import { Add, Edit, Delete, ArrowBack, PlayArrow, LockOpen, Lock } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Episode, Video } from '@/types'
import toast from 'react-hot-toast'
import axios from 'axios'
import { videoApi } from '@/api/video.service'
import { episodeApi } from '@/api/episode.service'

const schema = z.object({
  episode_number: z.coerce.number().min(1),
  title: z.string().min(1, 'Required'),
  preview_video_url: z.string().url('Valid URL required'),
  full_video_url: z.string().url('Valid URL required'),
  duration: z.coerce.number().min(1, 'Duration in seconds'),
  is_preview_free: z.boolean(),
})
type FormData = z.infer<typeof schema>

function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function EpisodesPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const [video, setVideo] = useState<Video | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEp, setEditEp] = useState<Episode | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_preview_free: false, duration: 600 },
  })
  const isPreviewFree = watch('is_preview_free')
  
  const [uploadingField, setUploadingField] = useState<'preview' | 'full' | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const load = useCallback(async () => {
    if (!videoId) return
    setLoading(true)
    try {
      const [vid, eps] = await Promise.all([
        videoApi.getById(Number(videoId)),
        episodeApi.list(Number(videoId), { limit: 100 }),
      ])
      setVideo(vid)
      setEpisodes(eps.data)
    } catch {}
    setLoading(false)
  }, [videoId])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditEp(null)
    reset({
      episode_number: episodes.length + 1,
      title: '',
      preview_video_url: '',
      full_video_url: '',
      duration: 600,
      is_preview_free: episodes.length === 0,
    })
    setDialogOpen(true)
  }

  const openEdit = (ep: Episode) => {
    setEditEp(ep)
    reset({
      episode_number: ep.episode_number,
      title: ep.title,
      preview_video_url: ep.preview_video_url,
      full_video_url: ep.full_video_url || '',
      duration: ep.duration,
      is_preview_free: ep.is_preview_free,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (editEp) {
        await episodeApi.update(editEp.episode_id, data)
        toast.success('Episode updated')
      } else {
        await episodeApi.create(Number(videoId), data)
        toast.success('Episode added')
      }
      setDialogOpen(false)
      load()
    } catch {}
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this episode permanently?')) return
    try {
      await episodeApi.delete(id)
      toast.success('Episode deleted')
      load()
    } catch {}
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'preview_video_url' | 'full_video_url') => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    
    setUploadingField(field === 'preview_video_url' ? 'preview' : 'full')
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('photo', file) // Using 'photo' as field name matching MyVideosPage

    try {
      const resp = await axios.post("http://localhost:3000/api/upload-photo", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.total) setUploadProgress(Math.round((ev.loaded * 100) / ev.total))
        }
      })
      
      const url = resp.data?.url || resp.data?.path || resp.data?.file || (typeof resp.data === 'string' ? resp.data : null)
      if (url) {
        setValue(field, url, { shouldValidate: true })
        toast.success("Upload successful")
      } else {
        toast.error("Upload failed: No URL returned")
      }
    } catch (err) {
      console.error(err)
      toast.error("Upload failed")
    } finally {
      setUploadingField(null)
      setUploadProgress(0)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard/videos')} sx={{ mt: 0.5 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">{video?.title}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <Chip label={`${episodes.length} episodes`} size="small" />
            <Chip label={video?.is_free ? 'Free series' : `$${(video?.price || 0).toFixed(2)}`} size="small" color={video?.is_free ? 'success' : 'primary'} />
            <Chip label={video?.status} size="small"
              color={video?.status === 'published' ? 'success' : video?.status === 'pending' ? 'warning' : 'error'}
              sx={{ textTransform: 'capitalize' }} />
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add episode</Button>
      </Box>

      {/* Info alert */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Episode 1 is recommended as a free preview (is_preview_free = true). All other episodes are locked until the viewer purchases the full series.
      </Alert>

      {/* Episode table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Preview</TableCell>
                <TableCell>Access</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {episodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <PlayArrow sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography color="text.secondary">No episodes yet</Typography>
                      <Button variant="outlined" size="small" startIcon={<Add />} onClick={openCreate}>Add first episode</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : episodes.map((ep) => (
                <TableRow key={ep.episode_id} hover>
                  <TableCell>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                      {ep.episode_number}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{ep.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{fmtDuration(ep.duration)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ep.preview_video_url ? 'Set' : 'Missing'}
                      size="small"
                      color={ep.preview_video_url ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    {ep.is_preview_free ? (
                      <Chip icon={<LockOpen sx={{ fontSize: '14px !important' }} />} label="Free preview" size="small" color="success" />
                    ) : (
                      <Chip icon={<Lock sx={{ fontSize: '14px !important' }} />} label="Locked" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit episode">
                      <IconButton size="small" onClick={() => openEdit(ep)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete episode">
                      <IconButton size="small" color="error" onClick={() => handleDelete(ep.episode_id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editEp ? `Edit Episode ${editEp.episode_number}` : 'Add new episode'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Episode number *"
                type="number"
                sx={{ width: 140 }}
                {...register('episode_number')}
                error={!!errors.episode_number}
                helperText={errors.episode_number?.message}
              />
              <TextField
                label="Duration (seconds) *"
                type="number"
                sx={{ flex: 1 }}
                {...register('duration')}
                error={!!errors.duration}
                helperText={errors.duration?.message}
              />
            </Box>
            <TextField
              label="Episode title *"
              fullWidth
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>Preview video (Teaser) *</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button variant="outlined" component="label" sx={{ minWidth: 150 }} disabled={!!uploadingField}>
                  {uploadingField === 'preview' ? 'Uploading...' : 'Choose Preview'}
                  <input type="file" hidden accept="video/*" onChange={e => handleVideoUpload(e, 'preview_video_url')} />
                </Button>
                <TextField fullWidth size="small" {...register('preview_video_url')} error={!!errors.preview_video_url} placeholder="Or paste URL here..." />
              </Box>
              {uploadingField === 'preview' && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 0.5 }} />}
              {errors.preview_video_url && <Typography color="error" variant="caption">{errors.preview_video_url.message}</Typography>}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>Full episode video *</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button variant="outlined" component="label" sx={{ minWidth: 150 }} disabled={!!uploadingField}>
                  {uploadingField === 'full' ? 'Uploading...' : 'Choose Full Video'}
                  <input type="file" hidden accept="video/*" onChange={e => handleVideoUpload(e, 'full_video_url')} />
                </Button>
                <TextField fullWidth size="small" {...register('full_video_url')} error={!!errors.full_video_url} placeholder="Or paste URL here..." />
              </Box>
              {uploadingField === 'full' && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 0.5 }} />}
              {errors.full_video_url && <Typography color="error" variant="caption">{errors.full_video_url.message}</Typography>}
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isPreviewFree}
                  onChange={e => setValue('is_preview_free', e.target.checked)}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={500}>Free preview episode</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Viewers can watch this episode without buying. Recommended for Episode 1.
                  </Typography>
                </Box>
              }
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editEp ? 'Save changes' : 'Add episode'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
