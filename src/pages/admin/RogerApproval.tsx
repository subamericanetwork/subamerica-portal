import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, ArrowLeft, ExternalLink } from "lucide-react";

interface VerificationRequest {
  id: string;
  artist_id: string;
  requested_at: string;
  status: string;
  notes: string;
  verification_method: string;
  verified_platforms: string[];
  admin_reviewed_by: string;
  admin_reviewed_at: string;
  admin_review_notes: string;
  verification_evidence: any;
  artists: {
    display_name: string;
    email: string;
    slug: string;
  };
}

export default function RogerApproval() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [finalReviewNotes, setFinalReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_verification_requests')
        .select(`
          *,
          artists (
            display_name,
            email,
            slug
          )
        `)
        .eq('status', 'admin_approved')
        .order('admin_reviewed_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantVerification = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update artist to verified
      const { error: artistError } = await supabase
        .from('artists')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', selectedRequest.artist_id);

      if (artistError) throw artistError;

      // Update verification request
      const { error: requestError } = await supabase
        .from('artist_verification_requests')
        .update({
          status: 'approved',
          final_reviewed_at: new Date().toISOString(),
          final_reviewed_by: user?.id,
          final_review_notes: finalReviewNotes
        })
        .eq('id', selectedRequest.id);

      if (requestError) throw requestError;

      toast({
        title: "Success",
        description: `${selectedRequest.artists.display_name} has been verified!`,
      });

      setSelectedRequest(null);
      setFinalReviewNotes("");
      fetchRequests();
    } catch (error) {
      console.error('Error granting verification:', error);
      toast({
        title: "Error",
        description: "Failed to grant verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSendBack = async () => {
    if (!selectedRequest || !finalReviewNotes) {
      toast({
        title: "Error",
        description: "Please provide notes explaining what needs revision",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('artist_verification_requests')
        .update({
          status: 'needs_revision',
          final_reviewed_at: new Date().toISOString(),
          final_reviewed_by: user?.id,
          final_review_notes: finalReviewNotes
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Request Sent Back",
        description: "Artist will be notified of required revisions",
      });

      setSelectedRequest(null);
      setFinalReviewNotes("");
      fetchRequests();
    } catch (error) {
      console.error('Error sending back request:', error);
      toast({
        title: "Error",
        description: "Failed to send back request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !finalReviewNotes) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('artist_verification_requests')
        .update({
          status: 'rejected',
          final_reviewed_at: new Date().toISOString(),
          final_reviewed_by: user?.id,
          rejection_reason: finalReviewNotes
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "Artist will be notified",
      });

      setSelectedRequest(null);
      setFinalReviewNotes("");
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getMethodBadge = (method: string) => {
    if (method === 'platform_verified') {
      return <Badge variant="default">Platform Badge</Badge>;
    }
    return <Badge variant="outline">Follower Threshold</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Final Verification Approval</h1>
        <p className="text-muted-foreground">
          Review requests that have been approved by admins and make the final decision
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No pending requests for final approval</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Admin Reviewed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.artists.display_name}
                  </TableCell>
                  <TableCell>{request.artists.email}</TableCell>
                  <TableCell>{getMethodBadge(request.verification_method)}</TableCell>
                  <TableCell>
                    {new Date(request.admin_reviewed_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setFinalReviewNotes("");
                      }}
                      size="sm"
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Final Verification Review</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Artist Name</Label>
                  <p className="font-medium">{selectedRequest.artists.display_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedRequest.artists.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Verification Method</Label>
                  <div className="mt-1">{getMethodBadge(selectedRequest.verification_method)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Profile Link</Label>
                  <a
                    href={`https://port.subamerica.net/${selectedRequest.artists.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View Port <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {selectedRequest.verification_method === 'platform_verified' && (
                <div>
                  <Label className="text-muted-foreground">Verified Platforms</Label>
                  <div className="flex gap-2 mt-2">
                    {selectedRequest.verified_platforms?.map(platform => (
                      <Badge key={platform} variant="secondary" className="capitalize">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.verification_evidence?.social_stats && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Social Media Stats</Label>
                  <div className="space-y-2">
                    {selectedRequest.verification_evidence.social_stats.map((stat: any) => (
                      <div key={stat.platform} className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="capitalize font-medium">{stat.platform}</span>
                        <span>{stat.followers_count?.toLocaleString()} followers</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Admin Review Notes</Label>
                <p className="mt-2 p-3 bg-muted rounded">
                  {selectedRequest.admin_review_notes || 'No notes provided'}
                </p>
              </div>

              {selectedRequest.notes && (
                <div>
                  <Label className="text-muted-foreground">Artist Notes</Label>
                  <p className="mt-2 p-3 bg-muted rounded">{selectedRequest.notes}</p>
                </div>
              )}

              <div>
                <Label htmlFor="final_notes">Your Review Notes</Label>
                <Textarea
                  id="final_notes"
                  value={finalReviewNotes}
                  onChange={(e) => setFinalReviewNotes(e.target.value)}
                  placeholder="Add notes explaining your decision..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGrantVerification}
                  disabled={processing}
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Grant Verification
                </Button>
                <Button
                  onClick={handleSendBack}
                  disabled={processing}
                  className="flex-1"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Send Back for Revision
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1"
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
