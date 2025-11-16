import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2, Radio, Calendar, Eye, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StreamSchedule {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  streaming_mode: string;
  provider: string;
  show_on_tv: boolean;
  show_on_web: boolean;
  approval_status: string;
  status: string;
  rtmp_ingest_url: string | null;
  stream_key: string | null;
  created_at: string;
  artists: {
    display_name: string;
    slug: string;
  };
}

const ApproveStreams = () => {
  const [streams, setStreams] = useState<StreamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [goingLive, setGoingLive] = useState<string | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; streamId: string | null }>({ 
    open: false, 
    streamId: null 
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStreams();

    const channel = supabase
      .channel('stream-schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artist_live_streams'
        },
        () => {
          fetchStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const fetchStreams = async () => {
    try {
      let query = supabase
        .from('artist_live_streams')
        .select(`
          *,
          artists!inner(display_name, slug)
        `)
        .eq('streaming_mode', 'subamerica_managed')
        .order('scheduled_start', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
      toast({
        title: "Error",
        description: "Failed to load stream schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (streamId: string) => {
    setProcessing(streamId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('artist_live_streams')
        .update({
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (error) throw error;

      toast({
        title: "Stream Approved",
        description: "The stream has been approved and will go live as scheduled",
      });

      fetchStreams();
    } catch (error) {
      console.error('Error approving stream:', error);
      toast({
        title: "Error",
        description: "Failed to approve stream",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog.streamId || !rejectionReason.trim()) return;

    setProcessing(rejectionDialog.streamId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('artist_live_streams')
        .update({
          approval_status: 'rejected',
          rejection_reason: rejectionReason,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', rejectionDialog.streamId);

      if (error) throw error;

      toast({
        title: "Stream Rejected",
        description: "The artist will be notified of the rejection",
      });

      setRejectionDialog({ open: false, streamId: null });
      setRejectionReason('');
      fetchStreams();
    } catch (error) {
      console.error('Error rejecting stream:', error);
      toast({
        title: "Error",
        description: "Failed to reject stream",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approve Streams</h1>
            <p className="text-muted-foreground">Review and approve scheduled streams</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Streams</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : streams.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No scheduled streams found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {streams.map((stream) => (
              <Card key={stream.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {stream.title}
                        <Badge variant={
                          stream.approval_status === 'approved' ? 'default' :
                          stream.approval_status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {stream.approval_status}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {stream.artists.display_name}
                      </p>
                    </div>
                    {stream.approval_status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(stream.id)}
                          disabled={processing === stream.id}
                        >
                          {processing === stream.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-1" /> Approve</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectionDialog({ open: true, streamId: stream.id })}
                          disabled={processing === stream.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 text-sm">
                    {stream.description && (
                      <p className="text-muted-foreground">{stream.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(stream.scheduled_start), 'PPp')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Radio className="h-4 w-4 text-muted-foreground" />
                        <span>{stream.streaming_mode}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={rejectionDialog.open} onOpenChange={(open) => setRejectionDialog({ open, streamId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Stream</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this stream. The artist will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialog({ open: false, streamId: null });
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing !== null}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject Stream'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ApproveStreams;
