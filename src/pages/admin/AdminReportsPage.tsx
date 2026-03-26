import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Tabs, Tab,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material'
import { CheckCircle, Cancel } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { reportApi } from '@/api/report.service'
import type { Report } from '@/types'

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'default'> = {
  pending: 'warning', reviewed: 'success', dismissed: 'default',
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
      toast.success(`Report ${noteDialog.action}`)
      setNoteDialog({ open: false, report: null, action: '' })
      setNote('')
      load()
    } catch {}
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
        <Typography variant="body2" color="text.secondary">User-submitted content reports</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1) }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Pending" />
        <Tab label="Reviewed" />
        <Tab label="Dismissed" />
      </Tabs>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Video</TableCell>
                <TableCell>Reported by</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                {tab === 0 && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : reports.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No {TABS[tab]} reports</Typography>
                </TableCell></TableRow>
              ) : reports.map((r) => (
                <TableRow key={r.report_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{r.video_title || `Video #${r.video_id}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.reporter?.name || `User #${r.reported_by}`}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" color={STATUS_COLORS[r.status]} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(r.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  {tab === 0 && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />}
                          onClick={() => { setNoteDialog({ open: true, report: r, action: 'reviewed' }); setNote('') }}>
                          Review
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<Cancel />}
                          onClick={() => { setNoteDialog({ open: true, report: r, action: 'dismissed' }); setNote('') }}>
                          Dismiss
                        </Button>
                      </Box>
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

      <Dialog open={noteDialog.open} onClose={() => setNoteDialog({ open: false, report: null, action: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{noteDialog.action} report</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="Admin note (optional)" fullWidth multiline rows={3} value={note} onChange={e => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoteDialog({ open: false, report: null, action: '' })}>Cancel</Button>
          <Button variant="contained" onClick={handleAction}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
