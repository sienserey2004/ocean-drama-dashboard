import React, { useState, useEffect, useRef } from 'react';
import { videoApi } from '@/app/api/video.service';
import { categoryApi } from '@/app/api/categoryTag.service';
import { Video, Category } from '@/app/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  // Rendered two ways: as a modal over the reel feed (ReelMain passes onClose),
  // and as the /search route page. Only the modal may cover the layout chrome —
  // as a page it has to stay in flow so the navbar and bottom tab bar show.
  const isModal = typeof onClose === 'function';
  const [searchParams] = useSearchParams();
  const initialCategoryName = searchParams.get('category') || '';
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve a ?category=<name> deep-link once categories have loaded
  useEffect(() => {
    if (!initialCategoryName || activeCategory !== null || categories.length === 0) return;
    const match = categories.find((c) => c.name === initialCategoryName);
    if (match) setActiveCategory(match.category_id);
  }, [categories, initialCategoryName, activeCategory]);

  const handleClose = () => {
    onClose?.();
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

  if (!open) return null;

  return (
    <div
      className={
        isModal
          ? 'animate-fade-in fixed inset-0 z-[2000] block overflow-y-auto bg-ocean-background-light/95 backdrop-blur-xl dark:bg-ocean-background-dark/95'
          : 'animate-fade-in min-h-full w-full bg-ocean-background-light dark:bg-ocean-background-dark'
      }
    >
      {/* Extra bottom padding on mobile clears the floating tab bar. */}
      <div className={isModal ? 'min-h-screen w-full pb-20' : 'w-full pb-32 md:pb-10'}>
        <div className="mx-auto max-w-[800px] px-4 pt-4">
          <SearchHeader onClose={isModal ? handleClose : undefined} />
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
        </div>
      </div>
    </div>
  );
};

export default SearchVideo;