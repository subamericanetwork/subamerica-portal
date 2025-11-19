import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface TopFiltersProps {
  activeFilter: 'all' | 'music' | 'videos' | 'live' | 'playlists';
  onFilterChange: (filter: 'all' | 'music' | 'videos' | 'live' | 'playlists') => void;
}

export function TopFilters({ activeFilter, onFilterChange }: TopFiltersProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const filters = [
    { value: 'all' as const, label: 'All' },
    { value: 'music' as const, label: 'Music' },
    { value: 'videos' as const, label: 'Videos' },
    { value: 'live' as const, label: 'Live' },
    { value: 'playlists' as const, label: 'Playlists' },
  ];

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border py-2">
      <div className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide px-4 touch-pan-x webkit-overflow-scrolling-touch">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            variant={activeFilter === filter.value ? 'default' : 'secondary'}
            size="sm"
            className="rounded-full px-4 py-2 flex-shrink-0 snap-start"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
