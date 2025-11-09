import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, MessageSquare, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface QueueItem {
  id: string;
  curated: boolean;
  notes: string;
  created_at: string;
  social_scheduled_posts: {
    id: string;
    caption: string;
    platforms: string[];
    scheduled_at: string;
    status: string;
    hashtags: string[];
    subclip_library: {
      clip_url: string;
      thumbnail_url: string;
      duration: number;
      qr_type: string;
    };
    artists: {
      display_name: string;
      slug: string;
      email: string;
    };
  };
}

export default function ProducerQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [producerNotes, setProducerNotes] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('producer_queue')
        .select(`
          *,
          social_scheduled_posts!inner (
            id,
            caption,
            platforms,
            scheduled_at,
            status,
            hashtags,
            subclip_library (
              clip_url,
              thumbnail_url,
              duration,
              qr_type
            ),
            artists (
              display_name,
              slug,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('curated', false);
      } else if (filter === 'approved') {
        query = query.eq('curated', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQueue(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to load producer queue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: QueueItem) => {
    try {
      const { error: queueError } = await supabase
        .from('producer_queue')
        .update({ 
          curated: true,
          notes: producerNotes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', item.id);

      if (queueError) throw queueError;

      const { error: postError } = await supabase
        .from('social_scheduled_posts')
        .update({ status: 'scheduled' })
        .eq('id', item.social_scheduled_posts.id);

      if (postError) throw postError;

      toast({
        title: 'Approved',
        description: 'SubClip approved for publishing',
      });

      setSelectedItem(null);
      setProducerNotes('');
      fetchQueue();
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve SubClip',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (item: QueueItem) => {
    try {
      const { error: queueError } = await supabase
        .from('producer_queue')
        .update({ 
          notes: producerNotes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', item.id);

      if (queueError) throw queueError;

      const { error: postError } = await supabase
        .from('social_scheduled_posts')
        .update({ status: 'rejected' })
        .eq('id', item.social_scheduled_posts.id);

      if (postError) throw postError;

      toast({
        title: 'Rejected',
        description: 'SubClip rejected with notes',
      });

      setSelectedItem(null);
      setProducerNotes('');
      fetchQueue();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject SubClip',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Producer Queue</h1>
        <p className="text-muted-foreground mt-2">Review and approve artist SubClips before publishing</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {queue.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No items in queue</p>
            </CardContent>
          </Card>
        ) : (
          queue.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.social_scheduled_posts.subclip_library.thumbnail_url}
                      alt="SubClip"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {item.social_scheduled_posts.artists.display_name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.social_scheduled_posts.caption}
                        </p>
                      </div>
                      {item.curated ? (
                        <Badge variant="default">Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.social_scheduled_posts.platforms.map((platform) => (
                        <Badge key={platform} variant="outline">
                          {platform}
                        </Badge>
                      ))}
                      <Badge variant="outline">
                        {item.social_scheduled_posts.subclip_library.qr_type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Scheduled: {new Date(item.social_scheduled_posts.scheduled_at).toLocaleString()}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{item.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      {!item.curated && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedItem(item);
                              setProducerNotes('');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedItem(item);
                              setProducerNotes('');
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review SubClip</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="aspect-[9/16] max-h-[500px] rounded-lg overflow-hidden bg-black mx-auto">
                <video
                  src={selectedItem.social_scheduled_posts.subclip_library.clip_url}
                  controls
                  className="w-full h-full"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Caption</h4>
                  <p className="text-sm">{selectedItem.social_scheduled_posts.caption}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.social_scheduled_posts.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary">#{tag}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Production Notes</h4>
                  <Textarea
                    value={producerNotes}
                    onChange={(e) => setProducerNotes(e.target.value)}
                    placeholder="Add notes for the artist..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(selectedItem)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleReject(selectedItem)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
