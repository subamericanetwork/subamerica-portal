import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2, Search, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LivepushVideo {
  id: string;
  video_id: string;
  artist_id: string;
  livepush_id: string | null;
  livepush_url: string | null;
  sync_status: string;
  sync_error: string | null;
  approval_status: string;
  copyright_detected: boolean;
  created_at: string;
  videos: {
    title: string;
    video_url: string;
  };
  artists: {
    display_name: string;
    slug: string;
  };
}

const AdminVideos = () => {
  const [videos, setVideos] = useState<LivepushVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('livepush_videos')
        .select(`
          *,
          videos (title, video_url),
          artists (display_name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.videos?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.artists?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || video.sync_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { icon: Loader2, label: 'Pending', variant: 'secondary' as const },
      syncing: { icon: Loader2, label: 'Syncing', variant: 'secondary' as const },
      synced: { icon: CheckCircle, label: 'Synced', variant: 'default' as const },
      failed: { icon: XCircle, label: 'Failed', variant: 'destructive' as const },
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-2">
        <Icon className={`h-3 w-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Livepush Video Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage video syncs across all artists
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="syncing">Syncing</SelectItem>
              <SelectItem value="synced">Synced</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredVideos.map((video) => (
            <Card key={video.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{video.videos?.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      by {video.artists?.display_name}
                    </p>
                  </div>
                  {getStatusBadge(video.sync_status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Livepush ID:</span>{' '}
                      <span className="font-mono">{video.livepush_id || 'N/A'}</span>
                    </div>
                    {video.livepush_url && (
                      <a
                        href={video.livepush_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View in Livepush →
                      </a>
                    )}
                  </div>

                  {video.copyright_detected && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">
                        Copyright detected - requires review
                      </span>
                    </div>
                  )}

                  {video.sync_error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">
                        <strong>Error:</strong> {video.sync_error}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredVideos.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No videos found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminVideos;
