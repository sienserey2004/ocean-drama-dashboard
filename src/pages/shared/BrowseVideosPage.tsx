import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardMedia, CardContent, CardActionArea, Typography, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, InputAdornment,
  CircularProgress, Pagination, Avatar, Grid, Tooltip,
} from '@mui/material'
import {
  Search, PlayCircle, Favorite, Visibility, ThumbUp,
} from '@mui/icons-material'
import type { Video, Category } from '@/types'
import { videoApi } from '@/api/video.service'
import { categoryApi } from '@/api/categoryTag.service'

const SORT_OPTIONS = [
  { value: 'latest',    label: 'Latest' },
  { value: 'popular',   label: 'Most Viewed' },
  { value: 'liked',     label: 'Most Liked' },
]

const LIMIT = 12

export default function BrowseVideosPage() {
  const [videos, setVideos]       = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)

  // Filters
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')
  const [sort, setSort]           = useState('latest')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit: LIMIT, sort }
      if (category) params.category = category
      if (search)   params.q = search

      // Use search endpoint when there's a query, otherwise list endpoint
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

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const handleCategory = (val: string) => {
    setCategory(val)
    setPage(1)
  }

  const handleSort = (val: string) => {
    setSort(val)
    setPage(1)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Browse Videos</Typography>
        <Typography variant="body2" color="text.secondary">
          {total.toLocaleString()} published video{total !== 1 ? 's' : ''} available
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search videos…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          sx={{ minWidth: 240, flex: 1, maxWidth: 380 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={category} onChange={e => handleCategory(e.target.value)}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map(c => (
              <MenuItem key={c.category_id} value={c.name}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort by</InputLabel>
          <Select label="Sort by" value={sort} onChange={e => handleSort(e.target.value)}>
            {SORT_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {(search || category) && (
          <Chip
            label="Clear filters"
            size="small"
            onDelete={() => { setSearch(''); setCategory(''); setPage(1) }}
            sx={{ ml: 'auto' }}
          />
        )}
      </Box>

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : videos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PlayCircle sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No videos found</Typography>
          {(search || category) && (
            <Typography variant="caption" color="text.disabled">
              Try adjusting your filters
            </Typography>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {videos.map(video => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video.video_id}>
              <VideoCard video={video} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(total / LIMIT)}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  )
}

// ─── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({ video }: { video: Video }) {
  const navigate = useNavigate()
  const categoryNames = (video.categories || []).map((c: any) =>
    typeof c === 'string' ? c : c.name
  )

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.12)' } }}>
      <CardActionArea
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        onClick={() => navigate(`/dashboard/browse/${video.video_id}`)}
      >
        {/* Thumbnail */}
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height={160}
            image={video.thumbnail_url || `https://picsum.photos/seed/${video.video_id}/400/225`}
            alt={video.title}
            sx={{ objectFit: 'cover', bgcolor: 'background.default' }}
          />
          {/* Episode count badge */}
          {(video.episode_count || 0) > 0 && (
            <Chip
              label={`${video.episode_count} ep`}
              size="small"
              sx={{
                position: 'absolute', bottom: 8, right: 8,
                bgcolor: 'rgba(0,0,0,0.65)', color: '#fff',
                fontSize: '0.7rem', height: 20,
              }}
            />
          )}
          {video.is_free && (
            <Chip
              label="Free"
              size="small"
              color="success"
              sx={{ position: 'absolute', top: 8, left: 8, fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>

        <CardContent sx={{ flex: 1, pb: '12px !important' }}>
          {/* Category */}
          {categoryNames.length > 0 && (
            <Typography variant="caption" color="primary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {categoryNames[0]}
            </Typography>
          )}

          {/* Title */}
          <Tooltip title={video.title}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ mt: 0.25, mb: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            >
              {video.title}
            </Typography>
          </Tooltip>

          {/* Creator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
            <Avatar
              src={(video.creator as any)?.profile_image}
              sx={{ width: 20, height: 20, fontSize: '0.65rem', bgcolor: 'secondary.light', color: 'secondary.main' }}
            >
              {((video.creator as any)?.name || video.creator || '').charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="caption" color="text.secondary" noWrap>
              {(video.creator as any)?.name || video.creator || 'Unknown'}
            </Typography>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Visibility sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">{(video.view_count || 0).toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <ThumbUp sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">{(video.like_count || 0).toLocaleString()}</Typography>
            </Box>
            {!video.is_free && (
              <Typography variant="caption" fontWeight={600} color="primary" sx={{ ml: 'auto' }}>
                ${(video.price || 0).toFixed(2)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
