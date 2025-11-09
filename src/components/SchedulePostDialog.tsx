import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface SchedulePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subclipId: string;
  subclipUrl: string;
  defaultCaption: string;
  defaultHashtags: string[];
  artistId: string;
  onScheduled?: (postId: string) => void;
}

const SchedulePostDialog = ({
  open,
  onOpenChange,
  subclipId,
  subclipUrl,
  defaultCaption,
  defaultHashtags,
  artistId,
  onScheduled,
}: SchedulePostDialogProps) => {
  const [caption, setCaption] = useState(defaultCaption);
  const [hashtags, setHashtags] = useState<string[]>(defaultHashtags);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [schedulingOption, setSchedulingOption] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConnectedPlatforms();
  }, [artistId]);

  const fetchConnectedPlatforms = async () => {
    try {
      const { data } = await supabase
        .from('social_auth')
        .select('platform')
        .eq('artist_id', artistId)
        .eq('is_active', true);

      const platforms = data?.map(a => a.platform) || [];
      setConnectedPlatforms(platforms);
      setSelectedPlatforms(platforms);
    } catch (error) {
      console.error('Error fetching connected platforms:', error);
    }
  };

  const handleSchedule = async (publishNow: boolean) => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    if (!publishNow && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select a date and time');
      return;
    }

    setLoading(true);

    try {
      let scheduledAt;
      if (publishNow) {
        scheduledAt = new Date().toISOString();
      } else {
        const [hours, minutes] = scheduledTime.split(':');
        const dateTime = new Date(scheduledDate!);
        dateTime.setHours(parseInt(hours), parseInt(minutes));
        scheduledAt = dateTime.toISOString();

        if (new Date(scheduledAt) < new Date()) {
          toast.error('Scheduled time must be in the future');
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('social_scheduled_posts')
        .insert({
          artist_id: artistId,
          subclip_id: subclipId,
          platforms: selectedPlatforms,
          caption,
          hashtags,
          scheduled_at: scheduledAt,
          status: publishNow ? 'publishing' : 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      if (publishNow) {
        // Trigger immediate publishing
        for (const platform of selectedPlatforms) {
          const functionName = `publish-to-${platform}`;
          await supabase.functions.invoke(functionName, {
            body: {
              subclip_id: subclipId,
              scheduled_post_id: data.id,
              caption,
              hashtags,
            },
          });
        }
        toast.success('Publishing to social media...');
      } else {
        toast.success('Post scheduled successfully!');
      }

      onScheduled?.(data.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Scheduling error:', error);
      toast.error('Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  const platformConfig = {
    tiktok: { name: 'TikTok', icon: '🎵', limit: 2200 },
    instagram: { name: 'Instagram', icon: '📸', limit: 2200 },
    youtube: { name: 'YouTube', icon: '▶️', limit: 5000 },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Post to Social Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <video
              src={subclipUrl}
              controls
              className="w-full max-w-[300px] mx-auto rounded-lg"
              style={{ aspectRatio: '9/16' }}
            />
          </div>

          <div>
            <Label>Select Platforms</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const isConnected = connectedPlatforms.includes(platform);
                return (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }
                      }}
                      disabled={!isConnected}
                    />
                    <Label htmlFor={platform} className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      {config.name}
                      {!isConnected && <span className="text-xs text-muted-foreground">(not connected)</span>}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Caption</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
              className="mt-2 min-h-[100px]"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {caption.length} / {Math.min(...selectedPlatforms.map(p => platformConfig[p as keyof typeof platformConfig]?.limit || 5000))} characters
            </p>
          </div>

          <div>
            <Label>Hashtags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map((tag, i) => (
                <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label>When to publish</Label>
            <RadioGroup value={schedulingOption} onValueChange={(v) => setSchedulingOption(v as 'now' | 'later')} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now">Publish Now</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="later" id="later" />
                <Label htmlFor="later">Schedule for Later</Label>
              </div>
            </RadioGroup>
          </div>

          {schedulingOption === 'later' && (
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start mt-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Time</Label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSchedule(false)}
              disabled={loading || schedulingOption === 'now'}
              className="flex-1"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSchedule(schedulingOption === 'now')}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : schedulingOption === 'now' ? 'Publish Now' : 'Schedule Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchedulePostDialog;
