import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, Typography, Button, TextField, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Tooltip, Alert, LinearProgress, Paper,
  Stack, Divider, Avatar, Grid
} from '@mui/material'
import { Add, Edit, Delete, ArrowBack, PlayArrow, LockOpen, Lock, FolderSpecial, CloudUpload } from '@mui/icons-material'
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
    formData.append('photo', file)

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
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploadingField(null)
      setUploadProgress(0)
    }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress thickness={5} />
    </Box>
  )

  return (
    <Box>
      {/* SaaS Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 6 }}>
        <IconButton 
          onClick={() => navigate('/dashboard/videos')}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px' }}>
              {video?.title}
            </Typography>
            <Chip 
              label={video?.status} 
              size="small"
              color={video?.status === 'published' ? 'success' : 'warning'}
              sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'capitalize' }} 
            />
          </Box>
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

      {/* Stats Summary Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
         <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
               <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', borderRadius: '12px' }}><FolderSpecial /></Avatar>
               <Box>
                  <Typography variant="h6" fontWeight={800}>{episodes.length}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Episodes</Typography>
               </Box>
            </Paper>
         </Grid>
         <Grid item xs={12} md={8}>
            <Alert severity="info" sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'info.light', bgcolor: 'info.lighter' }}>
              <Typography variant="body2" fontWeight={600}>Expert Tip:</Typography>
              Set Episode 1 as a <strong>Free Preview</strong> to increase user engagement and series sales.
            </Alert>
         </Grid>
      </Grid>

      {/* Episode Navigation Table */}
      <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Episode Title</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Runtime</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Delivery</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Access</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Manage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {episodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Stack spacing={2} alignItems="center">
                       <PlayArrow sx={{ fontSize: 60, color: 'text.disabled', opacity: 0.3 }} />
                       <Typography variant="h6" fontWeight={700}>No episodes found</Typography>
                       <Button variant="outlined" sx={{ borderRadius: '10px' }} onClick={openCreate}>Create Episode 1</Button>
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
                       <Tooltip title="Preview Video Set">
                          <IconButton size="small" color={ep.preview_video_url ? 'success' : 'default'} disabled={!ep.preview_video_url}>
                             <CloudUpload sx={{ fontSize: 18 }} />
                          </IconButton>
                       </Tooltip>
                       <Tooltip title="Full Video Set">
                          <IconButton size="small" color={ep.full_video_url ? 'primary' : 'default'} disabled={!ep.full_video_url}>
                             <PlayArrow sx={{ fontSize: 18 }} />
                          </IconButton>
                       </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {ep.is_preview_free ? (
                      <Chip label="Free Preview" size="small" color="success" sx={{ fontWeight: 700, borderRadius: '8px' }} />
                    ) : (
                      <Chip label="Locked Content" size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: '8px' }} />
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

      {/* Episode Editor Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
          {editEp ? `Configure Episode ${editEp.episode_number}` : 'Add New Episode'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <TextField label="Episode #" type="number" {...register('episode_number')} error={!!errors.episode_number} sx={{ flex: 1 }} />
                <TextField label="Duration (sec)" type="number" {...register('duration')} error={!!errors.duration} sx={{ flex: 1 }} />
              </Stack>
              
              <TextField label="Episode Title" fullWidth {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
              
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'action.hover' }}>
                 <Typography variant="subtitle2" fontWeight={800} mb={2}>Content Source (Teaser)</Typography>
                 <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="contained" component="label" sx={{ borderRadius: '10px' }} disabled={!!uploadingField}>
                       {uploadingField === 'preview' ? 'Uploading...' : 'Upload Clip'}
                       <input type="file" hidden accept="video/*" onChange={e => handleVideoUpload(e, 'preview_video_url')} />
                    </Button>
                    <TextField fullWidth size="small" {...register('preview_video_url')} placeholder="Direct MP4 URL" />
                 </Stack>
                 {uploadingField === 'preview' && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2, borderRadius: 1 }} />}
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'action.hover' }}>
                 <Typography variant="subtitle2" fontWeight={800} mb={2}>Original Master File</Typography>
                 <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="contained" component="label" sx={{ borderRadius: '10px' }} disabled={!!uploadingField}>
                       {uploadingField === 'full' ? 'Uploading...' : 'Upload Full'}
                       <input type="file" hidden accept="video/*" onChange={e => handleVideoUpload(e, 'full_video_url')} />
                    </Button>
                    <TextField fullWidth size="small" {...register('full_video_url')} placeholder="Direct MP4 URL" />
                 </Stack>
                 {uploadingField === 'full' && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2, borderRadius: 1 }} />}
              </Paper>

              <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: isPreviewFree ? 'success.light' : 'divider' }}>
                <FormControlLabel
                  control={<Switch checked={isPreviewFree} onChange={e => setValue('is_preview_free', e.target.checked)} color="success" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={800}>Public Preview</Typography>
                      <Typography variant="caption" color="text.secondary">Make this episode visible to non-purchasers.</Typography>
                    </Box>
                  }
                />
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700 }}>Discard</Button>
            <Button type="submit" variant="contained" sx={{ px: 4, borderRadius: '10px', fontWeight: 800 }}>
              {editEp ? 'Update Content' : 'Save Episode'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
