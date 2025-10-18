import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialStat {
  id: string;
  artist_id: string;
  platform: string;
  followers_count: number;
  profile_url?: string | null;
  metrics?: any;
  last_updated: string;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type SocialPlatform = 
  | 'youtube'
  | 'spotify'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'twitch'
  | 'linkedin'
  | 'twitter'
  | 'soundcloud'
  | 'bandcamp';

export const SOCIAL_PLATFORMS: Array<{
  key: SocialPlatform;
  label: string;
  icon: any;
  colorClass: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'number' | 'url' | 'decimal';
    required: boolean;
    metricsKey?: string;
  }>;
}> = [
  {
    key: 'youtube',
    label: 'YouTube',
    icon: 'Youtube',
    colorClass: 'text-red-500',
    fields: [
      { key: 'followers_count', label: 'Subscribers', type: 'number', required: true },
      { key: 'profile_url', label: 'Channel URL', type: 'url', required: false },
      { key: 'total_views', label: 'Total Views', type: 'number', required: false, metricsKey: 'total_views' },
      { key: 'video_count', label: 'Video Count', type: 'number', required: false, metricsKey: 'video_count' },
    ]
  },
  {
    key: 'spotify',
    label: 'Spotify',
    icon: 'Music',
    colorClass: 'text-green-500',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Artist URL', type: 'url', required: false },
      { key: 'monthly_listeners', label: 'Monthly Listeners', type: 'number', required: false, metricsKey: 'monthly_listeners' },
    ]
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'Instagram',
    colorClass: 'text-pink-500',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: false },
      { key: 'engagement_rate', label: 'Engagement Rate (%)', type: 'decimal', required: false, metricsKey: 'engagement_rate' },
      { key: 'posts_count', label: 'Posts Count', type: 'number', required: false, metricsKey: 'posts_count' },
    ]
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'Facebook',
    colorClass: 'text-blue-600',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Page URL', type: 'url', required: false },
      { key: 'page_likes', label: 'Page Likes', type: 'number', required: false, metricsKey: 'page_likes' },
    ]
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: 'Video',
    colorClass: 'text-slate-900',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: false },
      { key: 'total_likes', label: 'Total Likes', type: 'number', required: false, metricsKey: 'total_likes' },
      { key: 'total_views', label: 'Total Views', type: 'number', required: false, metricsKey: 'total_views' },
    ]
  },
  {
    key: 'twitch',
    label: 'Twitch',
    icon: 'Tv',
    colorClass: 'text-purple-500',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Channel URL', type: 'url', required: false },
      { key: 'total_views', label: 'Total Views', type: 'number', required: false, metricsKey: 'total_views' },
      { key: 'avg_viewers', label: 'Average Viewers', type: 'number', required: false, metricsKey: 'avg_viewers' },
    ]
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'Linkedin',
    colorClass: 'text-blue-700',
    fields: [
      { key: 'followers_count', label: 'Connections/Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: false },
    ]
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    icon: 'Twitter',
    colorClass: 'text-slate-900',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: false },
    ]
  },
  {
    key: 'soundcloud',
    label: 'SoundCloud',
    icon: 'CloudRain',
    colorClass: 'text-orange-500',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: false },
      { key: 'total_plays', label: 'Total Plays', type: 'number', required: false, metricsKey: 'total_plays' },
    ]
  },
  {
    key: 'bandcamp',
    label: 'Bandcamp',
    icon: 'Disc',
    colorClass: 'text-cyan-600',
    fields: [
      { key: 'followers_count', label: 'Followers', type: 'number', required: true },
      { key: 'profile_url', label: 'Profile URL', type: 'url', required: false },
    ]
  },
];

export const useSocialStats = (artistId?: string) => {
  const [stats, setStats] = useState<SocialStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }
    fetchStats();
  }, [artistId]);
  
  const fetchStats = async () => {
    if (!artistId) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('artist_social_stats')
      .select('*')
      .eq('artist_id', artistId)
      .order('followers_count', { ascending: false });
      
    setStats(data || []);
    setLoading(false);
  };
  
  const updateStat = async (
    platform: string, 
    followers_count: number,
    profile_url?: string,
    metrics?: { [key: string]: number | string }
  ) => {
    if (!artistId) return;
    
    const { data, error } = await supabase
      .from('artist_social_stats')
      .upsert({
        artist_id: artistId,
        platform,
        followers_count,
        profile_url,
        metrics: metrics || {},
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'artist_id,platform'
      })
      .select()
      .single();
      
    if (!error && data) {
      await fetchStats();
    }
    
    return { data, error };
  };
  
  const deleteStat = async (platform: string) => {
    if (!artistId) return;
    
    const { error } = await supabase
      .from('artist_social_stats')
      .delete()
      .eq('artist_id', artistId)
      .eq('platform', platform);
      
    if (!error) {
      await fetchStats();
    }
    
    return { error };
  };
  
  return { 
    stats, 
    loading, 
    updateStat, 
    deleteStat,
    refetch: fetchStats 
  };
};
