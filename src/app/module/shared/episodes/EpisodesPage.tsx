import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Card, Typography, Button, TextField, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Alert, Paper,
  Stack, Avatar, Grid,
  LinearProgress
} from '@mui/material'
import { Add, Edit, Delete, ArrowBack, PlayArrow, FolderSpecial, Close, Visibility, UploadFile, VideoFile, CheckCircle, CloudUpload } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Episode } from '@/app/types'
import toast from 'react-hot-toast'
import { episodeApi } from '@/app/api/episode.service'
import MultipartUploadPanel from '@/app/module/admin/videos/components/MultipartUploadPanel'
import HLSPlayer from '@/app/module/client/library/components/HLSPlayer'
import { useProcessingStatus } from '@/app/utils/useProcessingStatus'

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
  const [currentEpisodeId, setCurrentEpisodeId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isFree, setIsFree] = useState(false)

  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [fullFile, setFullFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const processingStatus = useProcessingStatus();

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

  const handlePlayVideo = (epId: number, url: string, title: string, type: 'preview' | 'full') => {
    setCurrentEpisodeId(epId)
    setCurrentVideoUrl(url)
    setCurrentVideoTitle(title)
    setCurrentVideoType(type)
    setVideoPlayerOpen(true)
  }

  const openCreate = () => {
    setEditEp(null)
    setPreviewFile(null)
    setFullFile(null)
    setUploadProgress(0)
    processingStatus.reset()
    setIsFree(false)
    reset({ episode_number: episodes.length + 1, title: '', duration: 60, price: 0, is_free: false })
    setDialogOpen(true)
  }

  const openEdit = (ep: Episode) => {
    setEditEp(ep)
    setPreviewFile(null)
    setFullFile(null)
    setUploadProgress(0)
    processingStatus.reset()
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
    setUploadProgress(0)
    try {
      const fd = new window.FormData()
      fd.append('episode_number', String(data.episode_number))
      fd.append('title', data.title)
      fd.append('duration', String(data.duration))
      if (data.price !== undefined) fd.append('price', String(data.price))
      fd.append('is_free', String(isFree))
      
      if (previewFile) fd.append('preview_video', previewFile)
      if (fullFile) fd.append('full_video', fullFile)

      let result;
      if (editEp) {
        result = await episodeApi.update(editEp.episode_id, fd, (pct) => setUploadProgress(pct))
        toast.success('Episode updated')
      } else {
        result = await episodeApi.create(Number(videoId), fd, (pct) => setUploadProgress(pct))
        toast.success('Episode created successfully, processing started')
      }

      // If we have an episode_id, start polling for status
      if (result && result.episode_id) {
        processingStatus.startPolling(result.episode_id)
      }
      
      load()
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save episode')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    processingStatus.stop();
  };

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
            <Typography variant="body2" fontWeight={600}>🚀 Asynchronous Processing Enabled:</Typography>
            Episodes now support direct multipart upload. The server will acknowledge receipt and process HLS in the background.
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
                        onClick={ep.preview_video_url ? () => handlePlayVideo(ep.episode_id, ep.preview_video_url, `Preview · ${ep.title}`, 'preview') : undefined}
                        label="Preview"
                        size="small"
                        icon={<Visibility sx={{ fontSize: '14px !important' }} />}
                        color={ep.preview_video_url ? 'success' : 'default'}
                        variant={ep.preview_video_url ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, cursor: ep.preview_video_url ? 'pointer' : 'default' }}
                      />
                      <Chip
                        onClick={ep.full_video_url ? () => handlePlayVideo(ep.episode_id, ep.full_video_url!, `Full · ${ep.title}`, 'full') : undefined}
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
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 800, fontSize: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editEp ? `Edit Episode ${editEp.episode_number}` : 'Add New Episode'}
          <IconButton size="small" onClick={handleCloseDialog} disabled={submitting}>
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

              {/* Right column: Upload & Progress */}
              <Grid item xs={12} md={7}>
                <Stack spacing={2.5}>
                  <Typography variant="overline" fontWeight={800} color="text.secondary">
                    Video Content
                  </Typography>

                  {/* Combined Upload State UI */}
                  {(submitting || uploadProgress > 0) && (
                    <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.lighter' }}>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" fontWeight={800} color="primary.main">
                            Uploading to Server...
                          </Typography>
                          <Typography variant="caption" fontWeight={800}>{uploadProgress}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 4 }} />
                      </Stack>
                    </Paper>
                  )}

                  {/* Processing Status Polling UI */}
                  {(processingStatus.status !== 'idle' && processingStatus.status !== 'READY') && (
                    <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'success.light', bgcolor: 'success.lighter' }}>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" fontWeight={800} color="success.main">
                            {processingStatus.status === 'FAILED' ? '❌ Processing Failed' : `⚙️ Processing: ${processingStatus.status}...`}
                          </Typography>
                          <Typography variant="caption" fontWeight={800}>{processingStatus.progress}%</Typography>
                        </Stack>
                        <LinearProgress 
                          variant="determinate" 
                          value={processingStatus.progress} 
                          color={processingStatus.status === 'FAILED' ? 'error' : 'success'} 
                          sx={{ height: 6, borderRadius: 3 }} 
                        />
                        {processingStatus.error && (
                          <Typography variant="caption" color="error.main">{processingStatus.error}</Typography>
                        )}
                      </Stack>
                    </Paper>
                  )}

                  {/* Success UI */}
                  {processingStatus.isReady && (
                    <Alert icon={<CheckCircle fontSize="inherit" />} severity="success" sx={{ borderRadius: '12px' }}>
                      Episode is ready for playback!
                    </Alert>
                  )}

                  {/* File Selection Controls (only shown when not actively uploading/processing) */}
                  {!submitting && !processingStatus.isPolling && (
                    <>
                      {/* Preview Picker */}
                      <Box>
                        <Typography variant="caption" fontWeight={800} sx={{ mb: 1, display: 'block' }}>Preview Video</Typography>
                        <Button
                          component="label"
                          fullWidth
                          variant="outlined"
                          startIcon={<VideoFile />}
                          sx={{ py: 1.5, borderRadius: '12px', borderStyle: 'dashed' }}
                        >
                          {previewFile ? previewFile.name : (editEp?.preview_video_url ? 'Change Preview' : 'Select Preview Video')}
                          <input type="file" hidden accept="video/*" onChange={e => setPreviewFile(e.target.files?.[0] || null)} />
                        </Button>
                      </Box>

                      {/* Full Video Picker */}
                      <Box>
                        <Typography variant="caption" fontWeight={800} sx={{ mb: 1, display: 'block' }}>Full Video</Typography>
                        <Button
                          component="label"
                          fullWidth
                          variant="outlined"
                          startIcon={<CloudUpload />}
                          sx={{ py: 1.5, borderRadius: '12px', borderStyle: 'dashed' }}
                        >
                          {fullFile ? fullFile.name : (editEp?.full_video_url ? 'Change Full Video' : 'Select Full Video')}
                          <input type="file" hidden accept="video/*" onChange={e => setFullFile(e.target.files?.[0] || null)} />
                        </Button>
                      </Box>
                    </>
                  )}

                  {editEp && !previewFile && !fullFile && !submitting && !processingStatus.isPolling && (
                     <Alert severity="info" variant="outlined" sx={{ borderRadius: '12px' }}>
                        Leave files empty to keep existing videos.
                     </Alert>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={handleCloseDialog} disabled={submitting} sx={{ fontWeight: 700 }}>
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
        onClose={() => setVideoPlayerOpen(false)}
        TransitionProps={{ onExited: () => setCurrentVideoUrl('') }}
        maxWidth={currentVideoType === 'preview' ? 'xs' : 'md'}
        fullWidth
        PaperProps={{ sx: { bgcolor: 'black', borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle component="div" sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>{currentVideoTitle}</Typography>
          <IconButton size="small" onClick={() => setVideoPlayerOpen(false)} sx={{ color: 'white' }}>
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
            if (!currentVideoUrl) return (
              <Typography sx={{ color: 'white' }}>Video not available</Typography>
            );

            console.log('📽️ Playing Dashboard Video URL:', currentVideoUrl);
            return (
              <HLSPlayer
                key={currentVideoUrl + currentEpisodeId}
                url={currentVideoUrl}
                episodeId={currentEpisodeId || undefined}
                type={currentVideoType}
                autoPlay
                objectFit={currentVideoType === 'preview' ? 'cover' : 'contain'}
              />
            );
          })()}
        </Box>
      </Dialog>
    </Box>
  )
}
