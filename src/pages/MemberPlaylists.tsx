import { useState, useEffect } from 'react';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerticalVideoFeed } from '@/components/VerticalVideoFeed';
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
import { Plus, Music, Trash2, Edit, Lock, Globe, Grid3x3 } from 'lucide-react';
import { PlaylistSelectionSheet } from '@/components/PlaylistSelectionSheet';
import { cn } from '@/lib/utils';

export default function MemberPlaylists() {
  const navigate = useNavigate();
  const { playlists, loading, deletePlaylist } = usePlaylist();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<'catalog' | 'playlist'>('catalog');

  const handleDeleteClick = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (playlistToDelete) {
      await deletePlaylist(playlistToDelete);
      if (playlistToDelete === selectedPlaylistId) {
        setSelectedPlaylistId(null);
        setFeedMode('catalog');
      }
      setPlaylistToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setFeedMode('playlist');
  };

  const handleViewCatalog = () => {
    setSelectedPlaylistId(null);
    setFeedMode('catalog');
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
                Swipe through videos from your playlists or browse the entire catalog
              </p>
            </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleViewCatalog}
              variant={feedMode === 'catalog' ? 'default' : 'outline'}
            >
              <Grid3x3 className="mr-2 h-4 w-4" />
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
            <Button onClick={() => setCreateSheetOpen(true)} className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Playlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* LEFT PANEL - Playlist List */}
          <div className="col-span-12 lg:col-span-3">
            <ScrollArea className="h-[calc(100vh-280px)] rounded-lg border bg-card">
              <div className="p-4 space-y-4">
                {playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedPlaylistId === playlist.id && feedMode === 'playlist' && "ring-2 ring-primary"
                    )}
                    onClick={() => handlePlaylistClick(playlist.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {playlist.name}
                          </CardTitle>
                          {playlist.description && (
                            <CardDescription className="text-sm mt-1 line-clamp-2">
                              {playlist.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/member/playlists/${playlist.id}/edit`)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(playlist.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {playlist.video_ids?.length || 0} videos
                        </span>
                        {playlist.is_public ? (
                          <Globe className="h-3 w-3 text-primary" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT PANEL - Vertical Video Feed */}
          <div className="col-span-12 lg:col-span-9">
            <div className="h-[calc(100vh-280px)] rounded-lg border overflow-hidden bg-black">
              <VerticalVideoFeed
                playlistId={selectedPlaylistId || undefined}
                mode={feedMode}
              />
            </div>
          </div>
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
    </MemberLayout>
  );
}
