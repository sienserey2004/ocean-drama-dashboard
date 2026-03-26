import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Tabs, Tab,
  Pagination, IconButton, Tooltip,
} from '@mui/material'
import { CheckCircle, Cancel, PlayArrow, Visibility } from '@mui/icons-material'
import type { Video } from '@/types'
import toast from 'react-hot-toast'
import { adminVideoApi } from '@/api/admin.service'

export default function AdminReviewPage() {
  const [tab, setTab] = useState(0)
  const [videos, setVideos] = useState<Video[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; video: Video | null }>({ open: false, video: null })
  const [rejectReason, setRejectReason] = useState('')
  const LIMIT = 10

  const STATUS_TABS = ['pending', 'published', 'rejected']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminVideoApi.list({ page, limit: LIMIT, status: STATUS_TABS[tab] })
      setVideos(res.data)
      setTotal(res.total)
    } catch {}
    setLoading(false)
  }, [tab, page])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: number) => {
    try {
      await adminVideoApi.approve(id)
      toast.success('Video approved and published')
      load()
    } catch {}
  }

  const handleReject = async () => {
    if (!rejectDialog.video) return
    try {
      await adminVideoApi.reject(rejectDialog.video.video_id, rejectReason)
      toast.success('Video rejected')
      setRejectDialog({ open: false, video: null })
      setRejectReason('')
      load()
    } catch {}
  }

  const handleForceDelete = async (id: number) => {
    if (!confirm('Permanently delete this video?')) return
    try {
      await adminVideoApi.forceDelete(id)
      toast.success('Video deleted')
      load()
    } catch {}
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Review Queue</Typography>
        <Typography variant="body2" color="text.secondary">
          Approve or reject creator-submitted videos before they go live
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1) }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Pending" />
        <Tab label="Published" />
        <Tab label="Rejected" />
      </Tabs>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Video</TableCell>
                <TableCell>Creator</TableCell>
                <TableCell>Episodes</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Submitted</TableCell>
                {tab === 0 && <TableCell align="center">Actions</TableCell>}
                {tab === 2 && <TableCell>Reject reason</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : videos.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No {STATUS_TABS[tab]} videos</Typography>
                </TableCell></TableRow>
              ) : videos.map((v) => (
                <TableRow key={v.video_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar variant="rounded" src={v.thumbnail_url} sx={{ width: 48, height: 36, bgcolor: 'primary.light' }}>
                        <PlayArrow sx={{ color: 'primary.main', fontSize: 16 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{v.title}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                          {v.categories?.slice(0, 2).map(c => (
                            <Chip key={c.category_id} label={c.name} size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'secondary.light', color: 'secondary.main' }}>
                        {((v.creator as any)?.name || v.creator || '').charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">{(v.creator as any)?.name || v.creator || 'Unknown'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{v.episode_count || 0}</Typography></TableCell>
                  <TableCell>
                    {v.is_free
                      ? <Chip label="Free" size="small" color="success" />
                      : <Typography variant="body2" fontWeight={500}>${(v.price || 0).toFixed(2)}</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(v.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  {tab === 0 && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleApprove(v.video_id)}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<Cancel />} onClick={() => { setRejectDialog({ open: true, video: v }); setRejectReason('') }}>
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  )}
                  {tab === 2 && (
                    <TableCell>
                      <Typography variant="caption" color="error.main">{v.reject_reason || '—'}</Typography>
                    </TableCell>
                  )}
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

      {/* Reject dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, video: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Reject video — {rejectDialog.video?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            The creator will be notified with your reason. They may edit and resubmit.
          </Typography>
          <TextField
            label="Reason for rejection *"
            fullWidth multiline rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog({ open: false, video: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectReason.trim()}>
            Reject video
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
