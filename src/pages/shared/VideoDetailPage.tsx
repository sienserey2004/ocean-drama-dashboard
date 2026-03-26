import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Chip, Avatar, IconButton, Button, Divider,
  CircularProgress, Tooltip, Card, CardContent, Grid, List,
  ListItem, ListItemAvatar, ListItemText, Stack,
} from '@mui/material'
import {
  ArrowBack, ThumbUp, ThumbUpOutlined, Favorite, FavoriteBorder,
  Visibility, PlayArrow, LockOpen, Lock as LockIcon, Person,
  CalendarToday, Category, LocalOffer,
} from '@mui/icons-material'
import type { Video, Episode } from '@/types'
import toast from 'react-hot-toast'
import { videoApi } from '@/api/video.service'
import { episodeApi } from '@/api/episode.service'

function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()

  const [video, setVideo]     = useState<Video | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked]     = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [favLoading, setFavLoading]   = useState(false)

  useEffect(() => {
    if (!videoId) return
    setLoading(true)

    Promise.all([
      videoApi.getById(Number(videoId)),
      episodeApi.list(Number(videoId), { limit: 100 }),
      videoApi.recordView(Number(videoId)).catch(() => {}),
    ])
      .then(([vid, eps]) => {
        setVideo(vid)
        setLiked(vid.is_liked ?? false)
        setFavorited(vid.is_favorited ?? false)
        setLikeCount(vid.like_count ?? 0)
        setEpisodes(eps.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [videoId])

  const handleLike = async () => {
    if (!video || likeLoading) return
    setLikeLoading(true)
    try {
      if (liked) {
        await videoApi.unlike(video.video_id)
        setLiked(false)
        setLikeCount(c => c - 1)
      } else {
        await videoApi.like(video.video_id)
        setLiked(true)
        setLikeCount(c => c + 1)
      }
    } catch {
      toast.error('Failed to update like')
    }
    setLikeLoading(false)
  }

  const handleFavorite = async () => {
    if (!video || favLoading) return
    setFavLoading(true)
    try {
      if (favorited) {
        await videoApi.removeFavorite(video.video_id)
        setFavorited(false)
        toast.success('Removed from favorites')
      } else {
        await videoApi.addFavorite(video.video_id)
        setFavorited(true)
        toast.success('Added to favorites')
      }
    } catch {
      toast.error('Failed to update favorites')
    }
    setFavLoading(false)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!video) {
    return (
      <Box textAlign="center" py={8}>
        <Typography color="text.secondary">Video not found.</Typography>
        <Button onClick={() => navigate('/dashboard/browse')} sx={{ mt: 2 }}>
          Back to Browse
        </Button>
      </Box>
    )
  }

  const categoryNames = (video.categories || []).map((c: any) =>
    typeof c === 'string' ? c : c.name
  )
  const tagNames = (video.tags || []).map((t: any) =>
    typeof t === 'string' ? t : t.name
  )

  return (
    <Box>
      {/* Back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="body2" color="text.secondary">Back</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ── Left: main content ───────────────────────────────────── */}
        <Grid item xs={12} md={8}>

          {/* Thumbnail */}
          <Box
            component="img"
            src={video.thumbnail_url || `https://picsum.photos/seed/${video.video_id}/800/450`}
            alt={video.title}
            sx={{
              width: '100%',
              aspectRatio: '16/9',
              objectFit: 'cover',
              borderRadius: 3,
              bgcolor: 'background.default',
              mb: 2.5,
            }}
          />

          {/* Title & actions */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                {video.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {categoryNames.map(name => (
                  <Chip key={name} label={name} size="small" icon={<Category sx={{ fontSize: '14px !important' }} />} />
                ))}
                {tagNames.map(tag => (
                  <Chip key={tag} label={`#${tag}`} size="small" variant="outlined"
                    icon={<LocalOffer sx={{ fontSize: '12px !important' }} />} />
                ))}
                {video.is_free
                  ? <Chip label="Free" size="small" color="success" />
                  : <Chip label={`$${(video.price || 0).toFixed(2)}`} size="small" color="primary" />
                }
              </Stack>
            </Box>

            {/* Like & Favorite */}
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <Tooltip title={liked ? 'Unlike' : 'Like'}>
                <IconButton onClick={handleLike} disabled={likeLoading}
                  sx={{ color: liked ? 'primary.main' : 'text.secondary' }}>
                  {liked ? <ThumbUp /> : <ThumbUpOutlined />}
                </IconButton>
              </Tooltip>
              <Tooltip title={favorited ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton onClick={handleFavorite} disabled={favLoading}
                  sx={{ color: favorited ? 'error.main' : 'text.secondary' }}>
                  {favorited ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbUp sx={{ fontSize: 15 }} />
              <Typography variant="caption">{likeCount.toLocaleString()} likes</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility sx={{ fontSize: 15 }} />
              <Typography variant="caption">{(video.view_count || 0).toLocaleString()} views</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PlayArrow sx={{ fontSize: 15 }} />
              <Typography variant="caption">{video.episode_count || 0} episodes</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 13 }} />
              <Typography variant="caption">
                {new Date(video.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Description */}
          {video.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>About this series</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {video.description}
              </Typography>
            </Box>
          )}
        </Grid>

        {/* ── Right: sidebar ────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>

          {/* Creator card */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={(video.creator as any)?.profile_image}
                sx={{ width: 52, height: 52, bgcolor: 'secondary.light', color: 'secondary.main', fontSize: '1.2rem' }}
              >
                {((video.creator as any)?.name || video.creator || '').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{(video.creator as any)?.name || video.creator || 'Unknown'}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Person sx={{ fontSize: 13, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {((video.creator as any)?.follower_count || 0).toLocaleString()} followers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Episodes list */}
          <Card>
            <CardContent sx={{ pb: '8px !important' }}>
              <Typography variant="h6" gutterBottom>
                Episodes ({episodes.length})
              </Typography>

              {episodes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <PlayArrow sx={{ fontSize: 36, color: 'text.disabled' }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    No episodes yet
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {episodes.map((ep, idx) => (
                    <Box key={ep.episode_id}>
                      {idx > 0 && <Divider />}
                      <ListItem
                        disableGutters
                        sx={{ py: 1.25, gap: 1 }}
                      >
                        <ListItemAvatar sx={{ minWidth: 36 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '50%',
                            bgcolor: ep.is_preview_free ? 'success.light' : 'grey.200',
                            color: ep.is_preview_free ? 'success.main' : 'text.secondary',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.72rem', fontWeight: 700,
                          }}>
                            {ep.episode_number}
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.3 }}>
                              {ep.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                              <Typography variant="caption" color="text.secondary">
                                {fmtDuration(ep.duration)}
                              </Typography>
                              {ep.is_preview_free
                                ? <Chip label="Free" size="small" color="success"
                                    icon={<LockOpen sx={{ fontSize: '11px !important' }} />}
                                    sx={{ height: 18, fontSize: '0.65rem' }} />
                                : <Chip label="Locked" size="small"
                                    icon={<LockIcon sx={{ fontSize: '11px !important' }} />}
                                    sx={{ height: 18, fontSize: '0.65rem' }} />
                              }
                            </Box>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
