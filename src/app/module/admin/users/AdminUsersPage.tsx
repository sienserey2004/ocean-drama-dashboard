import { useEffect, useState, useCallback } from 'react'
import {
  Box, Card, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Pagination, CircularProgress, Tooltip, Menu,
  Stack, InputAdornment, Paper, Divider
} from '@mui/material'
import { Search, MoreVert, AdminPanelSettings, Block, Delete, Restore, Person, FilterList, ManageAccounts, CheckCircle } from '@mui/icons-material'
import { adminUserApi } from '@/app/api/admin.service'
import { User, Role, UserStatus } from '@/app/types'
import toast from 'react-hot-toast'

const ROLE_CONFIG: Record<Role, { color: 'error' | 'secondary' | 'primary' | 'default', label: string }> = { 
  admin:   { color: 'error',     label: 'Administrator' }, 
  creator: { color: 'secondary', label: 'Content Creator' }, 
  viewer:  { color: 'primary',   label: 'Standard User' } 
}

const STATUS_CONFIG: Record<UserStatus, { color: 'success' | 'warning' | 'error', label: string }> = { 
  active:    { color: 'success', label: 'Active' }, 
  suspended: { color: 'warning', label: 'Suspended' }, 
  banned:    { color: 'error',   label: 'Banned' },
  deleted:   { color: 'error',   label: 'Deleted' }
}

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
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
          Directory
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Manage platform {total.toLocaleString()} users, permissions, and account status.
        </Typography>
      </Box>

      {/* SaaS Filters Group */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: '20px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', bgcolor: 'background.paper' }}>
        <TextField
          size="small" 
          placeholder="Search by name, email..."
          value={search} 
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          sx={{ minWidth: 280, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            displayEmpty
            sx={{ borderRadius: '12px' }}
            startAdornment={<FilterList fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="viewer">Standard Member</MenuItem>
            <MenuItem value="creator">Content Creator</MenuItem>
            <MenuItem value="admin">System Admin</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            displayEmpty
            sx={{ borderRadius: '12px' }}
          >
            <MenuItem value="">Status: Any</MenuItem>
            <MenuItem value="active">Active Accounts</MenuItem>
            <MenuItem value="suspended">Suspended Only</MenuItem>
            <MenuItem value="banned">Banned Users</MenuItem>
            <MenuItem value="deleted">Deleted Users</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>Member Info</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Electronic Mail</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Assigned Role</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Account State</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Enrollment</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Management</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><Typography color="text.secondary">No users found</Typography></TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.user_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
                      <Avatar sx={{ 
                        width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700,
                        bgcolor: u.role === 'admin' ? 'error.lighter' : u.role === 'creator' ? 'secondary.lighter' : 'primary.lighter',
                        color: u.role === 'admin' ? 'error.main' : u.role === 'creator' ? 'secondary.main' : 'primary.main'
                      }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={800}>{u.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary" fontWeight={500}>{u.email}</Typography></TableCell>
                  <TableCell>
                    <Chip 
                      label={ROLE_CONFIG[u.role]?.label || u.role || 'Unknown'} 
                      size="small" 
                      color={ROLE_CONFIG[u.role]?.color || 'default'} 
                      sx={{ fontWeight: 700, borderRadius: '8px', border: 'none' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={STATUS_CONFIG[u.status]?.label || u.status || 'Unknown'} 
                      size="small" 
                      color={STATUS_CONFIG[u.status]?.color || 'default'} 
                      sx={{ fontWeight: 700, borderRadius: '8px' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={(e) => openMenu(e, u)} 
                      sx={{ bgcolor: 'action.hover' }}
                      id={`user-menu-button-${u.user_id}`}
                      aria-haspopup="true"
                      aria-expanded={Boolean(anchorEl && activeUser?.user_id === u.user_id)}
                      aria-controls={Boolean(anchorEl && activeUser?.user_id === u.user_id) ? `user-menu-${u.user_id}` : undefined}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
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

      {/* User Context Menu */}
      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={() => setAnchorEl(null)}
        id={activeUser ? `user-menu-${activeUser.user_id}` : undefined}
        MenuListProps={{
          'aria-labelledby': activeUser ? `user-menu-button-${activeUser.user_id}` : undefined,
        }}
        PaperProps={{
           elevation: 0,
           sx: { 
             borderRadius: '12px', 
             minWidth: 180, 
             mt: 1, 
             boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
             border: '1px solid',
             borderColor: 'divider'
           }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { setRoleDialog(true); setAnchorEl(null) }}>
          <AdminPanelSettings fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />Change Permissions
        </MenuItem>
        <MenuItem onClick={() => { setStatusDialog({ open: true, status: 'suspended' }); setAnchorEl(null) }}>
          <Block fontSize="small" sx={{ mr: 1.5, color: 'warning.main' }} />Suspend Access
        </MenuItem>
        <MenuItem onClick={() => { setStatusDialog({ open: true, status: 'banned' }); setAnchorEl(null) }}>
          <Block fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} /><Box sx={{ color: 'error.main', fontWeight: 600 }}>Revoke Membership</Box>
        </MenuItem>
        {activeUser?.status !== 'active' && (
          <MenuItem onClick={() => { setStatusDialog({ open: true, status: 'active' }); setAnchorEl(null) }}>
            <Restore fontSize="small" sx={{ mr: 1.5, color: 'success.main' }} />Re-activate User
          </MenuItem>
        )}
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { if (activeUser) handleDelete(activeUser); setAnchorEl(null) }} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1.5 }} />Wipe Profile Data
        </MenuItem>
      </Menu>

      {/* Permission Assignment Dialog */}
      <Dialog 
        open={roleDialog} 
        onClose={() => setRoleDialog(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Update Permissions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Adjusting role for <strong>{activeUser?.name}</strong>. This changes their platform capabilities immediately.
          </Typography>
          <Stack spacing={1.5}>
            {(['viewer', 'creator', 'admin'] as Role[]).map(role => (
              <Button 
                key={role} 
                variant={activeUser?.role === role ? 'contained' : 'outlined'} 
                onClick={() => handleRoleChange(role)} 
                startIcon={activeUser?.role === role ? <CheckCircle /> : <ManageAccounts />}
                sx={{ 
                  borderRadius: '12px', 
                  py: 1.5, 
                  justifyContent: 'flex-start', 
                  textTransform: 'capitalize',
                  fontWeight: 700
                }}
                color={role === 'admin' ? 'error' : role === 'creator' ? 'secondary' : 'primary'}
              >
                {ROLE_CONFIG[role].label}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setRoleDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button></DialogActions>
      </Dialog>

      {/* Account State Management Dialog */}
      <Dialog 
        open={statusDialog.open} 
        onClose={() => setStatusDialog({ open: false, status: '' })} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {statusDialog.status === 'active' ? 'Restore Membership' : 'Account Restriction'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Updating state for <strong>{activeUser?.name}</strong> to <strong>{statusDialog.status}</strong>.
          </Typography>
          {statusDialog.status !== 'active' && (
            <TextField 
              label="Restriction Reason" 
              multiline rows={3} 
              fullWidth 
              value={suspendReason} 
              onChange={e => setSuspendReason(e.target.value)} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setStatusDialog({ open: false, status: '' })} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            color={statusDialog.status === 'banned' ? 'error' : statusDialog.status === 'active' ? 'success' : 'warning'} 
            onClick={handleStatusChange}
            sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}
          >
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
