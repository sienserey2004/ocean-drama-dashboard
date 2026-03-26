import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, Alert, Divider,
  Autocomplete, CircularProgress, Stack, Paper, Avatar, InputAdornment
} from '@mui/material'
import { Send, Campaign, NotificationsActive, PersonSearch, InfoOutlined, MarkEmailRead, Groups, GpsFixed as Target } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { User } from '@/types'
import toast from 'react-hot-toast'
import { notificationApi } from '@/api/notification.service'
import { adminUserApi } from '@/api/admin.service'

const broadcastSchema = z.object({
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Body content is required'),
  type: z.string().min(1),
})

const sendSchema = z.object({
  user_id: z.number({ required_error: 'Please select a recipient' }),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Body content is required'),
  type: z.string().min(1),
})

type BroadcastForm = z.infer<typeof broadcastSchema>
type SendForm = z.infer<typeof sendSchema>

const TYPE_OPTIONS = [
  { value: 'system',      label: 'System Bulletin' },
  { value: 'new_episode', label: 'Content Release' },
  { value: 'payment',     label: 'Billing / Payout' },
  { value: 'warning',     label: 'Account Alert' },
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
      toast.success(`Broadcasting to ${res.sent_count.toLocaleString()} members`)
      resetB({ type: 'system', title: '', message: '' })
    } catch {}
  }

  const onSend = async (data: SendForm) => {
    try {
      await notificationApi.sendToUser(data)
      toast.success('Localized notification delivered')
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
      {/* SaaS Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
          Outreach Hub
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Dispatch platform-wide bulletins or targeted alerts to specific members.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Global Broadcast Portal */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ height: '100%', borderRadius: '32px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 4, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                    <Groups />
                  </Avatar>
                  <Box>
                     <Typography variant="h6" fontWeight={800}>Global Broadcast</Typography>
                     <Typography variant="caption" sx={{ opacity: 0.8 }}>Impact: Entire Member Base</Typography>
                  </Box>
               </Stack>
            </Box>
            <CardContent sx={{ p: 4 }}>
              {broadcastResult && (
                <Alert 
                  severity="success" 
                  icon={<MarkEmailRead />}
                  sx={{ mb: 4, borderRadius: '12px', border: '1px solid', borderColor: 'success.light' }} 
                  onClose={() => setBroadcastResult(null)}
                >
                  <Typography variant="body2" fontWeight={700}>Broadcast Successful</Typography>
                  Dispatched to {broadcastResult.sent_count.toLocaleString()} registered accounts.
                </Alert>
              )}

              <Box component="form" onSubmit={hsB(onBroadcast)}>
                <Stack spacing={3}>
                  <Controller
                    name="type"
                    control={ctrlB}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Priority Classification</InputLabel>
                        <Select label="Priority Classification" {...field} sx={{ borderRadius: '12px' }}>
                          {TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <TextField
                    label="Bulleting Title" fullWidth
                    placeholder="e.g. Scheduled System Maintenance"
                    {...regB('title')} error={!!errB.title} helperText={errB.title?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                  <TextField
                    label="Primary Content Body" fullWidth multiline rows={6}
                    placeholder="Type the message details here..."
                    {...regB('message')} error={!!errB.message} helperText={errB.message?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large"
                    disabled={isSubmB}
                    startIcon={isSubmB ? <CircularProgress size={20} color="inherit" /> : <Campaign />}
                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800, mt: 2, boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)' }}
                  >
                    {isSubmB ? 'Executing...' : 'Dispatch to Network'}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Targeted Notification Lab */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ height: '100%', borderRadius: '32px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 4, bgcolor: 'secondary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                    <Target />
                  </Avatar>
                  <Box>
                     <Typography variant="h6" fontWeight={800}>Targeted Outreach</Typography>
                     <Typography variant="caption" sx={{ opacity: 0.8 }}>Focus: Individual Engagement</Typography>
                  </Box>
               </Stack>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={hsS(onSend)}>
                <Stack spacing={3}>
                  <Autocomplete
                    options={userOptions}
                    getOptionLabel={o => `${o.name} (${o.email})`}
                    loading={userLoading}
                    onInputChange={(_, v) => searchUsers(v)}
                    onChange={(_, v) => v && setValS('user_id', v.user_id)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    renderInput={params => (
                      <TextField 
                        {...params} 
                        label="Participant Identifier" 
                        placeholder="Search by name or email..."
                        error={!!errS.user_id} 
                        helperText={errS.user_id?.message}
                        InputProps={{ 
                           ...params.InputProps, 
                           startAdornment: <InputAdornment position="start"><PersonSearch fontSize="small" /></InputAdornment>,
                           endAdornment: (<>{userLoading && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>) 
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="type"
                    control={ctrlS}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Communication Strategy</InputLabel>
                        <Select label="Communication Strategy" {...field} sx={{ borderRadius: '12px' }}>
                          {TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <TextField
                    label="Message Headline" fullWidth
                    placeholder="e.g. Action Required: Account Verification"
                    {...regS('title')} error={!!errS.title} helperText={errS.title?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                  <TextField
                    label="Secure Context Details" fullWidth multiline rows={6}
                    placeholder="Type the individualized context here..."
                    {...regS('message')} error={!!errS.message} helperText={errS.message?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="secondary"
                    size="large"
                    disabled={isSubmS}
                    startIcon={isSubmS ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800, mt: 2, boxShadow: '0 8px 16px -4px rgba(236, 72, 153, 0.4)' }}
                  >
                    {isSubmS ? 'Transmitting...' : 'Deliver to Participant'}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Advice Section */}
      <Paper elevation={0} sx={{ mt: 6, p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', bgcolor: 'transparent', display: 'flex', alignItems: 'center', gap: 2 }}>
         <InfoOutlined sx={{ color: 'text.disabled' }} />
         <Typography variant="body2" color="text.secondary">
            Note: Global broadcasts are archived in the platform bulletin board, while targeted messages appear in the participant's direct inbox.
         </Typography>
      </Paper>
    </Box>
  )
}
