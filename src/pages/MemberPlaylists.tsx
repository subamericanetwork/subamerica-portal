import { useState } from 'react';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Music, Trash2, Edit, Play, Lock, Globe, Library } from 'lucide-react';
import { PlaylistSelectionSheet } from '@/components/PlaylistSelectionSheet';

export default function MemberPlaylists() {
  const navigate = useNavigate();
  const { playlists, loading, deletePlaylist } = usePlaylist();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const handleDeleteClick = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (playlistToDelete) {
      await deletePlaylist(playlistToDelete);
      setPlaylistToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handlePlayPlaylist = (playlistId: string) => {
    navigate(`/member/playlists/${playlistId}/jukebox`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading playlists...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Playlists</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your personal playlists
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/browse')} variant="outline">
              <Library className="mr-2 h-4 w-4" />
              Browse Catalog
            </Button>
            <Button onClick={() => setCreateSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Playlist
            </Button>
          </div>
        </div>
      </div>

      {playlists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first playlist to organize your favorite videos and audio
            </p>
            <Button onClick={() => setCreateSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Playlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {playlist.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="ml-2">
                    {playlist.is_public ? (
                      <Globe className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{playlist.video_ids.length} videos</span>
                  <span>{playlist.is_public ? 'Public' : 'Private'}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePlayPlaylist(playlist.id)}
                    className="flex-1"
                    disabled={playlist.video_ids.length === 0}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/member/playlists/${playlist.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteClick(playlist.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this playlist? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlaylistSelectionSheet
        isOpen={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
      />
    </div>
  );
}
