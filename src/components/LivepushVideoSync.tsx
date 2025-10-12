import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLivepushSync } from '@/hooks/useLivepushSync';

interface LivepushVideoSyncProps {
  videoId: string;
  artistId: string;
  videoTitle: string;
}

export const LivepushVideoSync = ({ videoId, artistId, videoTitle }: LivepushVideoSyncProps) => {
  const { syncVideo, getSyncStatus, syncing } = useLivepushSync();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await getSyncStatus(videoId);
      setSyncStatus(status);
      setLoading(false);
    };
    checkStatus();
  }, [videoId]);

  const handleSync = async () => {
    try {
      await syncVideo(videoId, artistId);
      const newStatus = await getSyncStatus(videoId);
      setSyncStatus(newStatus);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking sync status...</span>
      </div>
    );
  }

  if (!syncStatus) {
    return (
      <Button
        onClick={handleSync}
        disabled={syncing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Sync to Livepush
          </>
        )}
      </Button>
    );
  }

  const statusConfig = {
    pending: { icon: Loader2, label: 'Pending', variant: 'secondary' as const, spinning: true },
    syncing: { icon: Loader2, label: 'Syncing...', variant: 'secondary' as const, spinning: true },
    synced: { icon: CheckCircle, label: 'Synced', variant: 'default' as const, spinning: false },
    failed: { icon: XCircle, label: 'Failed', variant: 'destructive' as const, spinning: false },
  };

  const config = statusConfig[syncStatus.sync_status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <Badge variant={config.variant} className="gap-2">
        <Icon className={`h-3 w-3 ${config.spinning ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
      
      {syncStatus.sync_status === 'synced' && syncStatus.livepush_url && (
        <a
          href={syncStatus.livepush_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          View in Livepush
        </a>
      )}
      
      {syncStatus.sync_status === 'failed' && (
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          Retry
        </Button>
      )}
    </div>
  );
};
