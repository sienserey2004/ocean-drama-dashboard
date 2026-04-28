import React, { useState, useEffect, useRef } from 'react';
import { Backdrop, Fade, Box } from '@mui/material';
import { videoApi } from '@/app/api/video.service';
import { categoryApi } from '@/app/api/categoryTag.service';
import { Video, Category } from '@/app/types';
import { useNavigate } from 'react-router-dom';
import SearchHeader from './components/SearchHeader';
import SearchBar from './components/SearchBar';
import CategoryTabs from './components/CategoryTabs';
import ActionButtons from './components/ActionButtons';
import DramaGrid from './components/DramaGrid';
interface SearchVideoProps {
  open?: boolean;
  onClose?: () => void;
}

const SearchVideo: React.FC<SearchVideoProps> = ({ open = true, onClose }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await categoryApi.list();
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        setLoading(true);
        const categoryName = activeCategory 
          ? categories.find(c => c.category_id === activeCategory)?.name 
          : undefined;

        // Use search API for everything (it handles empty q by returning all/latest)
        const res = await videoApi.search({ 
          q: q.trim() || undefined, 
          category: categoryName,
          limit: 20 
        });

        setResults(res.data);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [q, activeCategory, categories]);

  const handleSelectVideo = (video: Video) => {
    if (onClose) onClose();
    navigate(`/viewer/library/${video.video_id}`);
  };

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 2000,
        backgroundColor: '#0F1014',
        backdropFilter: 'blur(20px)',
        display: 'block',
        overflowY: 'auto'
      }}
    >
      <Fade in={open}>
        <Box sx={{ width: '100%', minHeight: '100vh', pb: 10 }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, pt: 2 }}>
            <SearchHeader onClose={handleClose} />
            <SearchBar 
              q={q} 
              setQ={setQ} 
              inputRef={inputRef} 
              loading={loading} 
            />
            <CategoryTabs 
              categories={categories} 
              activeCategory={activeCategory} 
              setActiveCategory={setActiveCategory}
              loading={loadingCategories}
            />
            <ActionButtons />
            <DramaGrid 
              results={results} 
              loading={loading} 
              onSelect={handleSelectVideo} 
            />
          </Box>
        </Box>
      </Fade>
    </Backdrop>
  );
};

export default SearchVideo;