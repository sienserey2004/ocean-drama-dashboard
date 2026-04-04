import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Tabs, Tab,
  Pagination, IconButton, Tooltip, Stack, Paper
} from '@mui/material'
import { CheckCircle, Cancel, PlayArrow, Visibility, HistoryEdu, HourglassEmpty, Publish, ReportProblem } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { adminVideoApi } from '@/app/api/admin.service'
import { Video } from '@/app/types'

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

  return (
    <Box>
      {/* SaaS Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
          Review Hub
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Maintain platform quality by reviewing and managing content submissions.
        </Typography>
      </Box>

      {/* Styled Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', mb: 4, overflow: 'hidden' }}>
        <Tabs 
          value={tab} 
          onChange={(_, v) => { setTab(v); setPage(1) }} 
          sx={{ 
            bgcolor: 'action.hover',
            '& .MuiTab-root': { fontWeight: 700, px: 4, py: 2.5, minHeight: 0, textTransform: 'none', color: 'text.secondary' },
            '& .Mui-selected': { color: 'primary.main', bgcolor: 'background.paper' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
          }}
        >
          <Tab icon={<HourglassEmpty sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Pending Approval" />
          <Tab icon={<Publish sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Live Content" />
          <Tab icon={<ReportProblem sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" label="Rejected Entries" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Content Info</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Creator</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Assets</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Pricing</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Submitted</TableCell>
                {tab === 0 && <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Decision</TableCell>}
                {tab === 2 && <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reason</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : videos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <Stack spacing={2} alignItems="center">
                      <HistoryEdu sx={{ fontSize: 56, color: 'text.disabled', opacity: 0.3 }} />
                      <Typography variant="h6" fontWeight={700}>Queue is empty</Typography>
                      <Typography variant="body2" color="text.secondary">No submissions found in this category.</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : videos.map((v) => (
                <TableRow key={v.video_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar variant="rounded" src={v.thumbnail_url} sx={{ width: 64, height: 42, borderRadius: '10px', bgcolor: 'primary.light' }}>
                        <PlayArrow sx={{ color: 'primary.main', fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800}>{v.title}</Typography>
                        <Stack direction="row" spacing={0.5} mt={0.5}>
                          {v.categories?.slice(0, 1).map(c => (
                            <Chip key={c.category_id} label={c.name} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', borderRadius: '6px' }} />
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 800, bgcolor: 'secondary.light', color: 'secondary.main' }}>
                        {((v.creator as any)?.name || v.creator || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {(v.creator as any)?.name || v.creator || 'Unknown'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{v.episode_count || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Episodes</Typography>
                  </TableCell>
                  <TableCell>
                    {v.is_free
                      ? <Chip label="Free Tier" size="small" color="success" sx={{ fontWeight: 800, borderRadius: '8px' }} />
                      : <Typography variant="subtitle2" fontWeight={800} color="primary.main">${(v.price || 0).toFixed(2)}</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  {tab === 0 && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success" 
                          startIcon={<CheckCircle sx={{ fontSize: 16 }} />} 
                          onClick={() => handleApprove(v.video_id)}
                          sx={{ borderRadius: '10px', fontWeight: 800, py: 1 }}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error" 
                          startIcon={<Cancel sx={{ fontSize: 16 }} />} 
                          onClick={() => { setRejectDialog({ open: true, video: v }); setRejectReason('') }}
                          sx={{ borderRadius: '10px', fontWeight: 800, py: 1 }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                  {tab === 2 && (
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 600, display: 'block', fontStyle: 'italic' }}>
                         "{v.reject_reason || 'No reason provided'}"
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {total > LIMIT && (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', bgcolor: 'action.hover' }}>
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
      </Paper>

      {/* Decision Dialog */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={() => setRejectDialog({ open: false, video: null })} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Provide constructive feedback for <strong>{rejectDialog.video?.title}</strong>. The creator will be notified and can resubmit later.
          </Typography>
          <TextField
            label="Rejection Context"
            fullWidth multiline rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setRejectDialog({ open: false, video: null })} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleReject} 
            disabled={!rejectReason.trim()}
            sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
