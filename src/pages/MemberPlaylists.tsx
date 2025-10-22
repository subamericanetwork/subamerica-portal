import { useState, useEffect } from 'react';
import { usePlaylist } from '@/hooks/usePlaylist';
import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { JukeboxPlayer } from '@/components/JukeboxPlayer';
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
import { Plus, Music, Trash2, Edit, Lock, Globe, Library, Eye, EyeOff } from 'lucide-react';
import { PlaylistSelectionSheet } from '@/components/PlaylistSelectionSheet';
import { cn } from '@/lib/utils';

export default function MemberPlaylists() {
  const navigate = useNavigate();
  const { playlists, loading, deletePlaylist } = usePlaylist();
  const { setPlaylist, miniPlayerVisible, setMiniPlayerVisible } = usePlayer();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Auto-select first playlist with videos
  useEffect(() => {
    if (playlists.length > 0 && !selectedPlaylistId) {
      const firstPlaylistWithVideos = playlists.find(p => p.video_ids.length > 0);
      if (firstPlaylistWithVideos) {
        setSelectedPlaylistId(firstPlaylistWithVideos.id);
        setPlaylist(firstPlaylistWithVideos.id);
      }
    }
  }, [playlists, selectedPlaylistId, setPlaylist]);

  const handleDeleteClick = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (playlistToDelete) {
      await deletePlaylist(playlistToDelete);
      // If deleted playlist was selected, clear selection
      if (playlistToDelete === selectedPlaylistId) {
        setSelectedPlaylistId(null);
      }
      setPlaylistToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading playlists...</div>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
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
            <Button onClick={() => setMiniPlayerVisible(!miniPlayerVisible)} variant="outline">
              {miniPlayerVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {miniPlayerVisible ? 'Hide Player' : 'Show Player'}
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
            <Button onClick={() => setCreateSheetOpen(true)} className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Playlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ResizablePanelGroup 
          direction="horizontal" 
          className="min-h-[calc(100vh-280px)] rounded-lg border"
        >
          {/* LEFT PANEL - Playlist List */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedPlaylistId === playlist.id && "border-primary bg-primary/5 shadow-lg"
                    )}
                    onClick={() => {
                      setSelectedPlaylistId(playlist.id);
                      setPlaylist(playlist.id);
                    }}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-1">{playlist.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs line-clamp-1">
                            {playlist.description || 'No description'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {playlist.is_public ? (
                            <Globe className="h-3 w-3 text-primary" />
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{playlist.video_ids.length} videos</span>
                        <span>{playlist.is_public ? 'Public' : 'Private'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/member/playlists/${playlist.id}/edit`);
                          }}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(playlist.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </ResizablePanel>

          {/* RESIZABLE HANDLE */}
          <ResizableHandle withHandle />

          {/* RIGHT PANEL - Jukebox Player */}
          <ResizablePanel defaultSize={65}>
            <div className="h-full p-4">
              {selectedPlaylistId ? (
                <JukeboxPlayer
                  key={selectedPlaylistId}
                  playlistId={selectedPlaylistId}
                  className="h-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Music className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a playlist to start playing</p>
                    <p className="text-sm mt-2">Choose from your playlists on the left</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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
    </MemberLayout>
  );
}
