import { CatalogBrowser } from '@/components/CatalogBrowser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MemberSidebar } from '@/components/member/MemberSidebar';
import { NowPlayingPanel } from '@/components/member/NowPlayingPanel';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scene = searchParams.get('scene');
  const { currentTrack } = usePlayer();

  const pageTitle = scene ? `Browse: ${scene}` : 'Browse All Music';

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <MemberSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/member/home')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">{pageTitle}</h1>
              {scene && (
                <Badge variant="secondary" className="ml-2">
                  {scene}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground ml-14">
              {scene 
                ? `Discover ${scene} artists and their music`
                : 'Explore all content from published artists'
              }
            </p>
          </div>

          {/* Catalog Browser */}
          <CatalogBrowser sceneFilter={scene || undefined} />
        </div>
      </div>

      {/* Right Panel - Now Playing */}
      {currentTrack && (
        <div className="w-96 border-l">
          <NowPlayingPanel />
        </div>
      )}
    </div>
  );
}
