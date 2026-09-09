import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ThumbsUp, Heart, Eye, Play, Unlock, Lock, User,
  Calendar, Share2, Star, Info
} from 'lucide-react'
import { Button, IconButton, Avatar, Card, CardContent, Chip, Divider, Tooltip, Spinner } from '@/_ocean/ui'
import type { Video, Episode } from '@/app/types'
import toast from '@/app/utils/toast'
import { videoApi } from '@/app/api/video.service'
import { episodeApi } from '@/app/api/episode.service'

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
    <div className="flex justify-center py-24">
      <Spinner size={40} className="text-primary" />
    </div>
  )

  if (!video) return (
    <div className="text-center py-24">
      <h2 className="text-xl font-extrabold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">Content missing or unavailable.</h2>
      <Button color="primary" className="mt-6" onClick={() => navigate('/dashboard/browse')}>
        Return to Catalog
      </Button>
    </div>
  )

  const categoryNames = (video.categories || []).map((c: any) => typeof c === 'string' ? c : c.name)

  return (
    <div>
      {/* SaaS Navigation */}
      <div className="mb-6 flex items-center gap-3">
        <IconButton
          plain
          onClick={() => navigate(-1)}
          className="border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-surface-light dark:bg-ocean-surface-dark text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark hover:bg-ocean-card-light dark:hover:bg-ocean-card-dark"
        >
          <ArrowLeft size={18} />
        </IconButton>
        <span className="text-sm font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">Return to Library</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {/* Main Hero Media */}
          <div className="relative rounded-[32px] overflow-hidden border border-ocean-border-light dark:border-ocean-border-dark mb-6">
            <img
              src={video.thumbnail_url || `https://picsum.photos/seed/${video.video_id}/1200/675`}
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {categoryNames.map(name => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-sm text-[11px] font-extrabold uppercase tracking-wide text-white bg-white/20 backdrop-blur-md"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                  {video.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Social & Stats Row */}
          <div className="p-4 sm:p-6 rounded-3xl border border-ocean-border-light dark:border-ocean-border-dark mb-6 bg-ocean-surface-light dark:bg-ocean-surface-dark">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Tooltip title={liked ? 'Unlike' : 'Give a Like'}>
                  <IconButton
                    plain
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={liked
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-ocean-text-secondary-dark hover:bg-slate-200 dark:hover:bg-white/10'}
                  >
                    <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                  </IconButton>
                </Tooltip>
                <span className="text-xs font-extrabold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">{likeCount.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip title={favorited ? 'Unsave' : 'Save for Later'}>
                  <IconButton
                    plain
                    onClick={handleFavorite}
                    disabled={favLoading}
                    className={favorited
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-ocean-text-secondary-dark hover:bg-slate-200 dark:hover:bg-white/10'}
                  >
                    <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
                  </IconButton>
                </Tooltip>
                <span className="text-xs font-extrabold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">Save</span>
              </div>

              <Divider vertical className="h-6" />

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-xs font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                  <Eye size={16} /> {(video.view_count || 0).toLocaleString()} Views
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                  <Star size={16} className="text-yellow-400" /> 4.8 Rating
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                  <Calendar size={13} /> {new Date(video.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex-1" />
              <Button color="primary" startIcon={<Share2 size={16} />} className="px-6">Release</Button>
            </div>
          </div>

          {/* Description Card */}
          <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
            <Info className="text-primary" size={22} /> Synopsis
          </h2>
          <div className="p-6 sm:p-8 rounded-3xl border border-ocean-border-light dark:border-ocean-border-dark">
            <p className="text-[1.05rem] leading-relaxed text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
              {video.description || 'No detailed overview available for this series.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="flex flex-col gap-8">
            {/* Producer Identity */}
            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-extrabold uppercase tracking-wide text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark mb-4">Produced By</p>
                <div className="flex items-center gap-3">
                  <Avatar src={(video.creator as any)?.profile_image} size="xl" className="border-2 border-primary/20">
                    {((video.creator as any)?.name || 'S').charAt(0)}
                  </Avatar>
                  <div>
                    <p className="text-base font-extrabold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">{(video.creator as any)?.name || 'Premium Studio'}</p>
                    <p className="text-xs flex items-center gap-1 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
                      <User size={14} /> 12.5k Followers
                    </p>
                  </div>
                </div>
                <Button variant="outlined" color="primary" fullWidth className="mt-4">View Portfolio</Button>
              </CardContent>
            </Card>

            {/* Content Navigation */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-extrabold mb-4 text-ocean-text-primary-light dark:text-ocean-text-primary-dark">Episodes Library</h3>
                <div className="flex flex-col gap-2">
                  {episodes.map((ep) => (
                    <div
                      key={ep.episode_id}
                      className="flex items-center gap-3 p-2 rounded-2xl border border-transparent bg-ocean-background-light dark:bg-ocean-background-dark hover:bg-white dark:hover:bg-ocean-card-dark hover:border-primary/30 hover:translate-x-1 transition-all cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${ep.has_access ? 'bg-success/10 text-success' : 'bg-ocean-surface-light dark:bg-ocean-surface-dark text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark'}`}>
                        {ep.has_access ? <Play size={20} /> : <Lock size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-ocean-text-primary-light dark:text-ocean-text-primary-dark truncate">{ep.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">{fmtDuration(ep.duration)}</span>
                          <Chip label={ep.has_access ? 'Free' : 'Locked'} color={ep.has_access ? 'success' : 'default'} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
