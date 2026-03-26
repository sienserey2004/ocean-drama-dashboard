import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, CircularProgress, Divider,
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Category, Tag } from '@/types'
import { categoryApi } from '@/api/categoryTag.service'
import { tagApi } from '@/api/categoryTag.service'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [catDialog, setCatDialog] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
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
  const openEdit = (c: Category) => { setEditCat(c); reset({ name: c.name, description: c.description || '' }); setCatDialog(true) }

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

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" mb={3}>Categories &amp; Tags</Typography>

      <Grid container spacing={3}>
        {/* Categories */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Categories</Typography>
                <Button variant="contained" size="small" startIcon={<Add />} onClick={openCreate}>Add category</Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.map(c => (
                  <Box key={c.category_id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{c.name}</Typography>
                      {c.description && <Typography variant="caption" color="text.secondary">{c.description}</Typography>}
                    </Box>
                    <Chip label={`${c.video_count ?? 0} videos`} size="small" sx={{ mr: 1 }} />
                    <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteCat(c.category_id)}><Delete fontSize="small" /></IconButton>
                  </Box>
                ))}
                {categories.length === 0 && (
                  <Typography color="text.secondary" textAlign="center" py={3}>No categories yet</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tags */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small" placeholder="New tag name…" fullWidth
                  value={newTag} onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                />
                <Button variant="contained" size="small" onClick={handleAddTag} sx={{ flexShrink: 0 }}>Add</Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map(t => (
                  <Chip
                    key={t.tag_id}
                    label={`${t.name} (${t.video_count ?? 0})`}
                    size="small"
                    onDelete={() => handleDeleteTag(t.tag_id)}
                  />
                ))}
                {tags.length === 0 && <Typography color="text.secondary">No tags yet</Typography>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category dialog */}
      <Dialog open={catDialog} onClose={() => setCatDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editCat ? 'Edit category' : 'Create category'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSaveCategory)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Name *" fullWidth {...register('name', { required: 'Required' })} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="Description" fullWidth multiline rows={2} {...register('description')} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCatDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editCat ? 'Save' : 'Create'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
