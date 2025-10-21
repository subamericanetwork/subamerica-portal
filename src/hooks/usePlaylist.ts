import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  video_ids: string[];
  content_type: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const usePlaylist = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('member_playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (name: string, description?: string, isPublic: boolean = false, initialVideoId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('member_playlists')
        .insert({
          user_id: user.id,
          name,
          description,
          is_public: isPublic,
          video_ids: initialVideoId ? [initialVideoId] : [],
          content_type: 'mixed',
        })
        .select()
        .single();

      if (error) throw error;

      setPlaylists([data, ...playlists]);
      
      const successMessage = initialVideoId 
        ? `"${name}" created and video added`
        : `"${name}" has been created`;
      
      toast({
        title: "Playlist Created",
        description: successMessage,
      });

      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addVideoToPlaylist = async (playlistId: string, videoId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');

      // Check if video already exists
      if (playlist.video_ids.includes(videoId)) {
        toast({
          title: "Already Added",
          description: "This video is already in the playlist",
          variant: "destructive",
        });
        return;
      }

      // Check max limit (100 videos)
      if (playlist.video_ids.length >= 100) {
        toast({
          title: "Playlist Full",
          description: "Maximum 100 videos per playlist",
          variant: "destructive",
        });
        return;
      }

      const updatedVideoIds = [...playlist.video_ids, videoId];

      const { error } = await supabase
        .from('member_playlists')
        .update({ video_ids: updatedVideoIds })
        .eq('id', playlistId);

      if (error) throw error;

      // Update local state
      setPlaylists(playlists.map(p => 
        p.id === playlistId ? { ...p, video_ids: updatedVideoIds } : p
      ));

      toast({
        title: "Added to Playlist",
        description: `Added to "${playlist.name}"`,
      });
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add video to playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeVideoFromPlaylist = async (playlistId: string, videoId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');

      const updatedVideoIds = playlist.video_ids.filter(id => id !== videoId);

      const { error } = await supabase
        .from('member_playlists')
        .update({ video_ids: updatedVideoIds })
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylists(playlists.map(p => 
        p.id === playlistId ? { ...p, video_ids: updatedVideoIds } : p
      ));

      toast({
        title: "Removed",
        description: "Video removed from playlist",
      });
    } catch (error) {
      console.error('Error removing video from playlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove video",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePlaylist = async (playlistId: string, updates: Partial<Playlist>) => {
    try {
      const { error } = await supabase
        .from('member_playlists')
        .update(updates)
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylists(playlists.map(p => 
        p.id === playlistId ? { ...p, ...updates } : p
      ));

      toast({
        title: "Updated",
        description: "Playlist updated successfully",
      });
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('member_playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylists(playlists.filter(p => p.id !== playlistId));

      toast({
        title: "Deleted",
        description: "Playlist deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  return {
    playlists,
    loading,
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,
    refreshPlaylists: fetchPlaylists,
  };
};
