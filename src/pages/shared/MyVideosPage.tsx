import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar, CircularProgress, Pagination, Tooltip, LinearProgress,
} from '@mui/material'
import {
  Add, Edit, Delete, PlayArrow, CheckCircle, Cancel, Visibility,
  Search,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { videoApi } from '@/api/video.service'
import { adminVideoApi } from '@/api/admin.service'
import { categoryApi, tagApi } from '@/api/categoryTag.service'
import type { Video, Category, Tag, VideoRess } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  thumbnail_url: z.string().min(1, 'Required'),
  price: z.coerce.number().min(0),
  is_free: z.boolean(),
  category_ids: z.array(z.number()),
  tag_ids: z.array(z.number()),
})
type FormData = z.infer<typeof schema>

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning', published: 'success', rejected: 'error',
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const LIMIT = 10

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, is_free: false, category_ids: [], tag_ids: [] },
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, ...(statusFilter && { status: statusFilter }) }
      const res = isAdmin
        ? await adminVideoApi.list(params)
        : await videoApi.list({ ...params, creator_id: -1 }) // -1 = own videos
      setVideos(res.data as any)
      setTotal(res.total)
      console.log(res.data);
    } catch { }
    setLoading(false)
  }, [isAdmin, page, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    categoryApi.list().then(r => setCategories(r.data))
    tagApi.list().then(r => setTags(r.data))
  }, [])

  const openCreate = () => { setEditVideo(null); reset({ price: 0, is_free: false, category_ids: [], tag_ids: [] }); setPreview(null); setFile(null); setProgress(0); setDialogOpen(true) }
  const openEdit = async (vs: VideoRess) => {
    try {
      const v = await videoApi.getById(vs.video_id)
      setEditVideo(v)
      reset({
        title: v.title,
        description: v.description || '',
        thumbnail_url: v.thumbnail_url || '',
        price: v.price || (v as any).total_price || 0,
        is_free: v.is_free,
        category_ids: v.categories?.map(c => c.category_id) || [],
        tag_ids: v.tags?.map(t => t.tag_id) || []
      })
      setPreview(v.thumbnail_url || null)
      setFile(null)
      setProgress(0)
      setDialogOpen(true)
    } catch { toast.error("Failed to load video details") }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (editVideo) {
        await videoApi.update(editVideo.video_id, data)
        toast.success('Video updated')
      } else {
        await videoApi.create(data)
        toast.success('Video created — awaiting admin review')
      }
      setDialogOpen(false)
      load()
    } catch { }
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



  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected)); // preview image
      
      const formData = new FormData();
      formData.append("photo", selected);
      
      try {
        const resp = await axios.post("http://localhost:3000/api/upload-photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
          },
        });
        
        const url = resp.data?.url || resp.data?.path || resp.data?.file || (typeof resp.data === 'string' ? resp.data : null);
        if (url) {
          setValue('thumbnail_url', url, { shouldValidate: true });
        } else if (resp.data?.data?.url || resp.data?.data?.path) {
          setValue('thumbnail_url', resp.data?.data?.url || resp.data?.data?.path, { shouldValidate: true });
        }
        toast.success("Upload photo success");
      } catch (err) {
        console.error(err);
        toast.error("Upload photo failed");
        setProgress(0);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4">Videos</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin ? 'All videos on the platform' : 'Your uploaded series'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/dashboard/videos/create')}>Upload series</Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                {isAdmin && <TableCell>Creator</TableCell>}
                <TableCell>Episodes</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : videos.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No videos found</Typography>
                </TableCell></TableRow>
              ) : videos.map((v) => (
                <TableRow key={v.video_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar variant="rounded" sx={{ width: 44, height: 32, bgcolor: 'primary.light' }}>
                        <PlayArrow sx={{ color: 'primary.main', fontSize: 16 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{v.title}</Typography>
                        <Typography variant="caption" color="text.secondary">Series ID: {v.video_id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: 'secondary.light', color: 'secondary.main' }}>
                          {(v.creator || '').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption">{v.creator || 'Unknown'}</Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>{v.episodes_count || 0}</TableCell>
                  <TableCell>${(v.total_price || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={v.status} size="small" color={STATUS_COLORS[v.status]} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Manage episodes">
                        <IconButton size="small" onClick={() => navigate(`/dashboard/videos/${v.video_id}/episodes`)}>
                          <PlayArrow fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(v)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      {isAdmin && v.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => handleApprove(v.video_id)}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => setRejectDialog({ open: true, videoId: v.video_id })}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(v.video_id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {total > LIMIT && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={Math.ceil(total / LIMIT)} page={page} onChange={(_, p) => setPage(p)} />
          </Box>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editVideo ? 'Edit video' : 'Upload new series'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Title *" fullWidth {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
            <TextField label="Description *" fullWidth multiline rows={3} {...register('description')} error={!!errors.description} helperText={errors.description?.message} />
            <Box sx={{ border: '1px dashed', borderRadius: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', borderColor: errors.thumbnail_url ? 'error.main' : 'divider' }}>
              {preview ? (
                <Box sx={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: 8, objectFit: 'cover' }} />
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.200' } }}
                    onClick={() => { setPreview(null); setFile(null); setProgress(0); setValue('thumbnail_url', ''); }}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Typography color="text.secondary">No thumbnail selected</Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                <Button variant="outlined" component="label" fullWidth disabled={progress > 0 && progress < 100}>
                  {progress > 0 && progress < 100 ? 'Uploading...' : progress === 100 ? 'Change Photo (Uploaded!)' : 'Select & Upload Photo'}
                  <input type="file" hidden accept="image/*" onChange={handleChange} />
                </Button>
              </Box>
              {progress > 0 && progress < 100 && <LinearProgress variant="determinate" value={progress} sx={{ width: '100%' }} />}
            </Box>
            <input type="hidden" {...register('thumbnail_url')} />
            {errors.thumbnail_url && (
              <Typography color="error" variant="caption" sx={{ ml: 1, mt: -2 }}>
                {errors.thumbnail_url.message}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Price (USD)" type="number" inputProps={{ step: '0.01', min: '0' }} {...register('price')} error={!!errors.price} helperText={errors.price?.message} sx={{ flex: 1 }} />
              <Controller
                name="is_free"
                control={control}
                render={({ field }) => (
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Access</InputLabel>
                    <Select label="Access" value={field.value ? 'free' : 'paid'} onChange={e => field.onChange(e.target.value === 'free')}>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="free">Free</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
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
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editVideo ? 'Save changes' : 'Create series'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, videoId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Reject video</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for rejection *"
            fullWidth
            multiline rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, videoId: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectReason.trim()}>Reject video</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
