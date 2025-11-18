import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useLikes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLikes();
    } else {
      setLikes(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchLikes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('content_id, content_type')
        .eq('user_id', user.id);

      if (error) throw error;

      const likeSet = new Set(data.map(like => `${like.content_type}:${like.content_id}`));
      setLikes(likeSet);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLiked = (contentId: string, contentType: 'video' | 'audio' | 'playlist') => {
    return likes.has(`${contentType}:${contentId}`);
  };

  const toggleLike = async (contentId: string, contentType: 'video' | 'audio' | 'playlist') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like content",
        variant: "destructive",
      });
      return;
    }

    const likeKey = `${contentType}:${contentId}`;
    const isCurrentlyLiked = likes.has(likeKey);

    try {
      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId)
          .eq('content_type', contentType);

        if (error) throw error;

        setLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(likeKey);
          return newSet;
        });
      } else {
        // Like
        const { error } = await supabase
          .from('user_likes')
          .insert({
            user_id: user.id,
            content_id: contentId,
            content_type: contentType,
          });

        if (error) throw error;

        setLikes(prev => new Set(prev).add(likeKey));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const getLikedContent = async (contentType?: 'video' | 'audio' | 'playlist') => {
    if (!user) return [];

    try {
      let query = supabase
        .from('user_likes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching liked content:', error);
      return [];
    }
  };

  return {
    likes,
    loading,
    isLiked,
    toggleLike,
    getLikedContent,
  };
}
