import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const scenes = [
  { name: 'Hip Hop', emoji: '🎤' },
  { name: 'Indie Rock', emoji: '🎸' },
  { name: 'Electronic', emoji: '🎹' },
  { name: 'R&B', emoji: '🎶' },
  { name: 'Pop', emoji: '✨' },
  { name: 'Jazz', emoji: '🎺' },
];

export function SceneCategories() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Browse by Scene</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {scenes.map((scene) => (
          <Button
            key={scene.name}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10"
            onClick={() => navigate(`/browse?scene=${encodeURIComponent(scene.name)}`)}
          >
            <span className="text-3xl">{scene.emoji}</span>
            <span className="text-sm font-medium">{scene.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
