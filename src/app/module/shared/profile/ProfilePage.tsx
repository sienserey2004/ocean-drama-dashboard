import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar,
  Divider, Grid, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Stack, Paper, IconButton
} from '@mui/material'
import { Edit, Lock, Logout, DeleteForever, PhotoCamera, Security, VerifiedUser, Star, Visibility, Favorite, History } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/app/stores/authStore'
import toast from 'react-hot-toast'
import { authApi } from '@/app/api/authApi.service'
import { userApi } from '@/app/api/user.service'

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

  const { register, handleSubmit, reset, setValue } = useForm<{ name: string; phone: string; profile_image: string }>({
    defaultValues: { name: user?.name || '', phone: user?.phone || '', profile_image: user?.profile_image || '' },
  })

  const { register: regPw, handleSubmit: hsPw, reset: resetPw } = useForm<{
    current_password: string; new_password: string; confirm_password: string
  }>()

  const { register: regDel, handleSubmit: hsDel } = useForm<{ password: string }>()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    
    const formData = new FormData();
    formData.append("photo", selected);
    
    try {
      const resp = await axios.post("http://localhost:3000/api/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });
      const url = resp.data?.url || resp.data?.path || resp.data?.file || (typeof resp.data === 'string' ? resp.data : null);
      if (url) setValue('profile_image', url , { shouldValidate: true });
      toast.success("Profile photo uploaded");
    } catch {
      toast.error("Upload failed");
      setProgress(0);
    }
  };

  const onSaveProfile = async (data: any) => {
    setSaving(true)
    try {
      await userApi.updateMe(data)
      await refreshUser()
      toast.success('Changes saved')
      setEditMode(false)
    } catch {}
    setSaving(false)
  }

  const onChangePw = async (data: any) => {
    try {
      await authApi.changePassword(data)
      toast.success('Security password updated')
      setChangePwOpen(false)
      resetPw()
    } catch {}
  }

  const onDeleteAccount = async (data: any) => {
    try {
      await userApi.deleteMe(data.password)
      toast.success('Account terminated')
      await logout()
      navigate('/login')
    } catch {}
  }

  if (!user) return null

  return (
    <Box sx={{ maxWidth: 800 }}>
      {/* SaaS Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
          Account Settings
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Manage your personal information, security preferences, and account activity.
        </Typography>
      </Box>

      {/* Main Profile Identity Card */}
      <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', mb: 4, overflow: 'hidden' }}>
        <Box sx={{ height: 120, bgcolor: 'primary.main', position: 'relative' }}>
           <IconButton 
              sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              onClick={() => { setEditMode(!editMode); reset({ name: user.name, phone: user.phone || '', profile_image: user.profile_image || '' }); }}
           >
              <Edit fontSize="small" />
           </IconButton>
        </Box>
        <CardContent sx={{ pt: 0, px: 4, pb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-end' }, gap: 3, mt: -6, mb: 4 }}>
            <Avatar 
              src={editMode ? (preview || user.profile_image || '') : (user.profile_image || '')} 
              sx={{ 
                width: 120, height: 120, 
                border: '6px solid white', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                bgcolor: 'primary.light',
                fontSize: '3rem',
                fontWeight: 800
              }}
            >
              {!user.profile_image && !preview && user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
               <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                  <Typography variant="h4" fontWeight={800}>{user.name}</Typography>
                  <VerifiedUser sx={{ color: 'primary.main', fontSize: 24 }} />
               </Stack>
               <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>{user.email}</Typography>
               <Stack direction="row" spacing={1} mt={1.5} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                 <Chip label={user.role} size="small" sx={{ fontWeight: 800, textTransform: 'uppercase', borderRadius: '8px', bgcolor: 'primary.lighter', color: 'primary.dark' }} />
                 <Chip label={user.status} size="small" color="success" sx={{ fontWeight: 800, borderRadius: '8px' }} />
               </Stack>
            </Box>
          </Box>

          {editMode ? (
            <Box component="form" onSubmit={handleSubmit(onSaveProfile)}>
               <Stack spacing={4}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Update Profile Photo</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                       <Button variant="outlined" component="label" startIcon={<PhotoCamera />} sx={{ borderRadius: '12px' }} disabled={progress > 0 && progress < 100}>
                          {progress > 0 && progress < 100 ? 'Uploading...' : 'Choose File'}
                          <input type="file" hidden accept="image/*" onChange={handleChange} />
                       </Button>
                       <Typography variant="caption" color="text.secondary">PNG, JPG or GIF. Max 2MB.</Typography>
                    </Stack>
                    {progress > 0 && progress < 100 && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, borderRadius: 1 }} />}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                       <TextField label="Full Name" fullWidth {...register('name')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                       <TextField label="Phone Number" fullWidth {...register('phone')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button onClick={() => setEditMode(false)} sx={{ fontWeight: 700 }}>Discard</Button>
                    <Button type="submit" variant="contained" disabled={saving || (progress > 0 && progress < 100)} sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}>
                       {saving ? 'Syncing...' : 'Save Profile'}
                    </Button>
                  </Stack>
               </Stack>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {[
                { label: 'Role Identifier', value: user.role, icon: <Security /> },
                { label: 'Contact Number', value: user.phone || 'Not specified', icon: <VerifiedUser /> },
                { label: 'Account Created', value: new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }), icon: <History /> },
                { label: 'Login Method', value: user.login_provider || 'Email / Password', icon: <Lock /> },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>{label}</Typography>
                  <Typography variant="body1" fontWeight={700}>{value}</Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Activity Tracker */}
      {user.stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Orders', value: user.stats.purchases_count ?? 0, icon: <Star />, color: '#6366f1' },
            { label: 'Favorites', value: user.stats.favorites_count ?? 0, icon: <Favorite />, color: '#ec4899' },
            { label: 'Watching', value: user.stats.following_count ?? 0, icon: <Visibility />, color: '#444' },
            { label: 'History',   value: user.stats.watch_history_count ?? 0, icon: <History />, color: '#10b981' },
          ].map(({ label, value, icon, color }) => (
            <Grid item xs={6} sm={3} key={label}>
              <Paper elevation={0} sx={{ textAlign: 'center', p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
                <Avatar sx={{ mx: 'auto', mb: 1.5, bgcolor: `${color}15`, color, width: 44, height: 44 }}>{icon}</Avatar>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Security & Access Section */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
           <Lock color="primary" /> Security Center
        </Typography>
        <Paper elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>Account Password</Typography>
              <Typography variant="body2" color="text.secondary">Last changed: 3 months ago</Typography>
            </Box>
            <Button variant="contained" size="small" onClick={() => setChangePwOpen(true)} sx={{ borderRadius: '8px', fontWeight: 700 }}>Update</Button>
          </Box>
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>Active Session</Typography>
              <Typography variant="body2" color="text.secondary">Current device: Chrome on Windows</Typography>
            </Box>
            <Button variant="outlined" color="warning" size="small" onClick={async () => { await logout(); navigate('/login') }} sx={{ borderRadius: '8px', fontWeight: 700 }}>Sign Out</Button>
          </Box>
        </Paper>
      </Stack>

      {/* Danger Zone */}
      {!isAdmin && (
        <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'error.light', bgcolor: 'error.lighter' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" color="error.dark" sx={{ fontWeight: 800, mb: 2 }}>Terminate Account</Typography>
            <Typography variant="body2" color="error.main" mb={3} fontWeight={500}>
              Once you delete your account, there is no going back. Please be certain. All subscription data and history will be permanently wiped.
            </Typography>
            <Button variant="contained" color="error" startIcon={<DeleteForever />} onClick={() => setDeleteOpen(true)} sx={{ borderRadius: '10px', px: 3, fontWeight: 800 }}>
              Permanently Delete Everything
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Dialogs */}
      <Dialog 
        open={changePwOpen} 
        onClose={() => setChangePwOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 800 }}>Update Security Password</DialogTitle>
        <Box component="form" onSubmit={hsPw(onChangePw)}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField label="Current Master Password" type="password" fullWidth {...regPw('current_password', { required: true })} />
              <TextField label="New Secure Password" type="password" fullWidth {...regPw('new_password', { required: true, minLength: 6 })} />
              <TextField label="Verify New Password" type="password" fullWidth {...regPw('confirm_password', { required: true })} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, gap: 1 }}>
            <Button onClick={() => setChangePwOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}>Apply Change</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle component="div" sx={{ color: 'error.main', fontWeight: 800 }}>Final Confirmation</DialogTitle>
        <Box component="form" onSubmit={hsDel(onDeleteAccount)}>
          <DialogContent sx={{ pt: 1 }}>
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>This action is absolutely final and irreversible.</Alert>
            <TextField label="Enter Password to Confirm" type="password" fullWidth {...regDel('password', { required: true })} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, gap: 1 }}>
            <Button onClick={() => setDeleteOpen(false)} sx={{ fontWeight: 700 }}>Abort</Button>
            <Button type="submit" variant="contained" color="error" sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}>Terminate Account</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
