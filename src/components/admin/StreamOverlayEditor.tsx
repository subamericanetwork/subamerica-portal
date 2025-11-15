import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StreamOverlayEditorProps {
  open: boolean;
  onClose: () => void;
  streamId: string;
  overlayId?: string;
  onSaved: () => void;
}

export function StreamOverlayEditor({ open, onClose, streamId, overlayId, onSaved }: StreamOverlayEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [overlayType, setOverlayType] = useState<string>('product');
  const [triggerTime, setTriggerTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('15');
  const [position, setPosition] = useState<string>('bottom-right');
  const [contentData, setContentData] = useState<string>('{}');
  const [platforms, setPlatforms] = useState<string[]>(['web', 'roku', 'firetv', 'appletv', 'android-tv']);

  useEffect(() => {
    if (overlayId && open) {
      fetchOverlay();
    } else if (!open) {
      resetForm();
    }
  }, [overlayId, open]);

  const fetchOverlay = async () => {
    if (!overlayId) return;

    const { data, error } = await supabase
      .from('stream_overlays')
      .select('*')
      .eq('id', overlayId)
      .single();

    if (error) {
      console.error('Error fetching overlay:', error);
      return;
    }

    if (data) {
      setOverlayType(data.overlay_type);
      setTriggerTime(data.trigger_time_seconds.toString());
      setDuration(data.duration_seconds.toString());
      setPosition(data.position);
      setContentData(JSON.stringify(data.content_data, null, 2));
      setPlatforms(data.platforms || []);
    }
  };

  const resetForm = () => {
    setOverlayType('product');
    setTriggerTime('');
    setDuration('15');
    setPosition('bottom-right');
    setContentData('{}');
    setPlatforms(['web', 'roku', 'firetv', 'appletv', 'android-tv']);
  };

  const handleSave = async () => {
    if (!triggerTime) {
      toast({
        title: "Validation Error",
        description: "Trigger time is required",
        variant: "destructive"
      });
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(contentData);
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: "Content data must be valid JSON",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const overlayData = {
      stream_id: streamId,
      overlay_type: overlayType as 'product' | 'content' | 'cta' | 'info' | 'poll' | 'qr',
      trigger_time_seconds: parseInt(triggerTime),
      duration_seconds: parseInt(duration),
      position: position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'banner',
      content_data: parsedData,
      platforms
    };

    const { error } = overlayId
      ? await supabase.from('stream_overlays').update(overlayData).eq('id', overlayId)
      : await supabase.from('stream_overlays').insert(overlayData);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Overlay ${overlayId ? 'updated' : 'created'} successfully`
    });

    onSaved();
    onClose();
  };

  const platformOptions = [
    { value: 'web', label: 'Web' },
    { value: 'roku', label: 'Roku' },
    { value: 'firetv', label: 'Fire TV' },
    { value: 'appletv', label: 'Apple TV' },
    { value: 'android-tv', label: 'Android TV' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{overlayId ? 'Edit' : 'Create'} Stream Overlay</DialogTitle>
          <DialogDescription>
            Configure an interactive overlay to display during the stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Overlay Type</Label>
              <Select value={overlayType} onValueChange={setOverlayType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="cta">Call to Action</SelectItem>
                  <SelectItem value="info">Artist Info</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="banner">Banner (Full Width)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="triggerTime">Trigger Time (seconds)</Label>
              <Input
                id="triggerTime"
                type="number"
                value={triggerTime}
                onChange={(e) => setTriggerTime(e.target.value)}
                placeholder="120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Platforms</Label>
            <div className="grid grid-cols-2 gap-2">
              {platformOptions.map(platform => (
                <div key={platform.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.value}
                    checked={platforms.includes(platform.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPlatforms([...platforms, platform.value]);
                      } else {
                        setPlatforms(platforms.filter(p => p !== platform.value));
                      }
                    }}
                  />
                  <Label htmlFor={platform.value} className="font-normal cursor-pointer">
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentData">Content Data (JSON)</Label>
            <Textarea
              id="contentData"
              value={contentData}
              onChange={(e) => setContentData(e.target.value)}
              placeholder='{"title": "Example", "price": 29.99}'
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter JSON data specific to the overlay type
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : overlayId ? 'Update' : 'Create'} Overlay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}