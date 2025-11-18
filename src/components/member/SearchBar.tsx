import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { results, loading, search } = useSearch();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        search(query);
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = results.artists.length > 0 || results.videos.length > 0 || 
                     results.audio.length > 0 || results.playlists.length > 0;

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search artists, songs, videos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 bg-muted/50"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {showResults && (
        <Card className="absolute top-full mt-2 w-full max-h-96 z-50 border shadow-lg">
          <ScrollArea className="h-full max-h-96">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-2">
                {results.artists.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Artists</div>
                    {results.artists.map((artist) => (
                      <button
                        key={artist.id}
                        onClick={() => {
                          navigate(`/${artist.slug}`);
                          setShowResults(false);
                          setQuery('');
                        }}
                        className="w-full px-2 py-2 text-left hover:bg-muted rounded flex items-center gap-2"
                      >
                        <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium truncate">{artist.display_name}</p>
                            {artist.is_verified && <VerifiedBadge size="sm" />}
                          </div>
                          <p className="text-xs text-muted-foreground">Artist</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.videos.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Videos</div>
                    {results.videos.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => {
                          navigate(`/watch/${video.id}`);
                          setShowResults(false);
                          setQuery('');
                        }}
                        className="w-full px-2 py-2 text-left hover:bg-muted rounded"
                      >
                        <p className="font-medium truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground">{video.artists?.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}

                {results.audio.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Audio</div>
                    {results.audio.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          // Play audio
                          setShowResults(false);
                          setQuery('');
                        }}
                        className="w-full px-2 py-2 text-left hover:bg-muted rounded"
                      >
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground">{track.artists?.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
