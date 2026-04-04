import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Card, CardContent,
  Stack, IconButton, CircularProgress, MenuItem, Select,
  FormControl, InputLabel, Chip, OutlinedInput, Grid, Paper, Divider,
  Avatar
} from '@mui/material';
import { CloudUpload, Delete, Send, Layers, FeaturedPlayList, InfoOutlined } from '@mui/icons-material';

import toast from 'react-hot-toast';
import { categoryApi, tagApi } from '@/app/api/categoryTag.service';
import { videoApi } from '@/app/api/video.service';
import { Category, Tag } from '@/app/types';

const CreateVideoForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
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
      toast.success(res.message || 'Series created! Verification pending.');
      setTitle('');
      setDescription('');
      setSelectedCats([]);
      setSelectedTags([]);
      removeFile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        maxWidth: 850, 
        mx: 'auto', 
        borderRadius: '32px', 
        border: '1px solid', 
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ bgcolor: 'primary.main', py: 4, px: 6, color: 'white' }}>
         <Stack direction="row" spacing={2} alignItems="center">
            <Layers sx={{ fontSize: 32 }} />
            <Box>
               <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Initialize Series</Typography>
               <Typography variant="body2" sx={{ opacity: 0.8 }}>Define the core identity of your new drama collection.</Typography>
            </Box>
         </Stack>
      </Box>

      <CardContent sx={{ p: 6 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            {/* Left Column: Media */}
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={2} sx={{ textTransform: 'uppercase', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                 Visual Identity <InfoOutlined sx={{ fontSize: 14 }} />
              </Typography>
              
              <Paper 
                variant="outlined"
                sx={{
                  border: '2px dashed',
                  borderColor: thumbnail ? 'primary.main' : 'divider',
                  borderRadius: '24px',
                  p: 1.5,
                  textAlign: 'center',
                  bgcolor: 'action.hover',
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {preview ? (
                  <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '280px', borderRadius: '16px', objectFit: 'cover' }} />
                    <IconButton
                      size="small"
                      onClick={removeFile}
                      sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { color: 'error.main' } }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Stack spacing={2} alignItems="center" sx={{ px: 4 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.lighter', color: 'primary.main' }}>
                       <CloudUpload fontSize="large" />
                    </Avatar>
                    <Box>
                       <Typography variant="subtitle2" fontWeight={800}>Click to upload thumbnail</Typography>
                       <Typography variant="caption" color="text.secondary">Optimal size: 1280x720 (16:9)</Typography>
                    </Box>
                    <Button variant="contained" component="label" sx={{ borderRadius: '10px', fontWeight: 700 }}>
                       Browse Files
                       <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                    </Button>
                  </Stack>
                )}
              </Paper>
            </Grid>

            {/* Right Column: Details */}
            <Grid item xs={12} md={7}>
              <Stack spacing={4}>
                <Box>
                   <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={2} sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Primary Details</Typography>
                   <Stack spacing={2.5}>
                      <TextField
                        label="Series Title"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Master of the Seven Seas"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                      <TextField
                        label="Series Overview"
                        fullWidth
                        multiline
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Draft a compelling synopsis..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                   </Stack>
                </Box>

                <Box>
                   <Divider sx={{ mb: 4 }} />
                   <Typography variant="subtitle2" fontWeight={800} color="text.secondary" mb={2} sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Taxonomy</Typography>
                   <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Genre / Categories</InputLabel>
                          <Select
                            multiple value={selectedCats}
                            onChange={(e) => setSelectedCats(typeof e.target.value === 'string' ? [] : e.target.value)}
                            input={<OutlinedInput label="Genre / Categories" sx={{ borderRadius: '12px' }} />}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((val) => (
                                  <Chip key={val} label={categories.find(c => c.category_id === val)?.name || val} size="small" sx={{ fontWeight: 700, borderRadius: '6px' }} />
                                ))}
                              </Box>
                            )}
                          >
                            {categories.map((c) => (
                              <MenuItem key={c.category_id} value={c.category_id}>{c.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Tags & Labels</InputLabel>
                          <Select
                            multiple value={selectedTags}
                            onChange={(e) => setSelectedTags(typeof e.target.value === 'string' ? [] : e.target.value)}
                            input={<OutlinedInput label="Tags & Labels" sx={{ borderRadius: '12px' }} />}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((val) => (
                                  <Chip key={val} label={tags.find(t => t.tag_id === val)?.name || val} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: '6px' }} />
                                ))}
                              </Box>
                            )}
                          >
                            {tags.map((t) => (
                              <MenuItem key={t.tag_id} value={t.tag_id}>{t.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                   </Grid>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
             <Button size="large" sx={{ fontWeight: 700 }}>Reset</Button>
             <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                sx={{ py: 1.5, px: 6, fontWeight: 800, borderRadius: '12px', boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)' }}
              >
                {loading ? 'Submitting...' : 'Register Series'}
             </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateVideoForm;
