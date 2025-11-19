import { useParams, useNavigate } from 'react-router-dom';
import { JukeboxPlayer } from '@/components/JukeboxPlayer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MemberLayout } from '@/components/layout/MemberLayout';

export default function JukeboxPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <MemberLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Playlist not found</p>
            <Button onClick={() => navigate('/member/playlists')} className="mt-4">
              Back to Playlists
            </Button>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/member/playlists')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Playlists
          </Button>
          
          <JukeboxPlayer playlistId={id} />
        </div>
      </div>
    </MemberLayout>
  );
}
