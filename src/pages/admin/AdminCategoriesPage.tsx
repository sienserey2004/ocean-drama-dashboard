import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Divider, Stack, Paper, Avatar
} from '@mui/material'
import { Add, Edit, Delete, Category, LocalOffer, FolderSpecial, Search, Tag as TagIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Category as CategoryType, Tag } from '@/types'
import { categoryApi } from '@/api/categoryTag.service'
import { tagApi } from '@/api/categoryTag.service'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [catDialog, setCatDialog] = useState(false)
  const [editCat, setEditCat] = useState<CategoryType | null>(null)
  const [newTag, setNewTag] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; description?: string }>()

  const load = async () => {
    setLoading(true)
    try {
      const [cats, tgs] = await Promise.all([categoryApi.list(), tagApi.list()])
      setCategories(cats.data)
      setTags(tgs.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditCat(null); reset({ name: '', description: '' }); setCatDialog(true) }
  const openEdit = (c: CategoryType) => { setEditCat(c); reset({ name: c.name, description: c.description || '' }); setCatDialog(true) }

  const onSaveCategory = async (data: { name: string; description?: string }) => {
    try {
      if (editCat) {
        await categoryApi.update(editCat.category_id, data)
        toast.success('Category updated')
      } else {
        await categoryApi.create(data)
        toast.success('Category created')
      }
      setCatDialog(false)
      load()
    } catch {}
  }

  const handleDeleteCat = async (id: number) => {
    if (!confirm('Delete this category? Videos in this category will be unaffected.')) return
    try { await categoryApi.delete(id); toast.success('Category deleted'); load() } catch {}
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    try { await tagApi.create(newTag.trim()); toast.success('Tag added'); setNewTag(''); load() } catch {}
  }

  const handleDeleteTag = async (id: number) => {
    try { await tagApi.delete(id); toast.success('Tag deleted'); load() } catch {}
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress thickness={5} />
    </Box>
  )

  return (
    <Box>
      {/* SaaS Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1.5 }}>
          Taxonomy Editor
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Define the organizational structure for Content and Metadata.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Categories Section */}
        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', borderRadius: '10px', width: 40, height: 40 }}><Category /></Avatar>
                <Typography variant="h6" fontWeight={800}>Primary Genres</Typography>
              </Stack>
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={openCreate}
                sx={{ borderRadius: '10px', fontWeight: 700, px: 3 }}
              >
                Add Genre
              </Button>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={2}>
                {categories.map(c => (
                  <Paper 
                    key={c.category_id} 
                    elevation={0}
                    sx={{ 
                      display: 'flex', alignItems: 'center', p: 2, 
                      borderRadius: '16px', border: '1px solid', borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.light', transform: 'translateX(4px)' }
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={800}>{c.name}</Typography>
                      {c.description && <Typography variant="caption" color="text.secondary">{c.description}</Typography>}
                    </Box>
                    <Chip 
                       label={`${c.video_count ?? 0} titles`} 
                       size="small" 
                       sx={{ mr: 2, fontWeight: 700, borderRadius: '8px', bgcolor: 'background.paper' }} 
                    />
                    <Stack direction="row" spacing={1}>
                       <IconButton size="small" onClick={() => openEdit(c)} sx={{ bgcolor: 'background.paper' }}><Edit fontSize="small" /></IconButton>
                       <IconButton size="small" color="error" onClick={() => handleDeleteCat(c.category_id)} sx={{ bgcolor: 'error.lighter' }}><Delete fontSize="small" /></IconButton>
                    </Stack>
                  </Paper>
                ))}
                {categories.length === 0 && (
                  <Box textAlign="center" py={4}>
                     <FolderSpecial sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3, mb: 1 }} />
                     <Typography color="text.secondary" fontWeight={600}>No genres defined yet.</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Tags Section */}
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 4, bgcolor: 'secondary.lighter', borderBottom: '1px solid', borderColor: 'divider' }}>
               <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.main', borderRadius: '10px', width: 40, height: 40 }}><TagIcon /></Avatar>
                  <Typography variant="h6" fontWeight={800}>Label Cloud</Typography>
               </Stack>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 4 }}>
                 <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1.5, display: 'block' }}>Quick Add Label</Typography>
                 <Stack direction="row" spacing={1.5}>
                    <TextField
                      size="small" 
                      placeholder="e.g. award-winning" 
                      fullWidth
                      value={newTag} 
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                    <Button variant="contained" color="secondary" onClick={handleAddTag} sx={{ borderRadius: '10px', px: 3, fontWeight: 800 }}>Add</Button>
                 </Stack>
              </Box>
              
              <Divider sx={{ mb: 4 }} />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {tags.map(t => (
                  <Chip
                    key={t.tag_id}
                    label={`${t.name} • ${t.video_count ?? 0}`}
                    onDelete={() => handleDeleteTag(t.tag_id)}
                    sx={{ 
                      fontWeight: 700, 
                      borderRadius: '10px', 
                      py: 2, px: 1, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'secondary.lighter' }
                    }}
                  />
                ))}
                {tags.length === 0 && (
                   <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No labels registered.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Management Dialog */}
      <Dialog 
        open={catDialog} 
        onClose={() => setCatDialog(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{editCat ? 'Update Strategy' : 'New Strategic Theme'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSaveCategory)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField label="Classification Name" fullWidth {...register('name', { required: 'Required' })} error={!!errors.name} helperText={errors.name?.message} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              <TextField label="Scope Description" fullWidth multiline rows={3} {...register('description')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, gap: 1 }}>
            <Button onClick={() => setCatDialog(false)} sx={{ fontWeight: 700 }}>Discard</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '10px', px: 4, fontWeight: 800 }}>{editCat ? 'Sync Changes' : 'Register Theme'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
