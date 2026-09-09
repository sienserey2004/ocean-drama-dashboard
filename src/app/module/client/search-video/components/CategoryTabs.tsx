import React from 'react';
import { Category } from '@/app/types';
import { Chip, Spinner } from '@/_ocean/ui';

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
  loading,
}) => {
  return (
    <div className="no-scrollbar mb-8 flex gap-3 overflow-x-auto pb-2">
      <CategoryTab
        label="All"
        active={activeCategory === null}
        onClick={() => setActiveCategory(null)}
      />
      {loading ? (
        <Spinner
          size={24}
          className="text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
        />
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
    </div>
  );
};

const CategoryTab: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button type="button" onClick={onClick} className="shrink-0 whitespace-nowrap bg-transparent p-0">
    <Chip label={label} color={active ? 'primary' : 'default'} className="cursor-pointer transition-colors" />
  </button>
);

export default CategoryTabs;
