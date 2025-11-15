import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2, Radio, Calendar, Eye } from 'lucide-react';
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
  created_at: string;
  artists: {
    display_name: string;
    slug: string;
  };
}

const AdminStreamSchedule = () => {
  const [streams, setStreams] = useState<StreamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; streamId: string | null }>({ 
    open: false, 
    streamId: null 
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStreams();

    // Set up realtime subscription
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
        description: "Stream has been approved and will appear on scheduled channels",
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
    if (!rejectionDialog.streamId || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessing(rejectionDialog.streamId);
    try {
      const { error } = await supabase
        .from('artist_live_streams')
        .update({
          approval_status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', rejectionDialog.streamId);

      if (error) throw error;

      toast({
        title: "Stream Rejected",
        description: "Artist has been notified of the rejection",
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      auto_approved: { variant: "secondary", label: "Auto-Approved" }
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stream Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Manage and approve scheduled live streams
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">{streams.length} Streams</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter Streams</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="auto_approved">Auto-Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4">
          {streams.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No {statusFilter !== 'all' ? statusFilter : ''} streams found
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            streams.map((stream) => (
              <Card key={stream.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{stream.title}</CardTitle>
                        {getStatusBadge(stream.approval_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Artist: {stream.artists.display_name}</span>
                        <span>•</span>
                        <span>Provider: {stream.provider.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {stream.show_on_tv && (
                        <Badge variant="secondary">
                          <Eye className="h-3 w-3 mr-1" />
                          TV
                        </Badge>
                      )}
                      {stream.show_on_web && (
                        <Badge variant="secondary">
                          <Eye className="h-3 w-3 mr-1" />
                          Web
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stream.description && (
                    <p className="text-sm text-muted-foreground">{stream.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Scheduled Start</p>
                      <p className="text-lg font-bold">
                        {format(new Date(stream.scheduled_start), 'PPP p')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(stream.scheduled_start), { addSuffix: true })}
                      </p>
                    </div>
                    
                    {stream.approval_status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(stream.id)}
                          disabled={processing === stream.id}
                        >
                          {processing === stream.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRejectionDialog({ open: true, streamId: stream.id })}
                          disabled={processing === stream.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={rejectionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRejectionDialog({ open: false, streamId: null });
          setRejectionReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Stream</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this stream. The artist will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-24"
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
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminStreamSchedule;
