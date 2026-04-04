import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, Typography, Button, TextField, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Alert, Paper,
  Stack, Avatar, Grid
} from '@mui/material'
import { Add, Edit, Delete, ArrowBack, PlayArrow, FolderSpecial, Close, Visibility, UploadFile, VideoFile, CheckCircle } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Episode } from '@/app/types'
import toast from 'react-hot-toast'
import { episodeApi } from '@/app/api/episode.service'
import MultipartUploadPanel from '@/app/module/admin/videos/components/MultipartUploadPanel'
import HLSPlayer from '@/app/module/client/library/components/HLSPlayer'

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
  const [isFree, setIsFree] = useState(false)

  // Track which uploads completed for the current dialog session
  const [previewUploadKey, setPreviewUploadKey] = useState<string | null>(null)
  const [fullUploadKey, setFullUploadKey] = useState<string | null>(null)

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
      console.log("eps data", eps.data)
    } catch { }
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
    setPreviewUploadKey(null)
    setFullUploadKey(null)
    setIsFree(false)
    reset({ episode_number: episodes.length + 1, title: '', duration: 60, price: 0, is_free: false })
    setDialogOpen(true)
  }

  const openEdit = (ep: Episode) => {
    setEditEp(ep)
    setPreviewUploadKey(null)
    setFullUploadKey(null)
    setIsFree(false)
    reset({ episode_number: ep.episode_number, title: ep.title, duration: ep.duration })
    setDialogOpen(true)
  }

  /**
   * For the new multipart upload approach, the episode metadata (title, number, etc.)
   * is saved separately from the video files. Files are uploaded directly to MinIO
   * via presigned URLs, and the /multipart/confirm endpoint saves the key to the DB.
   *
   * So onSubmit now only handles the metadata fields.
   */
  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const fd = new window.FormData()
      fd.append('episode_number', String(data.episode_number))
      fd.append('title', data.title)
      fd.append('duration', String(data.duration))
      if (data.price !== undefined) fd.append('price', String(data.price))
      fd.append('is_free', String(isFree))
      // Note: No file data — files are uploaded via multipart upload panels

      if (editEp) {
        await episodeApi.update(editEp.episode_id, fd)
        toast.success('Episode updated')
        setDialogOpen(false)
      } else {
        // Create the episode, then switch to edit mode so upload panels appear
        const result = await episodeApi.create(Number(videoId), fd)
        toast.success('Episode created! You can now upload videos below.')
        // Fetch the newly created episode and switch dialog to edit mode
        const newEp = await episodeApi.getById(result.episode_id)
        setEditEp(newEp)
        // Keep dialog open — don't call setDialogOpen(false)
      }
      load()
    } catch {
      toast.error('Failed to save episode')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this episode permanently?')) return
    try {
      await episodeApi.delete(id)
      toast.success('Episode deleted')
      load()
    } catch { }
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
            <Typography variant="body2" fontWeight={600}>🚀 Multipart Upload Enabled:</Typography>
            Videos are now uploaded directly to storage in parallel chunks. Create an episode first, then use the <strong>upload panels</strong> to add preview and full videos.
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
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Created At</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {episodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
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
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {ep.created_at ? new Date(ep.created_at).toLocaleDateString() : 'N/A'}
                    </Typography>
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

      {/* ─── Add/Edit Episode Dialog ─────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 800, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editEp ? `Edit Episode ${editEp.episode_number}` : 'Add New Episode'}
          <IconButton size="small" onClick={() => !submitting && setDialogOpen(false)} disabled={submitting}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Left column: Metadata */}
              <Grid item xs={12} md={5}>
                <Stack spacing={3}>
                  <Typography variant="overline" fontWeight={800} color="text.secondary">
                    Episode Details
                  </Typography>

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
                </Stack>
              </Grid>

              {/* Right column: Upload Panels */}
              <Grid item xs={12} md={7}>
                <Stack spacing={2.5}>
                  <Typography variant="overline" fontWeight={800} color="text.secondary">
                    Video Uploads (Multipart)
                  </Typography>

                  {/* Preview Video Upload */}
                  <MultipartUploadPanel
                    videoId={videoId!}
                    episodeId={editEp?.episode_id}
                    fileType="preview"
                    compact
                    disabled={!editEp}
                    disabledHint="Click 'Create Episode' below to enable upload"
                    onUploadComplete={(key: string) => {
                      setPreviewUploadKey(key)
                      toast.success('Preview video uploaded!')
                      load()
                    }}
                    onUploadError={(err: any) => toast.error(`Preview upload failed: ${err}`)}
                  />

                  {/* Existing preview indicator */}
                  {editEp?.preview_video_url && !previewUploadKey && (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} color="success.main">Current preview video set</Typography>
                      </Box>
                    </Paper>
                  )}

                  {/* Full Video Upload */}
                  <MultipartUploadPanel
                    videoId={videoId!}
                    episodeId={editEp?.episode_id}
                    fileType="full"
                    compact
                    disabled={!editEp}
                    disabledHint="Click 'Create Episode' below to enable upload"
                    onUploadComplete={(key: string) => {
                      setFullUploadKey(key)
                      toast.success('Full video uploaded! HLS processing queued.')
                      load()
                    }}
                    onUploadError={(err: any) => toast.error(`Full video upload failed: ${err}`)}
                  />

                  {/* Existing full video indicator */}
                  {editEp?.full_video_url && !fullUploadKey && (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircle sx={{ color: 'primary.main', fontSize: 16 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} color="primary">Current full episode set</Typography>
                      </Box>
                    </Paper>
                  )}

                  {!editEp && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, fontStyle: 'italic' }}>
                      💡 Fill details and click <strong>Create Episode</strong> to start uploading videos.
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => !submitting && setDialogOpen(false)} disabled={submitting} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <UploadFile />}
              sx={{ px: 4, borderRadius: '10px', fontWeight: 800 }}
            >
              {submitting ? 'Saving...' : editEp ? 'Save Changes' : 'Create Episode'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ─── Video Player Dialog ──────────────────────────────────────── */}
      <Dialog
        open={videoPlayerOpen}
        onClose={() => { setVideoPlayerOpen(false); setCurrentVideoUrl('') }}
        maxWidth={currentVideoType === 'preview' ? 'xs' : 'md'}
        fullWidth
        PaperProps={{ sx: { bgcolor: 'black', borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle component="div" sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
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
          {(() => {
            if (!videoPlayerOpen || !currentVideoUrl) return (
              <Typography sx={{ color: 'white' }}>Video not available</Typography>
            );

            console.log('📽️ Playing Dashboard Video URL:', currentVideoUrl);
            return (
              <HLSPlayer
                key={currentVideoUrl}
                url={currentVideoUrl}
                autoPlay
              />
            );
          })()}
        </Box>
      </Dialog>
    </Box>
  )
}
