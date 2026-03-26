import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, Alert, Divider,
  Autocomplete, CircularProgress,
} from '@mui/material'
import { Send, Campaign } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { User } from '@/types'
import toast from 'react-hot-toast'
import { notificationApi } from '@/api/notification.service'
import { adminUserApi } from '@/api/admin.service'

const broadcastSchema = z.object({
  title: z.string().min(1, 'Required'),
  message: z.string().min(1, 'Required'),
  type: z.string().min(1),
})

const sendSchema = z.object({
  user_id: z.number({ required_error: 'Select a user' }),
  title: z.string().min(1, 'Required'),
  message: z.string().min(1, 'Required'),
  type: z.string().min(1),
})

type BroadcastForm = z.infer<typeof broadcastSchema>
type SendForm = z.infer<typeof sendSchema>

const TYPE_OPTIONS = [
  { value: 'system',      label: 'System' },
  { value: 'new_episode', label: 'New episode' },
  { value: 'payment',     label: 'Payment' },
  { value: 'warning',     label: 'Warning' },
]

export default function AdminNotifPage() {
  const [broadcastResult, setBroadcastResult] = useState<{ sent_count: number } | null>(null)
  const [userOptions, setUserOptions] = useState<User[]>([])
  const [userLoading, setUserLoading] = useState(false)

  const {
    register: regB, handleSubmit: hsB, reset: resetB, control: ctrlB,
    formState: { errors: errB, isSubmitting: isSubmB },
  } = useForm<BroadcastForm>({ resolver: zodResolver(broadcastSchema), defaultValues: { type: 'system' } })

  const {
    register: regS, handleSubmit: hsS, reset: resetS, control: ctrlS, setValue: setValS,
    formState: { errors: errS, isSubmitting: isSubmS },
  } = useForm<SendForm>({ resolver: zodResolver(sendSchema), defaultValues: { type: 'system' } })

  const onBroadcast = async (data: BroadcastForm) => {
    try {
      const res = await notificationApi.broadcast(data)
      setBroadcastResult(res)
      toast.success(`Sent to ${res.sent_count.toLocaleString()} users`)
      resetB({ type: 'system', title: '', message: '' })
    } catch {}
  }

  const onSend = async (data: SendForm) => {
    try {
      await notificationApi.sendToUser(data)
      toast.success('Notification sent')
      resetS({ type: 'system', title: '', message: '' })
    } catch {}
  }

  const searchUsers = async (q: string) => {
    if (q.length < 2) return
    setUserLoading(true)
    try {
      const res = await adminUserApi.list({ search: q, limit: 10 })
      setUserOptions(res.data || [])
    } catch {}
    setUserLoading(false)
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>Send Notifications</Typography>

      <Grid container spacing={3}>
        {/* Broadcast */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Campaign sx={{ color: 'primary.main', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6">Broadcast to all users</Typography>
                  <Typography variant="caption" color="text.secondary">Sends to every active user</Typography>
                </Box>
              </Box>

              {broadcastResult && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setBroadcastResult(null)}>
                  Sent to {broadcastResult.sent_count.toLocaleString()} users
                </Alert>
              )}

              <Box component="form" onSubmit={hsB(onBroadcast)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Controller
                  name="type"
                  control={ctrlB}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Notification type</InputLabel>
                      <Select label="Notification type" {...field}>
                        {TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                />
                <TextField
                  label="Title *" fullWidth
                  {...regB('title')} error={!!errB.title} helperText={errB.title?.message}
                />
                <TextField
                  label="Message *" fullWidth multiline rows={4}
                  {...regB('message')} error={!!errB.message} helperText={errB.message?.message}
                />
                <Button type="submit" variant="contained" startIcon={<Campaign />} disabled={isSubmB} fullWidth size="large">
                  {isSubmB ? 'Sending...' : 'Broadcast to all users'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Send to user */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'secondary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send sx={{ color: 'secondary.main', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6">Send to specific user</Typography>
                  <Typography variant="caption" color="text.secondary">Target a single user</Typography>
                </Box>
              </Box>

              <Box component="form" onSubmit={hsS(onSend)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete
                  options={userOptions}
                  getOptionLabel={o => `${o.name} (${o.email})`}
                  loading={userLoading}
                  onInputChange={(_, v) => searchUsers(v)}
                  onChange={(_, v) => v && setValS('user_id', v.user_id)}
                  renderInput={params => (
                    <TextField {...params} label="Search user *" placeholder="Type name or email…"
                      error={!!errS.user_id} helperText={errS.user_id?.message}
                      InputProps={{ ...params.InputProps, endAdornment: (<>{userLoading && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>) }}
                    />
                  )}
                />
                <Controller
                  name="type"
                  control={ctrlS}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Notification type</InputLabel>
                      <Select label="Notification type" {...field}>
                        {TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                />
                <TextField
                  label="Title *" fullWidth
                  {...regS('title')} error={!!errS.title} helperText={errS.title?.message}
                />
                <TextField
                  label="Message *" fullWidth multiline rows={4}
                  {...regS('message')} error={!!errS.message} helperText={errS.message?.message}
                />
                <Button type="submit" variant="contained" color="secondary" startIcon={<Send />} disabled={isSubmS} fullWidth size="large">
                  {isSubmS ? 'Sending...' : 'Send notification'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
