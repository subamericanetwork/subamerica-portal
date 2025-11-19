import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Scene {
  name: string;
  count: number;
  emoji: string;
}

const getSceneEmoji = (sceneName: string): string => {
  const lower = sceneName.toLowerCase();
  if (lower.includes('hip hop') || lower.includes('rap')) return '🎤';
  if (lower.includes('rock') || lower.includes('indie')) return '🎸';
  if (lower.includes('electronic') || lower.includes('electronica')) return '🎹';
  if (lower.includes('r&b') || lower.includes('soul')) return '🎶';
  if (lower.includes('pop')) return '✨';
  if (lower.includes('jazz')) return '🎺';
  if (lower.includes('alternative')) return '🎵';
  if (lower.includes('psychedelic') || lower.includes('experimental')) return '🌀';
  if (lower.includes('spoken word') || lower.includes('poetry')) return '🗣️';
  if (lower.includes('visual') || lower.includes('art')) return '🎨';
  return '🎵'; // default
};

const normalizeScene = (scene: string): string => {
  return scene
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const useScenes = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenes = async () => {
      try {
        // Get published artists with their scenes
        const { data: portSettings } = await supabase
          .from('port_settings')
          .select('artist_id')
          .eq('publish_status', 'published');

        if (!portSettings || portSettings.length === 0) {
          setScenes([]);
          setLoading(false);
          return;
        }

        const artistIds = portSettings.map(ps => ps.artist_id);

        const { data: artists } = await supabase
          .from('artists')
          .select('scene')
          .in('id', artistIds)
          .not('scene', 'is', null);

        if (!artists) {
          setScenes([]);
          setLoading(false);
          return;
        }

        // Process scenes: split by comma, normalize, and count
        const sceneMap = new Map<string, number>();

        artists.forEach(artist => {
          if (artist.scene) {
            // Split by comma to handle multiple genres
            const individualScenes = artist.scene.split(',');
            
            individualScenes.forEach(scene => {
              const normalized = normalizeScene(scene);
              if (normalized) {
                sceneMap.set(normalized, (sceneMap.get(normalized) || 0) + 1);
              }
            });
          }
        });

        // Convert to array and sort by count (descending)
        const sceneArray = Array.from(sceneMap.entries())
          .map(([name, count]) => ({
            name,
            count,
            emoji: getSceneEmoji(name)
          }))
          .sort((a, b) => b.count - a.count);

        setScenes(sceneArray);
      } catch (error) {
        console.error('Error fetching scenes:', error);
        setScenes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScenes();
  }, []);

  return { scenes, loading };
};
