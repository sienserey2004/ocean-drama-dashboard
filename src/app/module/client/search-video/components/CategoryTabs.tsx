import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Category } from '@/app/types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: number | null;
  setActiveCategory: (id: number | null) => void;
  loading: boolean;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  categories, 
  activeCategory, 
  setActiveCategory, 
  loading 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      overflowX: 'auto', 
      gap: 1.5, 
      mb: 4, 
      pb: 1,
      '&::-webkit-scrollbar': { display: 'none' },
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      <CategoryTab 
        label="All" 
        active={activeCategory === null} 
        onClick={() => setActiveCategory(null)} 
      />
      {loading ? (
        <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.2)' }} />
      ) : (
        categories.map((cat) => (
          <CategoryTab 
            key={cat.category_id}
            label={cat.name} 
            active={activeCategory === cat.category_id} 
            onClick={() => setActiveCategory(cat.category_id)} 
          />
        ))
      )}
    </Box>
  );
};

const CategoryTab: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ 
  label, 
  active, 
  onClick 
}) => (
  <Box
    onClick={onClick}
    sx={{
      px: 3,
      py: 1,
      borderRadius: '20px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.3s ease',
      bgcolor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: active ? 'white' : 'rgba(255,255,255,0.5)',
      fontWeight: active ? 700 : 500,
      fontSize: '14px',
      '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
    }}
  >
    {label}
  </Box>
);

export default CategoryTabs;