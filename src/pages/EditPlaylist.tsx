import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlaylist } from '@/hooks/usePlaylist';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trash2, Loader2, Plus, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { MemberLayout } from '@/components/layout/MemberLayout';

interface ContentItem {
  id: string;
  title: string;
  content_type: 'video' | 'audio';
}

interface SortableContentItemProps {
  item: ContentItem;
  onRemove: (id: string) => void;
}

const SortableContentItem = ({ item, onRemove }: SortableContentItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex items-center gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{item.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {item.content_type === 'audio' ? 'Audio Track' : 'Video'}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

const EditPlaylist = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, loading: playlistsLoading, updatePlaylist, removeVideoFromPlaylist, removeAudioFromPlaylist, addVideoToPlaylist, addAudioToPlaylist } = usePlaylist();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoToRemove, setVideoToRemove] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [browseSheetOpen, setBrowseSheetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!id) {
        navigate('/member/playlists');
        return;
      }

      // Wait for playlists to finish loading
      if (playlistsLoading) {
        return;
      }

      // Now that playlists are loaded, check if our playlist exists
      const currentPlaylist = playlists.find(p => p.id === id);
      
      if (!currentPlaylist) {
        toast({
          title: "Error",
          description: "Playlist not found",
          variant: "destructive",
        });
        navigate('/member/playlists');
        return;
      }

      // Only initialize once
      if (initialized) return;
      setInitialized(true);

      // Set form data
      setName(currentPlaylist.name);
      setDescription(currentPlaylist.description || '');
      setIsPublic(currentPlaylist.is_public);

      // Fetch content details (videos and audio)
      const hasVideos = currentPlaylist.video_ids.length > 0;
      const hasAudio = currentPlaylist.audio_ids?.length > 0;

      if (hasVideos || hasAudio) {
        setContentLoading(true);
        try {
          const items: ContentItem[] = [];

          // Fetch videos
          if (hasVideos) {
            const { data: videosData, error: videosError } = await supabase
              .from('videos')
              .select('id, title')
              .in('id', currentPlaylist.video_ids);

            if (videosError) throw videosError;

            const orderedVideos = currentPlaylist.video_ids
              .map(videoId => videosData?.find(v => v.id === videoId))
              .filter(Boolean)
              .map(v => ({ ...v, content_type: 'video' as const }));

            items.push(...orderedVideos);
          }

          // Fetch audio tracks
          if (hasAudio) {
            const { data: audioData, error: audioError } = await supabase
              .from('audio_tracks')
              .select('id, title')
              .in('id', currentPlaylist.audio_ids);

            if (audioError) throw audioError;

            const orderedAudio = currentPlaylist.audio_ids
              .map(audioId => audioData?.find(a => a.id === audioId))
              .filter(Boolean)
              .map(a => ({ ...a, content_type: 'audio' as const }));

            items.push(...orderedAudio);
          }

          setContentItems(items);
        } catch (error) {
          console.error('Error fetching content:', error);
          toast({
            title: "Error",
            description: "Failed to load playlist content",
            variant: "destructive",
          });
        } finally {
          setContentLoading(false);
        }
      }
    };

    loadPlaylistData();
  }, [id, playlists, playlistsLoading, navigate, toast, initialized]);

  const handleSave = async () => {
    if (!id || !name.trim()) {
      toast({
        title: "Error",
        description: "Playlist name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updatePlaylist(id, {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });
      navigate('/member/playlists');
    } catch (error) {
      console.error('Error saving playlist:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveContent = async (itemId: string) => {
    if (!id) return;
    
    try {
      const item = contentItems.find(i => i.id === itemId);
      if (!item) return;

      if (item.content_type === 'video') {
        await removeVideoFromPlaylist(id, itemId);
      } else {
        await removeAudioFromPlaylist(id, itemId);
      }
      
      setContentItems(contentItems.filter(i => i.id !== itemId));
      setVideoToRemove(null);
    } catch (error) {
      console.error('Error removing content:', error);
    }
  };

  const handleAddContent = async (contentIds: string[]) => {
    if (!id) return;

    try {
      // Get current playlist data from database
      const { data: playlistData, error: playlistError } = await supabase
        .from('member_playlists')
        .select('video_ids, audio_ids')
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;

      const currentVideoIds = playlistData.video_ids || [];
      const currentAudioIds = playlistData.audio_ids || [];
      const totalCurrentItems = currentVideoIds.length + currentAudioIds.length;

      // Separate video and audio IDs by checking which table they exist in
      const videoIdsToCheck: string[] = [];
      const audioIdsToCheck: string[] = [];

      // Check videos table
      const { data: videosData } = await supabase
        .from('videos')
        .select('id')
        .in('id', contentIds);

      if (videosData) {
        videoIdsToCheck.push(...videosData.map(v => v.id));
      }

      // Check audio_tracks table
      const { data: audioData } = await supabase
        .from('audio_tracks')
        .select('id')
        .in('id', contentIds);

      if (audioData) {
        audioIdsToCheck.push(...audioData.map(a => a.id));
      }

      // Filter out items already in playlist
      const newVideoIds = videoIdsToCheck.filter(id => !currentVideoIds.includes(id));
      const newAudioIds = audioIdsToCheck.filter(id => !currentAudioIds.includes(id));
      const totalNewItems = newVideoIds.length + newAudioIds.length;

      if (totalNewItems === 0) {
        toast({
          title: "Already Added",
          description: "All selected items are already in the playlist",
          variant: "destructive",
        });
        return;
      }

      // Check if adding would exceed limit
      if (totalCurrentItems + totalNewItems > 100) {
        toast({
          title: "Playlist Full",
          description: `Can only add ${100 - totalCurrentItems} more items`,
          variant: "destructive",
        });
        return;
      }

      // Update database
      const updates: any = {};
      if (newVideoIds.length > 0) {
        updates.video_ids = [...currentVideoIds, ...newVideoIds];
      }
      if (newAudioIds.length > 0) {
        updates.audio_ids = [...currentAudioIds, ...newAudioIds];
      }

      const { error: updateError } = await supabase
        .from('member_playlists')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Fetch new content details
      const newItems: ContentItem[] = [];

      if (newVideoIds.length > 0) {
        const { data: newVideosData, error } = await supabase
          .from('videos')
          .select('id, title')
          .in('id', newVideoIds);

        if (error) throw error;
        if (newVideosData) {
          newItems.push(...newVideosData.map(v => ({ ...v, content_type: 'video' as const })));
        }
      }

      if (newAudioIds.length > 0) {
        const { data: newAudioData, error } = await supabase
          .from('audio_tracks')
          .select('id, title')
          .in('id', newAudioIds);

        if (error) throw error;
        if (newAudioData) {
          newItems.push(...newAudioData.map(a => ({ ...a, content_type: 'audio' as const })));
        }
      }

      // Add to local state
      setContentItems(prev => [...prev, ...newItems]);
      setBrowseSheetOpen(false);

      toast({
        title: "Success",
        description: `Added ${totalNewItems} item${totalNewItems > 1 ? 's' : ''} to playlist`,
      });
    } catch (error) {
      console.error('Error adding content:', error);
      toast({
        title: "Error",
        description: "Failed to add content",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = contentItems.findIndex((item) => item.id === active.id);
    const newIndex = contentItems.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(contentItems, oldIndex, newIndex);
    setContentItems(newItems);

    if (id) {
      try {
        // Separate by type and update both arrays
        const newVideoIds = newItems.filter(i => i.content_type === 'video').map(i => i.id);
        const newAudioIds = newItems.filter(i => i.content_type === 'audio').map(i => i.id);
        
        await updatePlaylist(id, {
          video_ids: newVideoIds,
          audio_ids: newAudioIds,
        });
        
        toast({
          title: "Order Updated",
          description: "Content order saved successfully",
        });
      } catch (error) {
        console.error('Error updating content order:', error);
        toast({
          title: "Error",
          description: "Failed to save content order",
          variant: "destructive",
        });
        setContentItems(contentItems);
      }
    }
  };

  // Show loading while playlists are being fetched
  if (playlistsLoading || !initialized) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/member/playlists')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Playlists
          </Button>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Edit Playlist</h1>
              <p className="text-muted-foreground mt-2">
                Update playlist details and manage videos
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Playlist Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter playlist name"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description (optional)"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public">Public Playlist</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this playlist visible to others
                    </p>
                  </div>
                  <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </div>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Content ({contentItems.length}/100)
                </h2>
                <Button
                  onClick={() => setBrowseSheetOpen(true)}
                  variant="outline"
                  size="sm"
                  disabled={contentItems.length >= 100}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Browse & Add
                </Button>
              </div>
              {contentItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No content in this playlist yet
                  </p>
                </Card>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={contentItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {contentItems.map((item) => (
                        <SortableContentItem
                          key={item.id}
                          item={item}
                          onRemove={setVideoToRemove}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/member/playlists')}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <AlertDialog open={!!videoToRemove} onOpenChange={() => setVideoToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Content</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this item from the playlist?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => videoToRemove && handleRemoveContent(videoToRemove)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Browse Catalog Sheet */}
        <Sheet open={browseSheetOpen} onOpenChange={setBrowseSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Browse Catalog</SheetTitle>
              <SheetDescription>
                Select content to add to your playlist ({contentItems.length}/100)
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <CatalogBrowser
                mode="selection"
                onSelect={handleAddContent}
                excludeVideoIds={contentItems.map(item => item.id)}
                multiSelect={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </MemberLayout>
  );
};

export default EditPlaylist;
