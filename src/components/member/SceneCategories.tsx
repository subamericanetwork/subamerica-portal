import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useScenes } from '@/hooks/useScenes';

export function SceneCategories() {
  const navigate = useNavigate();
  const { scenes, loading } = useScenes();

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Browse by Scene</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Browse by Scene</h2>
        <div className="text-center py-12 text-muted-foreground">
          No music scenes available yet. Check back soon!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Browse by Scene</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {scenes.map((scene) => (
          <Button
            key={scene.name}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 relative"
            onClick={() => navigate(`/browse?scene=${encodeURIComponent(scene.name)}`)}
          >
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 text-xs"
            >
              {scene.count}
            </Badge>
            <span className="text-3xl">{scene.emoji}</span>
            <span className="text-sm font-medium">{scene.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
