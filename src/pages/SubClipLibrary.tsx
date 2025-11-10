import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Play, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import SchedulePostDialog from '@/components/SchedulePostDialog';

interface SubClip {
  id: string;
  clip_url: string;
  thumbnail_url: string;
  caption: string;
  hashtags?: string[];
  duration: number;
  qr_type: string;
  created_at: string;
  videos: {
    title: string;
  };
}

export default function SubClipLibrary() {
  const { user } = useAuth();
  const [subclips, setSubclips] = useState<SubClip[]>([]);
  const [filteredSubclips, setFilteredSubclips] = useState<SubClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClip, setSelectedClip] = useState<SubClip | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrTypeFilter, setQrTypeFilter] = useState<string>('all');
  const [artistId, setArtistId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubClips();
  }, [user]);

  useEffect(() => {
    filterSubClips();
  }, [searchQuery, qrTypeFilter, subclips]);

  const fetchSubClips = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!artist) return;

      setArtistId(artist.id);

      const { data, error } = await supabase
        .from('subclip_library')
        .select(`
          *,
          videos (title)
        `)
        .eq('artist_id', artist.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubclips(data || []);
    } catch (error) {
      console.error('Error fetching SubClips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SubClip library',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubClips = () => {
    let filtered = [...subclips];

    if (searchQuery) {
      filtered = filtered.filter(clip =>
        clip.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clip.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (qrTypeFilter !== 'all') {
      filtered = filtered.filter(clip => clip.qr_type === qrTypeFilter);
    }

    setFilteredSubclips(filtered);
  };

  const handleDelete = async (clipId: string) => {
    if (!confirm('Are you sure you want to delete this SubClip?')) return;

    try {
      const { error } = await supabase
        .from('subclip_library')
        .delete()
        .eq('id', clipId);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'SubClip deleted successfully',
      });

      fetchSubClips();
    } catch (error) {
      console.error('Error deleting SubClip:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete SubClip',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (url: string, caption: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caption.substring(0, 30)}.mp4`;
    a.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">SubClip Library</h1>
        <p className="text-muted-foreground mt-2">Manage your social media content</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by caption or hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={qrTypeFilter} onValueChange={setQrTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by QR type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="tip">Tip</SelectItem>
            <SelectItem value="ticket">Ticket</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="merch">Merch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSubclips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || qrTypeFilter !== 'all' 
                ? 'No SubClips match your filters' 
                : 'No SubClips yet. Create your first SubClip to get started!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubclips.map((clip) => (
            <Card key={clip.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[9/16] bg-muted group">
                  <img
                    src={clip.thumbnail_url}
                    alt={clip.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setSelectedClip(clip)}
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  <Badge className="absolute top-2 right-2">
                    {clip.qr_type}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-sm font-medium line-clamp-2">{clip.caption}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {clip.hashtags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {clip.hashtags?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{clip.hashtags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedClip(clip);
                        setScheduleDialogOpen(true);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(clip.clip_url, clip.caption)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(clip.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedClip && !scheduleDialogOpen} onOpenChange={(open) => !open && setSelectedClip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>SubClip Preview</DialogTitle>
          </DialogHeader>
          {selectedClip && (
            <div className="space-y-4">
              <div className="aspect-[9/16] max-h-[500px] rounded-lg overflow-hidden bg-black mx-auto">
                <video src={selectedClip.clip_url} controls className="w-full h-full" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Post Description</h4>
                <p className="text-sm">{selectedClip.caption}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClip.hashtags?.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedClip && artistId && (
        <SchedulePostDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          subclipId={selectedClip.id}
          subclipUrl={selectedClip.clip_url}
          defaultCaption={selectedClip.caption}
          defaultHashtags={selectedClip.hashtags}
          artistId={artistId}
          onScheduled={() => {
            setScheduleDialogOpen(false);
            setSelectedClip(null);
            toast({
              title: 'Scheduled',
              description: 'SubClip scheduled for publishing',
            });
          }}
        />
      )}
    </div>
  );
}
