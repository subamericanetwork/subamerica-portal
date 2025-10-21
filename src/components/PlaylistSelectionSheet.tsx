import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Music, Lock, Globe } from 'lucide-react';

interface PlaylistSelectionSheetProps {
  videoId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistSelectionSheet = ({
  videoId,
  isOpen,
  onOpenChange,
}: PlaylistSelectionSheetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playlists, addVideoToPlaylist, createPlaylist } = usePlaylist();
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(false);

  if (!user) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sign in Required</SheetTitle>
            <SheetDescription>
              Please sign in to create and manage playlists.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const playlist = await createPlaylist(
        newPlaylistName,
        newPlaylistDescription,
        newPlaylistPublic
      );
      
      if (playlist) {
        await addVideoToPlaylist(playlist.id, videoId);
        setIsCreating(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setNewPlaylistPublic(false);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    await addVideoToPlaylist(playlistId, videoId);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add to Playlist</SheetTitle>
          <SheetDescription>
            Select a playlist or create a new one
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!isCreating ? (
            <>
              <Button
                onClick={() => setIsCreating(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Playlist
              </Button>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {playlists.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Music className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>No playlists yet</p>
                      <p className="text-sm">Create your first playlist above</p>
                    </div>
                  ) : (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{playlist.name}</h4>
                            {playlist.description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {playlist.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{playlist.video_ids.length} videos</span>
                              <span>•</span>
                              {playlist.is_public ? (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  Public
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Private
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="playlist-name">Playlist Name</Label>
                <Input
                  id="playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="playlist-description">Description (Optional)</Label>
                <Textarea
                  id="playlist-description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="What's this playlist about?"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="playlist-public">Public Playlist</Label>
                <Switch
                  id="playlist-public"
                  checked={newPlaylistPublic}
                  onCheckedChange={setNewPlaylistPublic}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="flex-1"
                >
                  Create & Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
