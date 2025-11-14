import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Clock, StopCircle } from "lucide-react";
import { StreamStatusIndicator } from "./StreamStatusIndicator";

interface StreamControlsProps {
  streamId: string;
  status: 'waiting' | 'live' | 'ended';
  onEndStream: () => void;
  viewerCount?: number;
}

export const StreamControls = ({ 
  streamId, 
  status, 
  onEndStream,
  viewerCount = 0 
}: StreamControlsProps) => {
  const [duration, setDuration] = useState(0);
  const [startTime] = useState(Date.now());

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
          <CardTitle>Stream Controls</CardTitle>
          <StreamStatusIndicator status={status} />
        </div>
        <CardDescription>
          Stream ID: {streamId.slice(0, 8)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{viewerCount}</p>
              <p className="text-xs text-muted-foreground">Viewers</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{formatDuration(duration)}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </div>
        </div>

        {status === 'waiting' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Waiting for streaming software to connect...
            </p>
          </div>
        )}

        {status === 'live' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              🔴 You are now LIVE!
            </p>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full gap-2"
              disabled={status === 'ended'}
            >
              <StopCircle className="h-4 w-4" />
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
