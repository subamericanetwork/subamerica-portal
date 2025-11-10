import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubClipGeneratorProps {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  artistId: string;
  artistSlug: string;
  onClipGenerated?: (subclip: any) => void;
  onClose: () => void;
}

export const SubClipGenerator = ({
  videoId,
  videoUrl,
  videoTitle,
  artistId,
  artistSlug,
  onClipGenerated,
  onClose
}: SubClipGeneratorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [qrType, setQrType] = useState<'none' | 'tip' | 'ticket' | 'content' | 'merch'>('none');
  const [autoCaption, setAutoCaption] = useState(true);
  const [manualCaption, setManualCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedClip, setGeneratedClip] = useState<any>(null);
  const [qrPreview, setQrPreview] = useState('');
  const [orientation, setOrientation] = useState<'vertical' | 'landscape'>('vertical');
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [videoMounted, setVideoMounted] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      console.log('[SubClipGenerator] Video ref not available yet');
      return;
    }
    
    console.log('[SubClipGenerator] Setting up video metadata detection');
    console.log('[SubClipGenerator] Video URL:', videoUrl);
    console.log('[SubClipGenerator] Initial readyState:', video.readyState);
    console.log('[SubClipGenerator] Initial duration:', video.duration);
    
    // Force the video to start loading
    video.load();

    let cleanedUp = false;
    let pollInterval: number | undefined;

  const handleLoadedMetadata = () => {
    if (cleanedUp) return;
    const duration = video.duration;
    
    // Only proceed if duration is a valid number (not NaN, not Infinity, > 0)
    if (!duration || isNaN(duration) || !isFinite(duration) || duration <= 0) {
      console.log('[SubClipGenerator] Duration not ready yet:', duration);
      return; // Don't cleanup, let polling continue
    }
    
    const floorDuration = Math.floor(duration);
    console.log('[SubClipGenerator] Valid video duration loaded:', floorDuration);
    setVideoDuration(floorDuration);
    setEndTime(Math.min(30, floorDuration));
    setVideoLoading(false);
    cleanup();
  };

    const handleError = () => {
      if (cleanedUp) return;
      console.error('[SubClipGenerator] Video failed to load');
      setVideoError(true);
      setVideoLoading(false);
      cleanup();
    };

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };

  // Strategy 1: Check if metadata is already loaded
  if (video.readyState >= 1 && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
    console.log('[SubClipGenerator] Metadata already loaded (readyState: ' + video.readyState + ', duration: ' + video.duration + ')');
    handleLoadedMetadata();
  }

    // Strategy 2: Event listeners (always set up)
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    
    // Strategy 3: Polling fallback - check every 300ms for up to 5 seconds
    let pollCount = 0;
    pollInterval = window.setInterval(() => {
      if (cleanedUp) return;
      
      pollCount++;
      
      console.log(`[SubClipGenerator] Poll #${pollCount}: readyState=${video.readyState}, duration=${video.duration}`);
      
    if (video.readyState >= 1 && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      console.log('[SubClipGenerator] Metadata detected via polling (readyState: ' + video.readyState + ', duration: ' + video.duration + ')');
      handleLoadedMetadata();
      } else if (pollCount > 16) { // 16 * 300ms = ~5 seconds
        console.error('[SubClipGenerator] Metadata loading timed out after 5s');
        console.error('[SubClipGenerator] Final state: readyState=' + video.readyState + ', duration=' + video.duration);
        handleError();
      }
    }, 300);

    // Cleanup on unmount
    return cleanup;
  }, [videoUrl, videoMounted]);

  useEffect(() => {
    // Generate QR preview - only if QR type is not 'none'
    if (qrType === 'none') {
      setQrPreview('');
      return;
    }
    
    const qrUrls: Record<string, string> = {
      none: '',
      tip: `https://subamerica.net/${artistSlug}?action=tip`,
      ticket: `https://subamerica.net/${artistSlug}?action=tickets`,
      content: `https://subamerica.net/${artistSlug}?action=subscribe`,
      merch: `https://subamerica.net/${artistSlug}/merch`,
    };
    
    // Use a simple data URL for preview
    setQrPreview(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrls[qrType])}`);
  }, [qrType, artistSlug]);

  const duration = endTime - startTime;

  const generateClip = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('create-subclip', {
        body: {
          video_id: videoId,
          start_time: startTime,
          end_time: endTime,
          qr_type: qrType,
          caption: autoCaption ? undefined : manualCaption,
          auto_caption: autoCaption,
          orientation: orientation
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('SubClip generation error:', error);
        toast.error(`Failed to generate SubClip: ${error.message}`);
      } else if (data.error) {
        toast.error(`Failed to generate SubClip: ${data.error}`);
      } else {
        console.log('[SubClipGenerator] SubClip generated:', data);
        setGeneratedClip(data);
        setEditedCaption(data.caption || ''); // Initialize edited caption
        setPreviewLoading(true);
        toast.success('SubClip generated! Review and save to library.');
        // Note: onClipGenerated is NOT called here - only when saving to library
      }
    } catch (err) {
      console.error('SubClip generation exception:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const saveToLibrary = async () => {
    if (!generatedClip) return;
    
    setIsSaving(true);
    try {
      // Update the subclip to set is_draft=false and update caption
      const { error } = await supabase
        .from('subclip_library')
        .update({
          is_draft: false,
          caption: editedCaption
        })
        .eq('id', generatedClip.id);

      if (error) throw error;

      toast.success('SubClip saved to library!');
      onClipGenerated?.(generatedClip);
      onClose();
    } catch (error) {
      console.error('Error saving to library:', error);
      toast.error('Failed to save to library');
    } finally {
      setIsSaving(false);
    }
  };

  const regenerate = () => {
    setGeneratedClip(null);
    setEditedCaption('');
    setIsEditing(false);
    setProgress(0);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create SubClip from "{videoTitle}"</DialogTitle>
          <DialogDescription>
            Generate a {orientation === 'vertical' ? 'vertical 9:16' : 'landscape 16:9'} clip for social media platforms
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Timeline & Controls */}
          <div className="space-y-4">
            <Card className="p-4">
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && !videoMounted) setVideoMounted(true);
                }}
                src={videoUrl}
                controls
                className="w-full rounded-md"
                crossOrigin="anonymous"
                preload="metadata"
              />
              <div className="mt-4 space-y-2">
                {videoLoading ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading video metadata...
                  </div>
                ) : videoError ? (
                  <div className="text-sm text-destructive">
                    Failed to load video. Please try again.
                  </div>
                ) : (
                  <>
                    <Label>Clip Range: {startTime}s - {endTime}s ({duration}s)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="w-16">Start:</Label>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(videoDuration, 1)}
                          value={startTime}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setStartTime(val);
                            if (val >= endTime) {
                              setEndTime(Math.min(val + 30, videoDuration));
                            }
                          }}
                          className="flex-1"
                          disabled={videoDuration === 0}
                        />
                        <span className="w-12 text-sm">{startTime}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-16">End:</Label>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(videoDuration, 1)}
                          value={endTime}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEndTime(val);
                            if (val <= startTime) {
                              setStartTime(Math.max(0, val - 30));
                            }
                          }}
                          className="flex-1"
                          disabled={videoDuration === 0}
                        />
                        <span className="w-12 text-sm">{endTime}s</span>
                      </div>
                    </div>
                    {duration < 3 && (
                      <p className="text-sm text-destructive">Minimum duration is 3 seconds</p>
                    )}
                    {duration > 60 && (
                      <p className="text-sm text-destructive">Maximum duration is 60 seconds</p>
                    )}
                  </>
                )}
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <div>
                <Label>QR Code Action</Label>
                <RadioGroup value={qrType} onValueChange={(val) => setQrType(val as any)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="cursor-pointer">None - No QR code</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tip" id="tip" />
                    <Label htmlFor="tip" className="cursor-pointer">Tip Jar 💰 - Get tipped by viewers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ticket" id="ticket" />
                    <Label htmlFor="ticket" className="cursor-pointer">Event Tickets 🎟️ - Promote your next show</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="content" id="content" />
                    <Label htmlFor="content" className="cursor-pointer">Subscribe ⭐ - Grow your subscriber base</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="merch" id="merch" />
                    <Label htmlFor="merch" className="cursor-pointer">Merch Store 👕 - Drive merch sales</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Video Orientation</Label>
                <RadioGroup value={orientation} onValueChange={(val) => setOrientation(val as any)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vertical" id="vertical" />
                    <Label htmlFor="vertical" className="cursor-pointer">
                      Vertical (9:16) 📱 - TikTok, Instagram Reels, YouTube Shorts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape" className="cursor-pointer">
                      Landscape (16:9) 🖥️ - YouTube, Facebook, Twitter
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {qrType !== 'none' && qrPreview && (
                <div className="flex justify-center">
                  <img src={qrPreview} alt="QR Preview" className="w-32 h-32 border rounded" />
                </div>
              )}
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-generate post description with AI</Label>
                <Switch checked={autoCaption} onCheckedChange={setAutoCaption} />
              </div>
              {!autoCaption && (
                <div className="space-y-2">
                  <Label>Post Description</Label>
                  <Textarea
                    value={manualCaption}
                    onChange={(e) => setManualCaption(e.target.value)}
                    maxLength={2200}
                    placeholder="Write your post description..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">{manualCaption.length}/2200 characters</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <Card className={`${orientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-[16/9]'} bg-black flex items-center justify-center overflow-hidden relative`}>
              {generatedClip ? (
                <>
                  {previewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  {previewError ? (
                    <div className="text-center p-6">
                      <p className="text-destructive mb-2">Failed to load preview</p>
                      <a 
                        href={generatedClip.clip_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline text-sm"
                      >
                        Open video in new tab
                      </a>
                    </div>
                  ) : (
                    <video 
                      src={generatedClip.clip_url} 
                      controls 
                      className="h-full w-full object-contain"
                      onLoadedMetadata={() => {
                        console.log('[SubClipGenerator] Preview video loaded');
                        setPreviewLoading(false);
                      }}
                      onError={(e) => {
                        console.error('[SubClipGenerator] Preview video error:', e);
                        setPreviewError(true);
                        setPreviewLoading(false);
                        toast.error('Preview failed to load. Video saved to library.');
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">Preview will appear here after generation</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your {orientation === 'vertical' ? '9:16 vertical' : '16:9 landscape'} clip will have a QR code in the bottom-right corner
                  </p>
                </div>
              )}
            </Card>

            {generatedClip && (
              <Card className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Post Description</h4>
                    {!isEditing ? (
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setIsEditing(false);
                          setEditedCaption(generatedClip.caption);
                        }}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => setIsEditing(false)}>
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <Textarea
                      value={editedCaption}
                      onChange={(e) => setEditedCaption(e.target.value)}
                      maxLength={2200}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-sm">{editedCaption}</p>
                  )}
                </div>
                {generatedClip.hashtags && generatedClip.hashtags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Hashtags</h4>
                    <div className="flex flex-wrap gap-1">
                      {generatedClip.hashtags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Duration: {generatedClip.duration}s
                </div>
              </Card>
            )}

            {generating && (
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {progress < 30 && 'Extracting clip segment...'}
                    {progress >= 30 && progress < 60 && 'Converting to vertical format...'}
                    {progress >= 60 && progress < 80 && 'Adding QR overlay...'}
                    {progress >= 80 && progress < 95 && 'Generating AI caption...'}
                    {progress >= 95 && 'Uploading to library...'}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          {!generatedClip ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={generating}>
                Close
              </Button>
              <Button
                onClick={generateClip}
                disabled={generating || duration < 3 || duration > 60}
                className="min-w-[200px]"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating... {progress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate SubClip
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={regenerate}>
                Regenerate
              </Button>
              <Button onClick={saveToLibrary} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save to Library'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};