import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar,
  Divider, Grid, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress
} from '@mui/material'
import { Edit, Lock, Logout, DeleteForever, PhotoCamera } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { authApi } from '@/api/authApi.service'
import { userApi } from '@/api/user.service'

export default function ProfilePage() {
  const { user, refreshUser, logout, isAdmin, isCreator } = useAuthStore()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '', profile_image: user?.profile_image || '' },
  })

  const { register: regPw, handleSubmit: hsPw, reset: resetPw } = useForm<{
    current_password: string; new_password: string; confirm_password: string
  }>()

  const { register: regDel, handleSubmit: hsDel } = useForm<{ password: string }>()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      
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
          setValue('profile_image', url, { shouldValidate: true });
        } else if (resp.data?.data?.url || resp.data?.data?.path) {
          setValue('profile_image', resp.data?.data?.url || resp.data?.data?.path, { shouldValidate: true });
        }
        toast.success("Upload photo success");
      } catch (err) {
        console.error(err);
        toast.error("Upload photo failed");
        setProgress(0);
      }
    }
  };

  const onSaveProfile = async (data: any) => {
    setSaving(true)
    try {
      await userApi.updateMe(data)
      await refreshUser()
      toast.success('Profile updated')
      setEditMode(false)
    } catch {}
    setSaving(false)
  }

  const onChangePw = async (data: any) => {
    try {
      await authApi.changePassword(data)
      toast.success('Password changed')
      setChangePwOpen(false)
      resetPw()
    } catch {}
  }

  const onDeleteAccount = async (data: any) => {
    try {
      await userApi.deleteMe(data.password)
      toast.success('Account deleted')
      await logout()
      navigate('/login')
    } catch {}
  }

  if (!user) return null

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h4" mb={3}>My Profile</Typography>

      {/* Profile card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar src={user.profile_image || undefined} sx={{ width: 64, height: 64, bgcolor: user.role === 'admin' ? 'error.light' : user.role === 'creator' ? 'secondary.light' : 'grey.200', color: user.role === 'admin' ? 'error.main' : user.role === 'creator' ? 'secondary.main' : 'text.secondary', fontSize: '1.5rem', fontWeight: 700 }}>
              {!user.profile_image && user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5">{user.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip label={user.role} size="small" color={user.role === 'admin' ? 'error' : user.role === 'creator' ? 'secondary' : 'default'} sx={{ textTransform: 'capitalize' }} />
                <Chip label={user.status} size="small" color={user.status === 'active' ? 'success' : 'warning'} sx={{ textTransform: 'capitalize' }} />
              </Box>
            </Box>
            <Button variant="outlined" size="small" startIcon={<Edit />} sx={{ ml: 'auto' }} onClick={() => { setEditMode(!editMode); reset({ name: user.name, phone: user.phone || '', profile_image: user.profile_image || '' }); setPreview(user.profile_image || null); setProgress(0); setFile(null); }}>
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          </Box>

          {editMode ? (
            <Box component="form" onSubmit={handleSubmit(onSaveProfile)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar src={preview || undefined} sx={{ width: 64, height: 64, bgcolor: 'grey.200' }}>
                  {!preview && user.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Button variant="outlined" component="label" disabled={progress > 0 && progress < 100} size="small" startIcon={<PhotoCamera />}>
                    {progress > 0 && progress < 100 ? 'Uploading...' : 'Change Photo'}
                    <input type="file" hidden accept="image/*" onChange={handleChange} />
                  </Button>
                  {progress > 0 && progress < 100 && <LinearProgress variant="determinate" value={progress} sx={{ width: '100%', mt: 1 }} />}
                  <input type="hidden" {...register('profile_image')} />
                </Box>
              </Box>
              <TextField label="Full name" fullWidth {...register('name')} />
              <TextField label="Phone number" fullWidth {...register('phone')} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button type="submit" variant="contained" disabled={saving || (progress > 0 && progress < 100)}>{saving ? 'Saving...' : 'Save changes'}</Button>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
              </Box>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {[
                { label: 'Email',    value: user.email },
                { label: 'Phone',    value: user.phone || '—' },
                { label: 'Role',     value: user.role },
                { label: 'Member since', value: new Date(user.created_at).toLocaleDateString() },
                { label: 'Login via', value: user.login_provider },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.06em">{label}</Typography>
                  <Typography variant="body2" mt={0.25}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {user.stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Activity</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Purchases', value: user.stats.purchases_count ?? 0 },
                { label: 'Favorites', value: user.stats.favorites_count ?? 0 },
                { label: 'Following', value: user.stats.following_count ?? 0 },
                { label: 'Watched',   value: user.stats.watch_history_count ?? 0 },
              ].map(({ label, value }) => (
                <Grid item xs={6} sm={3} key={label}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={700}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>Security</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight={500}>Password</Typography>
                <Typography variant="caption" color="text.secondary">Change your account password</Typography>
              </Box>
              <Button variant="outlined" size="small" startIcon={<Lock />} onClick={() => setChangePwOpen(true)}>Change</Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight={500}>Sign out</Typography>
                <Typography variant="caption" color="text.secondary">Sign out from this device</Typography>
              </Box>
              <Button variant="outlined" size="small" color="warning" startIcon={<Logout />} onClick={async () => { await logout(); navigate('/login') }}>Sign out</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Danger zone */}
      {!isAdmin && (
        <Card sx={{ border: '1px solid', borderColor: 'error.light' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" color="error" mb={1}>Danger zone</Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              Deleting your account is permanent and cannot be undone. All your data will be removed.
            </Alert>
            <Button variant="outlined" color="error" startIcon={<DeleteForever />} onClick={() => setDeleteOpen(true)}>
              Delete my account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Change password dialog */}
      <Dialog open={changePwOpen} onClose={() => setChangePwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change password</DialogTitle>
        <Box component="form" onSubmit={hsPw(onChangePw)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Current password" type="password" fullWidth {...regPw('current_password', { required: true })} />
            <TextField label="New password" type="password" fullWidth {...regPw('new_password', { required: true, minLength: 6 })} />
            <TextField label="Confirm new password" type="password" fullWidth {...regPw('confirm_password', { required: true })} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setChangePwOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Change password</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete account dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete account</DialogTitle>
        <Box component="form" onSubmit={hsDel(onDeleteAccount)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="error">This action is permanent and cannot be reversed.</Alert>
            <TextField label="Enter your password to confirm" type="password" fullWidth {...regDel('password', { required: true })} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="error">Delete my account</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
