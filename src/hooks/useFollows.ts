import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useFollows() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFollows();
    } else {
      setFollows(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFollows = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('artist_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFollows(new Set(data.map(follow => follow.artist_id)));
    } catch (error) {
      console.error('Error fetching follows:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = (artistId: string) => {
    return follows.has(artistId);
  };

  const toggleFollow = async (artistId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow artists",
        variant: "destructive",
      });
      return;
    }

    const isCurrentlyFollowing = follows.has(artistId);

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', artistId);

        if (error) throw error;

        setFollows(prev => {
          const newSet = new Set(prev);
          newSet.delete(artistId);
          return newSet;
        });

        toast({
          title: "Unfollowed",
          description: "You've unfollowed this artist",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            user_id: user.id,
            artist_id: artistId,
          });

        if (error) throw error;

        setFollows(prev => new Set(prev).add(artistId));

        toast({
          title: "Following",
          description: "You're now following this artist",
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const getFollowerCount = async (artistId: string) => {
    try {
      const { count, error } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching follower count:', error);
      return 0;
    }
  };

  const getFollowedArtists = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('artist_id, artists!user_follows_artist_id_fkey(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching followed artists:', error);
      return [];
    }
  };

  return {
    follows,
    loading,
    isFollowing,
    toggleFollow,
    getFollowerCount,
    getFollowedArtists,
  };
}
