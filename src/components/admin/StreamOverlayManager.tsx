import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { StreamOverlayEditor } from "./StreamOverlayEditor";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Overlay {
  id: string;
  overlay_type: string;
  trigger_time_seconds: number;
  duration_seconds: number;
  position: string;
  platforms: string[];
}

interface StreamOverlayManagerProps {
  streamId: string;
}

export function StreamOverlayManager({ streamId }: StreamOverlayManagerProps) {
  const { toast } = useToast();
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | undefined>();

  useEffect(() => {
    fetchOverlays();
  }, [streamId]);

  const fetchOverlays = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stream_overlays')
      .select('*')
      .eq('stream_id', streamId)
      .order('trigger_time_seconds', { ascending: true });

    if (error) {
      console.error('Error fetching overlays:', error);
      toast({
        title: "Error",
        description: "Failed to load overlays",
        variant: "destructive"
      });
    } else {
      setOverlays(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (overlayId: string) => {
    if (!confirm('Are you sure you want to delete this overlay?')) return;

    const { error } = await supabase
      .from('stream_overlays')
      .delete()
      .eq('id', overlayId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Overlay deleted successfully"
      });
      fetchOverlays();
    }
  };

  const handleEdit = (overlayId: string) => {
    setSelectedOverlayId(overlayId);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedOverlayId(undefined);
    setEditorOpen(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      product: 'bg-green-500',
      content: 'bg-blue-500',
      cta: 'bg-purple-500',
      info: 'bg-yellow-500',
      qr: 'bg-pink-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stream Overlays</CardTitle>
              <CardDescription>
                Manage interactive overlays that appear during the stream
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Overlay
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading overlays...</p>
          ) : overlays.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No overlays configured yet</p>
              <Button variant="outline" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Overlay
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {overlays.map(overlay => (
                <div
                  key={overlay.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded ${getTypeColor(overlay.overlay_type)}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {overlay.overlay_type}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {overlay.position.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(overlay.trigger_time_seconds)}
                        </span>
                        <span>{overlay.duration_seconds}s duration</span>
                        <span>{overlay.platforms.length} platforms</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(overlay.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(overlay.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StreamOverlayEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setSelectedOverlayId(undefined);
        }}
        streamId={streamId}
        overlayId={selectedOverlayId}
        onSaved={fetchOverlays}
      />
    </>
  );
}