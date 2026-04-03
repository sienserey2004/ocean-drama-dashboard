import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardMedia, CardContent, CardActionArea, Typography, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, InputAdornment,
  CircularProgress, Pagination, Avatar, Grid, Tooltip, Stack, Paper, IconButton,
  Button
} from '@mui/material'
import {
  Search, PlayCircle, Favorite, Visibility, ThumbUp, FilterList,
  Sort, Layers, BookmarkBorder, Star
} from '@mui/icons-material'
import type { Video, Category } from '@/ocean/types'
import { videoApi } from '@/ocean/api/video.service'
import { categoryApi } from '@/ocean/api/categoryTag.service'

const SORT_OPTIONS = [
  { value: 'latest',    label: 'Latest Release' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'liked',     label: 'Top Rated' },
]

const LIMIT = 12

export default function BrowseVideosPage() {
  const [videos, setVideos]       = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)

  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')
  const [sort, setSort]           = useState('latest')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit: LIMIT, sort }
      if (category) params.category = category
      if (search)   params.q = search

      const res = search
        ? await videoApi.search({ q: search, category: category || undefined, page, limit: LIMIT })
        : await videoApi.list(params)

      setVideos(res.data)
      setTotal(res.total)
    } catch {
      setVideos([])
      setTotal(0)
    }
    setLoading(false)
  }, [page, category, sort, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    categoryApi.list().then(r => setCategories(r.data)).catch(() => {})
  }, [])

  return (
    <Box>
      {/* SaaS Styled Header */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-start' }, gap: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1.5px', mb: 1 }}>
            Discovery
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Explore {total.toLocaleString()} premium drama titles from our global creators.
          </Typography>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            p: 1.5, 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            bgcolor: 'background.paper', 
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <TextField
            size="small"
            placeholder="Search titles..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select 
              value={category} 
              onChange={e => { setCategory(e.target.value); setPage(1) }}
              displayEmpty
              sx={{ borderRadius: '10px' }}
              startAdornment={<FilterList fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(c => (
                <MenuItem key={c.category_id} value={c.name}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select 
              value={sort} 
              onChange={e => { setSort(e.target.value); setPage(1) }}
              sx={{ borderRadius: '10px' }}
              startAdornment={<Sort fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              {SORT_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      </Box>

      {/* Grid Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>Loading your library...</Typography>
          </Stack>
        </Box>
      ) : videos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 12, bgcolor: 'action.hover', borderRadius: '32px' }}>
          <Stack spacing={2} alignItems="center">
            <Layers sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.5 }} />
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>No results found</Typography>
              <Typography color="text.secondary" maxWidth={400} mx="auto">
                We couldn't find any videos matching your search. Try adjusting your filters or search keywords.
              </Typography>
            </Box>
            <Button variant="outlined" sx={{ mt: 2, borderRadius: '10px' }} onClick={() => { setSearch(''); setCategory(''); setPage(1); }}>
              Reset All Filters
            </Button>
          </Stack>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {videos.map(video => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video.video_id}>
              <VideoCard video={video} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modern Pagination */}
      {total > LIMIT && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8, mb: 4 }}>
          <Pagination
            count={Math.ceil(total / LIMIT)}
            page={page}
            onChange={(_, p) => setPage(p)}
            variant="outlined"
            shape="rounded"
            color="primary"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: '12px', fontWeight: 700, border: '1px solid', borderColor: 'divider' }
            }}
          />
        </Box>
      )}
    </Box>
  )
}

function VideoCard({ video }: { video: Video }) {
  const navigate = useNavigate()
  const categoryNames = (video.categories || []).map((c: any) => typeof c === 'string' ? c : c.name)

  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%', 
        overflow: 'hidden',
        borderRadius: '24px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          borderColor: 'primary.light',
          '& .thumbnail-overlay': { opacity: 1 }
        }
      }}
    >
      <CardActionArea 
        onClick={() => navigate(`/dashboard/browse/${video.video_id}`)}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {/* Thumbnail Area */}
        <Box sx={{ position: 'relative', overflow: 'hidden', pt: '56.25%' /* 16:9 Aspect Ratio */ }}>
          <CardMedia
            component="img"
            image={video.thumbnail_url || `https://picsum.photos/seed/${video.video_id}/600/338`}
            alt={video.title}
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'transform 0.5s',
              '.MuiCardActionArea-root:hover &': { transform: 'scale(1.1)' }
            }}
          />
          
          {/* Overlay info */}
          <Box className="thumbnail-overlay" sx={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
            opacity: 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'flex-end', p: 2
          }}>
            <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
               <Chip label="Play Now" size="small" sx={{ bgcolor: 'white', color: 'black', fontWeight: 800, height: 24 }} />
               <IconButton size="small" sx={{ color: 'white' }}><BookmarkBorder fontSize="small" /></IconButton>
            </Stack>
          </Box>

          <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
            {video.is_free && (
              <Chip label="Free" size="small" sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 900, height: 20, fontSize: '0.6rem' }} />
            )}
            <Chip 
              label={`${video.episode_count || 0} eps`} 
              size="small" 
              sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontWeight: 800, height: 20, fontSize: '0.6rem', backdropFilter: 'blur(4px)' }} 
            />
          </Box>
        </Box>

        <CardContent sx={{ flex: 1, p: 2.5 }}>
          {/* Meta */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            {categoryNames.length > 0 && (
              <Chip 
                label={categoryNames[0]} 
                size="small" 
                variant="outlined" 
                sx={{ 
                  borderRadius: '6px', 
                  height: 20, 
                  fontSize: '0.65rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  border: '1px solid',
                  borderColor: 'primary.light',
                  color: 'primary.main'
                }} 
              />
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={0.5} alignItems="center">
               <Star sx={{ fontSize: 14, color: '#facc15' }} />
               <Typography variant="caption" fontWeight={800}>4.8</Typography>
            </Stack>
          </Stack>

          {/* Title */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              fontSize: '1rem', 
              lineHeight: 1.3,
              mb: 1.5,
              height: 42,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {video.title}
          </Typography>

          {/* Footer Card */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar 
              sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'secondary.light', color: 'secondary.main' }}
            >
              {(video.creator as any)?.name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', flexGrow: 1 }}>
              {(video.creator as any)?.name || 'Studio'}
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              {!video.is_free ? (
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  ${(video.price || 0).toFixed(2)}
                </Typography>
              ) : (
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>
                  FREE
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
