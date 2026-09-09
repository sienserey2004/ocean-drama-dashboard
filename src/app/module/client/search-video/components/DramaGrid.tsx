import React from 'react';
import { Video } from '@/app/types';
import DramaCard from './DramaCard';
import { Spinner } from '@/_ocean/ui';

interface DramaGridProps {
  results: Video[];
  loading: boolean;
  onSelect: (video: Video) => void;
}

const DramaGrid: React.FC<DramaGridProps> = ({ results, loading, onSelect }) => {
  if (loading && results.length === 0) {
    return (
      <div className="mt-20 flex justify-center">
        <Spinner size={32} className="text-primary" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-20 text-center">
        <p className="font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
          Search for your favorite drama
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {results.map((video) => (
        <DramaCard key={video.video_id} video={video} onClick={() => onSelect(video)} />
      ))}
    </div>
  );
};

export default DramaGrid;
