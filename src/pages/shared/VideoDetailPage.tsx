import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Chip, Avatar, IconButton, Button, Divider,
  CircularProgress, Tooltip, Card, CardContent, Grid, List,
  ListItem, ListItemAvatar, ListItemText, Stack, Paper
} from '@mui/material'
import {
  ArrowBack, ThumbUp, ThumbUpOutlined, Favorite, FavoriteBorder,
  Visibility, PlayArrow, LockOpen, Lock as LockIcon, Person,
  CalendarToday, Category, LocalOffer, Share, Star, Info
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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress thickness={5} />
    </Box>
  )

  if (!video) return (
    <Box textAlign="center" py={12}>
      <Typography variant="h5" fontWeight={800} color="text.secondary">Content missing or unavailable.</Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard/browse')} sx={{ mt: 3, borderRadius: '10px' }}>
        Return to Catalog
      </Button>
    </Box>
  )

  const categoryNames = (video.categories || []).map((c: any) => typeof c === 'string' ? c : c.name)

  return (
    <Box>
      {/* SaaS Navigation */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
           onClick={() => navigate(-1)} 
           sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>Return to Library</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          {/* Main Hero Media */}
          <Paper elevation={0} sx={{ borderRadius: '32px', overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 4, position: 'relative' }}>
             <Box
                component="img"
                src={video.thumbnail_url || `https://picsum.photos/seed/${video.video_id}/1200/675`}
                alt={video.title}
                sx={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
             />
             <Box sx={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)',
                display: 'flex', alignItems: 'flex-end', p: 4
             }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} mb={1}>
                    {categoryNames.map(name => (
                      <Chip key={name} label={name} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800, backdropFilter: 'blur(10px)', border: 'none' }} />
                    ))}
                  </Stack>
                  <Typography variant="h2" sx={{ color: 'white', fontWeight: 900, letterSpacing: '-2px', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {video.title}
                  </Typography>
                </Stack>
             </Box>
          </Paper>

          {/* Social & Stats Row */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', border: '1px solid', borderColor: 'divider', mb: 4 }}>
             <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center">
                   <Tooltip title={liked ? 'Unlike' : 'Give a Like'}>
                      <IconButton onClick={handleLike} disabled={likeLoading} sx={{ bgcolor: liked ? 'primary.lighter' : 'action.hover', color: liked ? 'primary.main' : 'text.disabled' }}>
                        {liked ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
                      </IconButton>
                   </Tooltip>
                   <Typography variant="caption" fontWeight={800}>{likeCount.toLocaleString()}</Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                   <Tooltip title={favorited ? 'Unsave' : 'Save for Later'}>
                      <IconButton onClick={handleFavorite} disabled={favLoading} sx={{ bgcolor: favorited ? 'error.lighter' : 'action.hover', color: favorited ? 'error.main' : 'text.disabled' }}>
                        {favorited ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                      </IconButton>
                   </Tooltip>
                   <Typography variant="caption" fontWeight={800}>Save</Typography>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

                <Stack direction="row" spacing={2.5}>
                   <Stack direction="row" spacing={0.5} alignItems="center">
                      <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">{(video.view_count || 0).toLocaleString()} Views</Typography>
                   </Stack>
                   <Stack direction="row" spacing={0.5} alignItems="center">
                      <Star sx={{ fontSize: 16, color: '#facc15' }} />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">4.8 Rating</Typography>
                   </Stack>
                   <Stack direction="row" spacing={0.5} alignItems="center">
                      <CalendarToday sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {new Date(video.created_at).toLocaleDateString()}
                      </Typography>
                   </Stack>
                </Stack>

                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" startIcon={<Share />} sx={{ borderRadius: '10px', fontWeight: 800, px: 3 }}>Release</Button>
             </Stack>
          </Paper>

          {/* Description Card */}
          <Typography variant="h5" fontWeight={800} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <Info color="primary" /> Synopsis
          </Typography>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: '1px solid', borderColor: 'divider', bgcolor: 'transparent' }}>
             <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
                {video.description || 'No detailed overview available for this series.'}
             </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
             {/* Producer Identity */}
             <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                   <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block' }}>Produced By</Typography>
                   <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar 
                         src={(video.creator as any)?.profile_image}
                         sx={{ width: 60, height: 60, borderRadius: '16px', border: '3px solid', borderColor: 'secondary.lighter', bgcolor: 'secondary.light', color: 'secondary.main', fontWeight: 800 }}
                      >
                         {((video.creator as any)?.name || 'S').charAt(0)}
                      </Avatar>
                      <Box>
                         <Typography variant="subtitle1" fontWeight={800}>{(video.creator as any)?.name || 'Premium Studio'}</Typography>
                         <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Person sx={{ fontSize: 14 }} /> 12.5k Followers
                         </Typography>
                      </Box>
                   </Stack>
                   <Button fullWidth variant="outlined" sx={{ mt: 3, borderRadius: '10px', fontWeight: 700 }}>View Portfolio</Button>
                </CardContent>
             </Card>

             {/* Content Navigation */}
             <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                   <Typography variant="h6" fontWeight={800} mb={3}>Episodes Library</Typography>
                   <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {episodes.map((ep) => (
                         <ListItem 
                            key={ep.episode_id} 
                            disablePadding
                            sx={{ 
                               borderRadius: '16px', 
                               overflow: 'hidden',
                               bgcolor: 'action.hover',
                               transition: 'all 0.2s',
                               cursor: 'pointer',
                               border: '1px solid transparent',
                               '&:hover': { bgcolor: 'background.paper', borderColor: 'primary.light', transform: 'translateX(4px)', boxShadow: 2 }
                            }}
                         >
                            <ListItemAvatar sx={{ minWidth: 60, p: 1 }}>
                               <Paper elevation={0} sx={{ 
                                  width: 44, height: 44, borderRadius: '12px', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  bgcolor: ep.has_access ? 'success.lighter' : 'background.paper',
                                  color: ep.has_access ? 'success.main' : 'text.disabled'
                               }}>
                                  {ep.has_access ? <PlayArrow /> : <LockIcon sx={{ fontSize: 18 }} />}
                               </Paper>
                            </ListItemAvatar>
                            <ListItemText 
                               primary={<Typography variant="body2" fontWeight={800}>{ep.title}</Typography>}
                               secondary={
                                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                     <Typography variant="caption" fontWeight={700} color="text.secondary">{fmtDuration(ep.duration)}</Typography>
                                     <Chip label={ep.has_access ? 'Free' : 'Locked'} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900, borderRadius: '4px' }} color={ep.has_access ? 'success' : 'default'} />
                                  </Stack>
                               }
                            />
                         </ListItem>
                      ))}
                   </List>
                </CardContent>
             </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
