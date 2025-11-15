import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Clock, StopCircle, PlayCircle, AlertTriangle } from "lucide-react";
import { StreamStatusIndicator } from "./StreamStatusIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamControlsProps {
  streamId: string;
  status: 'waiting' | 'live' | 'ended';
  onEndStream: () => void;
  viewerCount?: number;
  isAdmin?: boolean;
  onStatusChange?: (newStatus: 'live' | 'ended') => void;
}

export const StreamControls = ({ 
  streamId, 
  status, 
  onEndStream,
  viewerCount = 0,
  isAdmin = false,
  onStatusChange
}: StreamControlsProps) => {
  const [duration, setDuration] = useState(0);
  const [startTime] = useState(Date.now());
  const [isForcing, setIsForcing] = useState(false);
  const isMobile = useIsMobile();

  const handleForceLive = async () => {
    setIsForcing(true);
    try {
      const { error } = await supabase
        .from('artist_live_streams')
        .update({ 
          status: 'live',
          started_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (error) throw error;

      toast.success("Stream manually set to LIVE");
      onStatusChange?.('live');
    } catch (error) {
      console.error('Error forcing live:', error);
      toast.error("Failed to force live status");
    } finally {
      setIsForcing(false);
    }
  };

  const handleForceEnd = async () => {
    setIsForcing(true);
    try {
      const { error } = await supabase
        .from('artist_live_streams')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (error) throw error;

      toast.success("Stream manually ended");
      onStatusChange?.('ended');
      onEndStream();
    } catch (error) {
      console.error('Error forcing end:', error);
      toast.error("Failed to force end status");
    } finally {
      setIsForcing(false);
    }
  };

  useEffect(() => {
    if (status !== 'live') return;

    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startTime]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Stream Controls</CardTitle>
          <StreamStatusIndicator status={status} />
        </div>
        <CardDescription className="text-sm sm:text-base">
          Stream ID: {streamId.slice(0, 8)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className={`flex items-center gap-3 ${isMobile ? 'p-4' : 'p-4'} bg-muted rounded-lg`}>
            <Users className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-muted-foreground`} />
            <div>
              <p className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold`}>{viewerCount}</p>
              <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>Viewers</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 ${isMobile ? 'p-4' : 'p-4'} bg-muted rounded-lg`}>
            <Clock className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-muted-foreground`} />
            <div>
              <p className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold`}>{formatDuration(duration)}</p>
              <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>Duration</p>
            </div>
          </div>
        </div>

        {status === 'waiting' && (
          <div className={`bg-yellow-500/10 border border-yellow-500/20 rounded-lg ${isMobile ? 'p-4' : 'p-4'}`}>
            <p className={`${isMobile ? 'text-base' : 'text-sm'} text-yellow-600 dark:text-yellow-400`}>
              Waiting for streaming software to connect...
            </p>
          </div>
        )}

        {status === 'live' && (
          <div className={`bg-red-500/10 border border-red-500/20 rounded-lg ${isMobile ? 'p-4' : 'p-4'}`}>
            <p className={`${isMobile ? 'text-base' : 'text-sm'} text-red-600 dark:text-red-400 font-medium`}>
              🔴 You are now LIVE!
            </p>
          </div>
        )}

        {isAdmin && status !== 'ended' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              Admin Override Controls
            </p>
            <div className="grid grid-cols-2 gap-2">
              {status === 'waiting' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForceLive}
                  disabled={isForcing}
                  className="gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Force Live
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceEnd}
                disabled={isForcing}
                className="gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Force End
              </Button>
            </div>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className={`w-full gap-2 ${isMobile ? 'min-h-[52px] text-base' : ''}`}
              disabled={status === 'ended'}
            >
              <StopCircle className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
              End Stream
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Stream?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end your live stream and disconnect all viewers. Your recording will be saved automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onEndStream} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                End Stream
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {status === 'live' && (
          <p className="text-xs text-muted-foreground text-center">
            Streaming minutes will be deducted when you end the stream
          </p>
        )}
      </CardContent>
    </Card>
  );
};
