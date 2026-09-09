import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/_ocean/ui';

interface SearchHeaderProps {
  /** Omitted when search is the route page rather than a modal — no close button then. */
  onClose?: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ onClose }) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <span className="font-bebas text-2xl tracking-wide text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
        SEARCH
      </span>
      {onClose && (
        <IconButton onClick={onClose} aria-label="Close search">
          <X size={20} />
        </IconButton>
      )}
    </div>
  );
};

export default SearchHeader;
