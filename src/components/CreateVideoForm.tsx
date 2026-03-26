import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Card, CardContent,
  Stack, IconButton, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Chip, OutlinedInput
} from '@mui/material';
import { CloudUpload, Delete, Send } from '@mui/icons-material';
import { videoApi } from '@/api/video.service';
import { categoryApi, tagApi } from '@/api/categoryTag.service';
import { Category, Tag } from '@/types';
import toast from 'react-hot-toast';

const CreateVideoForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCats, setSelectedCats] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    categoryApi.list().then(r => setCategories(r.data || []));
    tagApi.list().then(r => setTags(r.data || []));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setThumbnail(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    if (!thumbnail) return toast.error('Thumbnail is required');

    setLoading(true);
    const formData = new FormData();
    formData.append('thumbnail', thumbnail);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_ids', selectedCats.join(','));
    formData.append('tag_ids', selectedTags.join(','));

    try {
      const res = await videoApi.createMultipart(formData);
      toast.success(res.message || 'Series created successfully! Awaiting review.');
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedCats([]);
      setSelectedTags([]);
      removeFile();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create series';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: 700, mx: 'auto', p: 2 }}>
      <CardContent>
        <Typography variant="h5" fontWeight={700} gutterBottom>Create New Series</Typography>
        <Typography color="text.secondary" variant="body2" mb={4}>Fill in the details below to start your new drama series.</Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Thumbnail Upload */}
            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>Thumbnail Image *</Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: thumbnail ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'action.hover',
                  position: 'relative',
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                    <IconButton
                      size="small"
                      onClick={removeFile}
                      sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </>
                ) : (
                  <Button
                    component="label"
                    variant="text"
                    startIcon={<CloudUpload />}
                    sx={{ height: '100%', width: '100%' }}
                  >
                    Select Image
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </Button>
                )}
              </Box>
            </Box>

            <TextField
              label="Series Title *"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Moonlight Romance"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this series about?"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={selectedCats}
                  onChange={(e) => setSelectedCats(typeof e.target.value === 'string' ? [] : e.target.value)}
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((val) => (
                        <Chip key={val} label={categories.find(c => c.category_id === val)?.name || val} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.category_id} value={c.category_id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  value={selectedTags}
                  onChange={(e) => setSelectedTags(typeof e.target.value === 'string' ? [] : e.target.value)}
                  input={<OutlinedInput label="Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((val) => (
                        <Chip key={val} label={tags.find(t => t.tag_id === val)?.name || val} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {tags.map((t) => (
                    <MenuItem key={t.tag_id} value={t.tag_id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {loading ? 'Processing...' : 'Create Series'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateVideoForm;
