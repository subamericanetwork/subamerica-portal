import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StreamingCredentialsManager } from "./StreamingCredentialsManager";

interface StreamSetupFormProps {
  artistId: string;
  onSubmit: (config: {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    scheduledStart?: string;
    streamingMode: "own_account" | "subamerica_managed";
    provider?: "mux" | "livepush";
    showOnTv?: boolean;
    showOnWeb?: boolean;
  }) => void;
  loading: boolean;
}

export const StreamSetupForm = ({ artistId, onSubmit, loading }: StreamSetupFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [streamingMode, setStreamingMode] = useState<"own_account" | "subamerica_managed">("subamerica_managed");
  const [provider, setProvider] = useState<"mux" | "livepush">("mux");
  const [showOnTv, setShowOnTv] = useState(true);
  const [showOnWeb, setShowOnWeb] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    if (streamingMode === "subamerica_managed" && !scheduledDate) {
      return; // Scheduled time required for Subamerica Managed
    }
    if (streamingMode === "subamerica_managed" && !showOnTv && !showOnWeb) {
      return; // At least one distribution channel required
    }

    // Combine date and time
    let finalScheduledDate = scheduledDate;
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':');
      finalScheduledDate = new Date(scheduledDate);
      finalScheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledStart: finalScheduledDate?.toISOString(),
      streamingMode,
      provider: streamingMode === "subamerica_managed" ? provider : undefined,
      showOnTv: streamingMode === "subamerica_managed" ? showOnTv : undefined,
      showOnWeb: streamingMode === "subamerica_managed" ? showOnWeb : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Streaming Mode Selection */}
      <div className="space-y-3">
        <Label>Streaming Mode</Label>
        <RadioGroup value={streamingMode} onValueChange={(value: any) => setStreamingMode(value)}>
          <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/5">
            <RadioGroupItem value="own_account" id="own-account" disabled={loading} />
            <div className="grid gap-1.5 leading-none flex-1">
              <label
                htmlFor="own-account"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Use My Own Account
              </label>
              <p className="text-sm text-muted-foreground">
                Stream using your own Mux or Livepush credentials. No minute limits or restrictions.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/5">
            <RadioGroupItem value="subamerica_managed" id="subamerica-managed" disabled={loading} />
            <div className="grid gap-1.5 leading-none flex-1">
              <label
                htmlFor="subamerica-managed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Subamerica Managed
              </label>
              <p className="text-sm text-muted-foreground">
                Schedule a stream on Subamerica TV/Web. Requires Trident tier or admin access.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Own Account Credential Manager */}
      {streamingMode === "own_account" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Choose Provider</Label>
            <RadioGroup value={provider} onValueChange={(value: any) => setProvider(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mux" id="provider-mux" disabled={loading} />
                <label htmlFor="provider-mux" className="text-sm cursor-pointer">
                  Mux (Recommended)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="livepush" id="provider-livepush" disabled={loading} />
                <label htmlFor="provider-livepush" className="text-sm cursor-pointer">
                  Livepush
                </label>
              </div>
            </RadioGroup>
          </div>
          
          <StreamingCredentialsManager artistId={artistId} provider={provider} />
        </div>
      )}

      {/* Subamerica Managed Options */}
      {streamingMode === "subamerica_managed" && (
        <>
          <div className="space-y-3">
            <Label>Streaming Provider</Label>
            <RadioGroup value={provider} onValueChange={(value: any) => setProvider(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mux" id="managed-mux" disabled={loading} />
                <label htmlFor="managed-mux" className="text-sm cursor-pointer">
                  Mux (Recommended - Better Quality)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="livepush" id="managed-livepush" disabled={loading} />
                <label htmlFor="managed-livepush" className="text-sm cursor-pointer">
                  Livepush
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Distribution Channels</Label>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="show-on-tv"
                  checked={showOnTv}
                  onCheckedChange={(checked) => setShowOnTv(checked as boolean)}
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="show-on-tv"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Show on Subamerica TV
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Stream will appear on Roku, Apple TV, and Fire TV apps
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="show-on-web"
                  checked={showOnWeb}
                  onCheckedChange={(checked) => setShowOnWeb(checked as boolean)}
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="show-on-web"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Show on Subamerica Web
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Stream will appear on subamerica.net/live
                  </p>
                </div>
              </div>
              {!showOnTv && !showOnWeb && (
                <p className="text-sm text-amber-600">
                  ⚠️ Select at least one distribution channel or your stream won't be discoverable
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Stream Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your stream title"
          required
          disabled={loading}
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/100 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's your stream about?"
          disabled={loading}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          Scheduled Start {streamingMode === "subamerica_managed" && "*"}
        </Label>
        {streamingMode === "subamerica_managed" && (
          <p className="text-xs text-muted-foreground">
            Required for Subamerica Managed streams
          </p>
        )}
        
        {/* Start Now Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 15);
            setScheduledDate(now);
            setScheduledTime(format(now, "HH:mm"));
          }}
          disabled={loading}
        >
          <Zap className="mr-2 h-4 w-4" />
          Start Now (within 15 minutes)
        </Button>
        
        <p className="text-center text-xs text-muted-foreground">or</p>
        
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !scheduledDate && "text-muted-foreground"
              )}
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={(date) => {
                setScheduledDate(date);
                if (!scheduledTime) {
                  // Default to current time + 15 minutes
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + 15);
                  setScheduledTime(format(now, "HH:mm"));
                }
              }}
              disabled={(date) => {
                // Only disable dates before today (not including today)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {/* Time Input - shows when date is selected */}
        {scheduledDate && (
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        )}
        
        {scheduledDate && scheduledTime && (
          <p className="text-xs text-muted-foreground">
            Stream will start: {format(scheduledDate, "PPP")} at {scheduledTime}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={
          loading || 
          !title.trim() || 
          (streamingMode === "subamerica_managed" && !scheduledDate) ||
          (streamingMode === "subamerica_managed" && !showOnTv && !showOnWeb)
        }
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Stream...
          </>
        ) : (
          "Create Stream"
        )}
      </Button>
    </form>
  );
};
