import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Stack,
  Avatar,
  CircularProgress,
  InputAdornment,
  Fade,
  Backdrop,
  Paper,
  Grid
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon, History as HistoryIcon, PlayArrow } from '@mui/icons-material';
import { videoApi } from '@/app/api/video.service';
import { Video } from '@/app/types';
import { useNavigate } from 'react-router-dom';

interface SearchVideoProps {
  open: boolean;
  onClose: () => void;
}

const SearchVideo: React.FC<SearchVideoProps> = ({ open, onClose }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQ('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        const res = await videoApi.search({ q, limit: 12 });
        setResults(res.data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [q]);

  const handleSelectVideo = (video: Video) => {
    onClose();
    navigate(`/viewer/library/${video.video_id}`);
  };

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 2000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: { xs: 2, md: 8 },
          }}
        >
          {/* Header Section */}
          <Box sx={{ width: '100%', maxWidth: 800, mb: 6 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography
                sx={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 32,
                  color: 'white',
                  letterSpacing: '0.1em'
                }}
              >
                SEARCH DRAMA
              </Typography>
              <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <CloseIcon />
              </IconButton>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: '24px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
              }}
            >
              <TextField
                fullWidth
                inputRef={inputRef}
                placeholder="Search by title, tag or creator..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255,255,255,0.6)', ml: 1 }} />
                    </InputAdornment>
                  ),
                  endAdornment: loading && (
                    <InputAdornment position="end">
                      <CircularProgress size={20} sx={{ color: '#E50914', mr: 1 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& input::placeholder': { color: 'rgba(255,255,255,0.4)', opacity: 1 },
                  }
                }}
              />
            </Paper>
          </Box>

          {/* Results Section */}
          <Box
            sx={{
              width: '100%',
              maxWidth: 1000,
              flex: 1,
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
            }}
          >
            {results.length > 0 ? (
              <Grid container spacing={3}>
                {results.map((video) => (
                  <Grid item xs={12} sm={6} md={4} key={video.video_id}>
                    <Box
                      onClick={() => handleSelectVideo(video)}
                      sx={{
                        p: 1.5,
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '1px solid transparent',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                          borderColor: 'rgba(255,255,255,0.1)',
                          transform: 'translateY(-4px)',
                          '& .play-button': { opacity: 1 }
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', mb: 1.5, aspectRatio: '16/9' }}>
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <Box
                          className="play-button"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s'
                          }}
                        >
                          <PlayArrow sx={{ color: 'white', fontSize: 40 }} />
                        </Box>
                      </Box>
                      <Typography variant="subtitle1" noWrap sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                        {video.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                          {video.episode_count || 0} Episodes
                        </Typography>
                        <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" sx={{ color: '#E50914', fontWeight: 700 }}>
                          {video.is_free ? 'FREE' : `$${video.price}`}
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : q.length > 1 && !loading ? (
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>
                  No result found for "{q}"
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 4 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, mb: 3, letterSpacing: '2px' }}>
                  POPULAR SEARCHES
                </Typography>
                <Stack spacing={2}>
                  {['Drama series', 'Thriller', 'Romance', 'Action'].map((tag) => (
                    <Stack
                      key={tag}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                      }}
                      onClick={() => setQ(tag)}
                    >
                      <HistoryIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{tag}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      </Fade>
    </Backdrop>
  );
};

export default SearchVideo;