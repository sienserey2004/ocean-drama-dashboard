import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Tabs, Tab,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stack, Paper, Avatar, Divider, IconButton
} from '@mui/material'
import { CheckCircle, Cancel, Flag, ReportProblem, Visibility, AssignmentInd, WarningAmber } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { reportApi } from '@/ocean/api/report.service'
import type { Report } from '@/ocean/types'

const STATUS_CONFIG: Record<string, { color: 'warning' | 'success' | 'default', label: string }> = {
  pending:   { color: 'warning', label: 'Under Review' },
  reviewed:  { color: 'success', label: 'Processed' },
  dismissed: { color: 'default', label: 'Closed' },
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState(0)
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; report: Report | null; action: string }>({ open: false, report: null, action: '' })
  const [note, setNote] = useState('')
  const LIMIT = 15
  const TABS = ['pending', 'reviewed', 'dismissed']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportApi.list({ page, limit: LIMIT, status: TABS[tab] })
      setReports(res.data)
      setTotal(res.total)
    } catch {}
    setLoading(false)
  }, [tab, page])

  useEffect(() => { load() }, [load])

  const handleAction = async () => {
    if (!noteDialog.report) return
    try {
      await reportApi.update(noteDialog.report.report_id, noteDialog.action, note)
      toast.success(`Marked as ${noteDialog.action}`)
      setNoteDialog({ open: false, report: null, action: '' })
      setNote('')
      load()
    } catch {}
  }

  return (
    <Box>
      {/* SaaS Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
          Safety Queue
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Review and moderate user-reported content violations.
        </Typography>
      </Box>

      {/* SaaS Tabs Navigation */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 4, overflow: 'hidden' }}>
        <Tabs 
          value={tab} 
          onChange={(_, v) => { setTab(v); setPage(1) }} 
          sx={{ 
            px: 2, pt: 1, minHeight: 60,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem', minHeight: 60 },
            '& .Mui-selected': { color: 'primary.main' },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '4px 4px 0 0' }
          }}
        >
          <Tab icon={<ReportProblem fontSize="small" />} iconPosition="start" label={`Active Alerts (${tab === 0 ? total : '...'})`} />
          <Tab icon={<CheckCircle fontSize="small" />} iconPosition="start" label="Resolution History" />
          <Tab icon={<Cancel fontSize="small" />} iconPosition="start" label="Dismissed" />
        </Tabs>
      </Paper>

      <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, py: 2.5 }}>Reported Content</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reporter</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Violation Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Logged At</TableCell>
                {tab === 0 && <TableCell align="center" sx={{ fontWeight: 700 }}>Resolution</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                      <Stack spacing={2} alignItems="center">
                         <Flag sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3 }} />
                         <Typography variant="h6" color="text.secondary" fontWeight={700}>Queue cleared</Typography>
                         <Typography variant="body2" color="text.disabled">No {TABS[tab]} reports found at this time.</Typography>
                      </Stack>
                   </TableCell>
                </TableRow>
              ) : reports.map((r) => (
                <TableRow key={r.report_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                       <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 800 }}>
                          <Visibility fontSize="small" />
                       </Avatar>
                       <Box>
                          <Typography variant="subtitle2" fontWeight={800}>{r.video_title || `Collection #${r.video_id}`}</Typography>
                          <Typography variant="caption" color="text.secondary">ID: VID-{r.video_id}</Typography>
                       </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                       <AssignmentInd fontSize="small" sx={{ color: 'text.disabled' }} />
                       <Typography variant="body2" fontWeight={600}>{r.reporter?.name || `USR-${r.reported_by}`}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden', lineHeight: 1.5, wordBreak: 'break-word'
                    }}>
                      {r.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={STATUS_CONFIG[r.status]?.label || r.status} 
                      size="small" 
                      color={STATUS_CONFIG[r.status]?.color || 'default'} 
                      sx={{ fontWeight: 800, borderRadius: '8px', border: 'none' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  {tab === 0 && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          size="small" variant="contained" color="success"
                          onClick={() => { setNoteDialog({ open: true, report: r, action: 'reviewed' }); setNote('') }}
                          sx={{ borderRadius: '8px', fontWeight: 700, px: 2 }}
                        >
                          Resolve
                        </Button>
                        <Button 
                          size="small" variant="outlined" color="primary"
                          onClick={() => { setNoteDialog({ open: true, report: r, action: 'dismissed' }); setNote('') }}
                          sx={{ borderRadius: '8px', fontWeight: 700, px: 2 }}
                        >
                          Dismiss
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
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
               color="primary" showFirstButton showLastButton sx={{ '& .MuiPaginationItem-root': { fontWeight: 700 } }}
            />
          </Box>
        )}
      </Card>

      {/* Resolution Management Dialog */}
      <Dialog 
        open={noteDialog.open} 
        onClose={() => setNoteDialog({ open: false, report: null, action: '' })} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
           <WarningAmber sx={{ color: noteDialog.action === 'reviewed' ? 'success.main' : 'primary.main' }} /> {noteDialog.action === 'reviewed' ? 'Execute Resolution' : 'Close Alert'}
        </DialogTitle>
        <Box component="form" onSubmit={handleAction}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={3}>
               Providing a reason for this decision helps maintain an audit trail for future reviews.
            </Typography>
            <TextField 
              placeholder="Internal moderation notes..." 
              fullWidth multiline rows={4} 
              value={note} onChange={e => setNote(e.target.value)} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, gap: 1 }}>
            <Button onClick={() => setNoteDialog({ open: false, report: null, action: '' })} sx={{ fontWeight: 700 }}>Abort</Button>
            <Button 
               variant="contained" 
               color={noteDialog.action === 'reviewed' ? 'success' : 'primary'}
               onClick={handleAction}
               sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}
            >
               Confirm Action
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
