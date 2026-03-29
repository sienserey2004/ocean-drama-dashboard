import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar, CircularProgress, Pagination, Tooltip, LinearProgress,
  Stack, InputAdornment, Divider, Switch, FormControlLabel,
  Grid
} from '@mui/material'
import {
  Add, Edit, Delete, PlayArrow, CheckCircle, Cancel, Visibility,
  Search, FilterList, FolderOutlined, Layers, Image, Close
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/authStore'
import { videoApi } from '@/api/video.service'
import { adminVideoApi } from '@/api/admin.service'
import { categoryApi, tagApi } from '@/api/categoryTag.service'
import type { Video, Category, Tag, VideoRess } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  price: z.coerce.number().min(0),
  is_free: z.boolean(),
  category_ids: z.array(z.number()),
  tag_ids: z.array(z.number()),
})
type VideoFormData = z.infer<typeof schema>

const STATUS_CONFIG: Record<string, { color: 'warning' | 'success' | 'error' | 'default', label: string }> = {
  pending:   { color: 'warning', label: 'Pending Review' },
  published: { color: 'success', label: 'Published' },
  rejected:  { color: 'error',   label: 'Rejected' },
}

export default function MyVideosPage() {
  const { isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<VideoRess[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVideo, setEditVideo] = useState<Video | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; videoId: number | null }>({ open: false, videoId: null })
  const [rejectReason, setRejectReason] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const LIMIT = 10

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<VideoFormData>({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, is_free: false, category_ids: [], tag_ids: [] },
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, ...(statusFilter && { status: statusFilter }) }
      const res = isAdmin
        ? await adminVideoApi.list(params)
        : await videoApi.list({ ...params, creator_id: -1 })
        console.log(" res data video", res.data)
      setVideos(res.data as any)
      setTotal(res.total)
    } catch { }
    setLoading(false)
  }, [isAdmin, page, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    categoryApi.list().then(r => setCategories(r.data))
    tagApi.list().then(r => setTags(r.data))
  }, [])

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
      setDialogOpen(true)
    } catch { toast.error('Failed to load video details') }
  }

  const onSubmit = async (data: VideoFormData) => {
    if (!editVideo) return
    setSubmitting(true)
    try {
      const fd = new window.FormData()
      fd.append('title', data.title)
      fd.append('description', data.description)
      fd.append('category_ids', data.category_ids.join(','))
      fd.append('tag_ids', data.tag_ids.join(','))
      if (file) fd.append('thumbnail', file)
      await videoApi.update(editVideo.video_id, fd, (pct) => setProgress(pct))
      toast.success('Video updated successfully')
      setDialogOpen(false)
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
    } catch { }
  }

  const handleApprove = async (id: number) => {
    try { await adminVideoApi.approve(id); toast.success('Video approved'); load() } catch { }
  }

  const handleReject = async () => {
    if (!rejectDialog.videoId) return
    try {
      await adminVideoApi.reject(rejectDialog.videoId, rejectReason)
      toast.success('Video rejected')
      setRejectDialog({ open: false, videoId: null })
      setRejectReason('')
      load()
    } catch { }
  }

  const handleThumbnailFile = (f: File) => {
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleThumbnailFile(f)
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 3, mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px', mb: 1 }}>
            Video Library
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {isAdmin ? 'Complete overview of all video series across the platform.' : 'Manage and track your published drama series.'}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={openCreate}
          sx={{ 
            borderRadius: '12px', 
            py: 1.5, 
            px: 3, 
            fontWeight: 700, 
            boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)' 
          }}
        >
          New Series
        </Button>
      </Box>

      {/* Main Container */}
      <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {/* Table Filters/Actions Header */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search series..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px', bgcolor: 'background.paper' }
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                displayEmpty
                sx={{ borderRadius: '10px', bgcolor: 'background.paper' }}
                startAdornment={<FilterList fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {total} results found
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'transparent' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Title & ID</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Creator</TableCell>}
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Assets</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Pricing</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : videos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <FolderOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" fontWeight={700}>No video series found</Typography>
                      <Typography variant="body2" color="text.secondary">Try adjusting your filters or search terms.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : videos.map((v) => (
                <TableRow key={v.video_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        variant="rounded"
                        src={v.thumbnail_url}
                        sx={{ width: 56, height: 40, borderRadius: '10px', bgcolor: 'primary.light' }}
                      >
                        <Layers sx={{ color: 'primary.main', fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{v.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>#{v.video_id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Chip
                        avatar={<Avatar>{(v.creator || 'U').charAt(0).toUpperCase()}</Avatar>}
                        label={v.creator || 'Unknown'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, borderRadius: '8px' }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{v.episodes_count || 0}</Typography>
                      <Typography variant="caption" color="text.secondary">Episodes</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                      ${(v.price || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={STATUS_CONFIG[v.status]?.label || v.status} 
                      size="small" 
                      color={STATUS_CONFIG[v.status]?.color} 
                      sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'capitalize' }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Manage Content">
                        <IconButton size="small" onClick={() => navigate(`/dashboard/videos/${v.video_id}/episodes`)} sx={{ bgcolor: 'action.hover' }}>
                          <PlayArrow fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Properties">
                        <IconButton size="small" onClick={() => openEdit(v)} sx={{ bgcolor: 'action.hover' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isAdmin && v.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => handleApprove(v.video_id)} sx={{ bgcolor: 'success.light', color: 'success.dark', '&:hover': { bgcolor: 'success.main', color: 'white' } }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => setRejectDialog({ open: true, videoId: v.video_id })} sx={{ bgcolor: 'error.light', color: 'error.dark', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <IconButton size="small" color="error" onClick={() => handleDelete(v.video_id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {total > LIMIT && (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination 
              count={Math.ceil(total / LIMIT)} 
              page={page} 
              onChange={(_, p) => setPage(p)} 
              variant="outlined" 
              shape="rounded"
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Edit Component Properties Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem' }}>
          {editVideo ? 'Edit Series Details' : 'Initialize New Series'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={4}>
              <Grid item xs={12} md={5}>
                {/* Thumbnail Drop Zone */}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => { if (e.target.files?.[0]) handleThumbnailFile(e.target.files[0]) }}
                />
                <Box
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => thumbInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: dragging ? 'primary.main' : file ? 'success.main' : 'divider',
                    borderRadius: '16px',
                    minHeight: 240,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    bgcolor: dragging ? 'primary.lighter' : 'action.hover',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lighter' },
                  }}
                >
                  {preview ? (
                    <Box sx={{ position: 'relative', width: '100%' }}>
                      <img
                        src={preview}
                        alt="Thumbnail"
                        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                      />
                      <Box sx={{
                        position: 'absolute', inset: 0,
                        bgcolor: 'rgba(0,0,0,0.4)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        '&:hover': { opacity: 1 }
                      }}>
                        <Typography variant="body2" fontWeight={700} color="white">Click to change</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', boxShadow: 2 }}
                        onClick={e => { e.stopPropagation(); setPreview(null); setFile(null) }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Stack alignItems="center" spacing={1} p={3}>
                      <Image sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                      <Typography variant="body2" fontWeight={700} color="text.secondary">
                        Drag & drop or click to upload
                      </Typography>
                      <Typography variant="caption" color="text.disabled">JPG, PNG, WEBP supported</Typography>
                    </Stack>
                  )}
                </Box>

                {/* File info */}
                {file && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={700} noWrap>{file.name}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB · Will replace current thumbnail
                      </Typography>
                    </Box>
                  </Paper>
                )}
                {!file && editVideo?.thumbnail_url && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, borderRadius: '10px' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Current thumbnail set — upload a new file to replace it
                    </Typography>
                  </Paper>
                )}

                {/* Upload progress */}
                {submitting && progress > 0 && (
                  <Box mt={1.5}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" fontWeight={700}>Uploading...</Typography>
                      <Typography variant="caption" fontWeight={700}>{progress}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 6 }} />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={7}>
                <Stack spacing={3}>
                  <TextField label="Series Title" fullWidth {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
                  <TextField label="Description" fullWidth multiline rows={4} {...register('description')} error={!!errors.description} helperText={errors.description?.message} />
                  
                  <Stack direction="row" spacing={2}>
                    <TextField label="Price (USD)" type="number" {...register('price')} sx={{ flex: 1 }} />
                    <Controller
                      name="is_free"
                      control={control}
                      render={({ field }) => (
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Access Model</InputLabel>
                          <Select label="Access Model" value={field.value ? 'free' : 'paid'} onChange={e => field.onChange(e.target.value === 'free')}>
                            <MenuItem value="paid">Premium (Paid)</MenuItem>
                            <MenuItem value="free">Standard (Free)</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ mb: 3 }} />
                <Stack direction="row" spacing={3}>
                  <Controller
                    name="category_ids"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Categories</InputLabel>
                        <Select label="Categories" multiple value={field.value || []} onChange={e => field.onChange(e.target.value)}
                          renderValue={(sel) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(sel as number[] || []).map(id => <Chip key={id} label={categories.find(c => c.category_id === id)?.name} size="small" />)}
                            </Box>
                          )}>
                          {(categories || []).map(c => <MenuItem key={c.category_id} value={c.category_id}>{c.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <Controller
                    name="tag_ids"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Tags</InputLabel>
                        <Select label="Tags" multiple value={field.value || []} onChange={e => field.onChange(e.target.value)}
                          renderValue={(sel) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(sel as number[] || []).map(id => <Chip key={id} label={tags.find(t => t.tag_id === id)?.name} size="small" />)}
                            </Box>
                          )}>
                          {(tags || []).map(t => <MenuItem key={t.tag_id} value={t.tag_id}>{t.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, gap: 1 }}>
            <Button onClick={() => !submitting && setDialogOpen(false)} disabled={submitting} sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ px: 4, py: 1, borderRadius: '10px', fontWeight: 800 }}
            >
              {submitting ? 'Saving...' : 'Update Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Reject Intent Dialog */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={() => setRejectDialog({ open: false, videoId: null })} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please provide a detailed reason for rejecting this video series. This will be sent to the creator.
          </Typography>
          <TextField
            label="Rejection Feedback"
            fullWidth
            multiline rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRejectDialog({ open: false, videoId: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectReason.trim()} sx={{ borderRadius: '10px', px: 3 }}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
