import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Pagination, CircularProgress, Tooltip, Menu,
} from '@mui/material'
import { Search, MoreVert, AdminPanelSettings, Block, Delete, Restore, Person } from '@mui/icons-material'
import { adminUserApi } from '@/api/admin.service'
import type { User, Role, UserStatus } from '@/types'
import toast from 'react-hot-toast'

const ROLE_COLORS: Record<Role, 'error' | 'secondary' | 'default'> = { admin: 'error', creator: 'secondary', viewer: 'default' }
const STATUS_COLORS: Record<UserStatus, 'success' | 'warning' | 'error'> = { active: 'success', suspended: 'warning', banned: 'error' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [roleDialog, setRoleDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; status: UserStatus | '' }>({ open: false, status: '' })
  const [suspendReason, setSuspendReason] = useState('')
  const LIMIT = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminUserApi.list({
        page, limit: LIMIT,
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      })
      setUsers(res.data)
      setTotal(res.total)
    } catch {}
    setLoading(false)
  }, [page, roleFilter, statusFilter, search])

  useEffect(() => { load() }, [load])

  const openMenu = (e: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(e.currentTarget)
    setActiveUser(user)
  }

  const handleRoleChange = async (role: string) => {
    if (!activeUser) return
    try {
      await adminUserApi.changeRole(activeUser.user_id, role)
      toast.success(`Role changed to ${role}`)
      setRoleDialog(false)
      load()
    } catch {}
  }

  const handleStatusChange = async () => {
    if (!activeUser || !statusDialog.status) return
    try {
      await adminUserApi.changeStatus(activeUser.user_id, statusDialog.status, suspendReason)
      toast.success(`User ${statusDialog.status}`)
      setStatusDialog({ open: false, status: '' })
      setSuspendReason('')
      load()
    } catch {}
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return
    try {
      await adminUserApi.delete(user.user_id)
      toast.success('User deleted')
      load()
    } catch {}
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4">User management</Typography>
          <Typography variant="body2" color="text.secondary">{total.toLocaleString()} total users</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search name or email…"
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> }}
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
            <MenuItem value="">All roles</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
            <MenuItem value="creator">Creator</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <MenuItem value="">All status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="banned">Banned</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.user_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: u.role === 'admin' ? 'error.light' : u.role === 'creator' ? 'secondary.light' : 'grey.200', color: u.role === 'admin' ? 'error.main' : u.role === 'creator' ? 'secondary.main' : 'text.secondary' }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>{u.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{u.email}</Typography></TableCell>
                  <TableCell><Chip label={u.role} size="small" color={ROLE_COLORS[u.role]} sx={{ textTransform: 'capitalize' }} /></TableCell>
                  <TableCell><Chip label={u.status} size="small" color={STATUS_COLORS[u.status]} sx={{ textTransform: 'capitalize' }} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{new Date(u.created_at).toLocaleDateString()}</Typography></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => openMenu(e, u)}><MoreVert fontSize="small" /></IconButton>
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

      {/* Context menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setRoleDialog(true); setAnchorEl(null) }}>
          <AdminPanelSettings fontSize="small" sx={{ mr: 1 }} />Change role
        </MenuItem>
        <MenuItem onClick={() => { setStatusDialog({ open: true, status: 'suspended' }); setAnchorEl(null) }}>
          <Block fontSize="small" sx={{ mr: 1 }} />Suspend
        </MenuItem>
        <MenuItem onClick={() => { setStatusDialog({ open: true, status: 'banned' }); setAnchorEl(null) }}>
          <Block fontSize="small" sx={{ mr: 1, color: 'error.main' }} /><Box component="span" sx={{ color: 'error.main' }}>Ban</Box>
        </MenuItem>
        {activeUser?.status !== 'active' && (
          <MenuItem onClick={() => { setStatusDialog({ open: true, status: 'active' }); setAnchorEl(null) }}>
            <Restore fontSize="small" sx={{ mr: 1 }} />Restore
          </MenuItem>
        )}
        <MenuItem onClick={() => { if (activeUser) handleDelete(activeUser); setAnchorEl(null) }} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />Delete permanently
        </MenuItem>
      </Menu>

      {/* Role change dialog */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change role — {activeUser?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>Current role: <strong>{activeUser?.role}</strong></Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {(['viewer', 'creator', 'admin'] as Role[]).map(role => (
              <Button key={role} variant={activeUser?.role === role ? 'contained' : 'outlined'} onClick={() => handleRoleChange(role)} sx={{ textTransform: 'capitalize', justifyContent: 'flex-start' }}
                color={role === 'admin' ? 'error' : role === 'creator' ? 'secondary' : 'primary'}>
                {role}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setRoleDialog(false)}>Cancel</Button></DialogActions>
      </Dialog>

      {/* Status dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, status: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>{statusDialog.status === 'active' ? 'Restore user' : `${statusDialog.status} user`} — {activeUser?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {statusDialog.status !== 'active' && (
            <TextField label="Reason" multiline rows={2} fullWidth value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialog({ open: false, status: '' })}>Cancel</Button>
          <Button variant="contained" color={statusDialog.status === 'banned' ? 'error' : statusDialog.status === 'active' ? 'success' : 'warning'} onClick={handleStatusChange}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
