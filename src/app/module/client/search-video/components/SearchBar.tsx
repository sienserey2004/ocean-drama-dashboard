import React from 'react';
import { Search } from 'lucide-react';
import { Spinner } from '@/_ocean/ui';

interface SearchBarProps {
  q: string;
  setQ: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ q, setQ, inputRef, loading }) => {
  return (
    <div className="mb-8 min-w-0">
      <label htmlFor="drama-search" className="sr-only">
        Search dramas
      </label>
      <div className="flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border border-ocean-border-light bg-ocean-surface-light px-4 py-3 shadow-sm transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 dark:border-ocean-border-dark dark:bg-ocean-surface-dark">
        <Search
          size={19}
          aria-hidden="true"
          className="shrink-0 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark"
        />
        <input
          ref={inputRef}
          id="drama-search"
          type="search"
          autoComplete="off"
          placeholder="The moonlight will never fall..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ocean-text-primary-light outline-none placeholder:text-ocean-text-secondary-light dark:text-ocean-text-primary-dark dark:placeholder:text-ocean-text-secondary-dark"
        />
        <div className="flex shrink-0 items-center gap-2">
          {loading && <Spinner size={18} className="text-primary" />}
          <span className="whitespace-nowrap rounded-xl bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">
            @know drama
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
