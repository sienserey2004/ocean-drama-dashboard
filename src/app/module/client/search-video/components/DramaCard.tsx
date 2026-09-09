import React from 'react';
import { Eye } from 'lucide-react';
import { Video } from '@/app/types';
import { Card, Chip } from '@/_ocean/ui';

interface DramaCardProps {
  video: Video;
  onClick: () => void;
}

const DramaCard: React.FC<DramaCardProps> = ({ video, onClick }) => {
  const isNewToday = video.created_at &&
    new Date(video.created_at).toDateString() === new Date().toDateString();

  return (
    <div onClick={onClick} className="cursor-pointer">
      <Card hoverable className="relative mb-3 aspect-[2/3] overflow-hidden">
        <DramaImage src={video.thumbnail_url || ''} alt={video.title} />
        {isNewToday && (
          <div className="absolute right-2.5 top-2.5">
            <Chip label="New today" color="primary" size="sm" className="uppercase shadow-glow" />
          </div>
        )}
      </Card>
      <DramaOverlayText title={video.title} />
      <DramaMeta
        views={video.view_count || 0}
        tag={(video as any).categories?.[0]?.name || 'Drama'}
      />
    </div>
  );
};

const DramaImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <>
    <img src={src} alt={alt} className="h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
  </>
);

const DramaOverlayText: React.FC<{ title: string }> = ({ title }) => (
  <p className="mb-1 line-clamp-2 text-sm font-bold leading-tight text-ocean-text-primary-light dark:text-ocean-text-primary-dark">
    {title}
  </p>
);

const DramaMeta: React.FC<{ views: number; tag: string }> = ({ views, tag }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
      <Eye size={12} />
      <span className="text-[11px] font-semibold">
        {views > 1000 ? `${(views / 1000).toFixed(1)}k` : views}
      </span>
    </div>
    <div className="h-[3px] w-[3px] rounded-full bg-ocean-border-light dark:bg-ocean-border-dark" />
    <span className="text-[11px] font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
      {tag}
    </span>
  </div>
);

export default DramaCard;
