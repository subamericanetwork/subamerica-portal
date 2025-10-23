import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { SocialStat } from "@/hooks/useSocialStats";

interface VerificationRequest {
  id: string;
  artist_id: string;
  status: string;
  requested_at: string;
  verification_evidence: any;
  artists: {
    display_name: string;
    email: string;
    slug: string;
    artist_social_stats: SocialStat[];
  };
}

const AdminVerification = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_verification_requests')
        .select(`
          *,
          artists(
            display_name, 
            email, 
            slug,
            artist_social_stats(*)
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = (request: VerificationRequest) => {
    const socialStats = request.artists.artist_social_stats || [];
    const qualifyingPlatforms = ['tiktok', 'instagram', 'linkedin'];
    
    const qualifying = socialStats.filter(
      stat => qualifyingPlatforms.includes(stat.platform) && stat.followers_count >= 1000
    );
    
    return {
      eligible: qualifying.length > 0,
      qualifyingStats: qualifying,
      allStats: socialStats
    };
  };

  const handleApprove = async (request: VerificationRequest) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide review notes before approving');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update request to admin_approved (will need Roger's final approval)
      const { error: requestError } = await supabase
        .from('artist_verification_requests')
        .update({
          status: 'admin_approved',
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: user?.id,
          admin_review_notes: adminNotes
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Send notification email to Roger and CC admins
      const { error: emailError } = await supabase.functions.invoke('send-roger-notification', {
        body: {
          artist_name: request.artists.display_name,
          artist_email: request.artists.email,
          artist_slug: request.artists.slug,
          admin_notes: adminNotes,
          verification_evidence: request.verification_evidence
        }
      });

      if (emailError) {
        console.error('Error sending Roger notification:', emailError);
        toast.error('Approved, but failed to send email notification');
      } else {
        toast.success('Request sent to Roger for final approval');
      }

      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: VerificationRequest) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('artist_verification_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectionReason
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Verification request rejected');
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" }
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Artist Verification</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage artist verification requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const { eligible, qualifyingStats } = checkEligibility(request);
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.artists.display_name}
                    </TableCell>
                    <TableCell>{request.artists.email}</TableCell>
                    <TableCell>
                      {new Date(request.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {eligible ? (
                        <Badge variant="default" className="bg-green-500">
                          ✓ {qualifyingStats[0]?.followers_count.toLocaleString()} on{' '}
                          {qualifyingStats[0]?.platform}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Below threshold
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View Details
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request)}
                            disabled={processing}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSelectedRequest(request)}
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verification Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Artist Information</h3>
                <p><strong>Name:</strong> {selectedRequest.artists.display_name}</p>
                <p><strong>Email:</strong> {selectedRequest.artists.email}</p>
                <p>
                  <strong>Profile:</strong>{' '}
                  <a
                    href={`/${selectedRequest.artists.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Port <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Follower Verification</h3>
                {(() => {
                  const { eligible, qualifyingStats, allStats } = checkEligibility(selectedRequest);
                  return (
                    <div className="space-y-2">
                      {eligible ? (
                        <Alert className="border-green-500 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <strong className="text-green-700">Meets 1,000 Follower Requirement</strong>
                            <ul className="mt-2 space-y-1">
                              {qualifyingStats.map(stat => (
                                <li key={stat.platform} className="text-green-600">
                                  ✓ {stat.platform}: {stat.followers_count.toLocaleString()} followers
                                  {stat.profile_url && (
                                    <a
                                      href={stat.profile_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                      View Profile <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Does Not Meet Follower Requirement</strong>
                            <p className="mt-2">Current follower counts:</p>
                            <ul className="mt-1 ml-4 list-disc">
                              {allStats.length > 0 ? (
                                allStats.filter(stat => ['tiktok', 'instagram', 'linkedin'].includes(stat.platform)).map(stat => (
                                  <li key={stat.platform}>
                                    {stat.platform}: {stat.followers_count.toLocaleString()} followers
                                  </li>
                                ))
                              ) : (
                                <li>No social stats recorded for qualifying platforms</li>
                              )}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Verification Evidence</h3>
                <div className="space-y-2">
                  {selectedRequest.verification_evidence?.spotify_url && (
                    <p>
                      <strong>Spotify:</strong>{' '}
                      <a
                        href={selectedRequest.verification_evidence.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedRequest.verification_evidence.spotify_url}
                      </a>
                    </p>
                  )}
                  {selectedRequest.verification_evidence?.instagram_url && (
                    <p>
                      <strong>Instagram:</strong>{' '}
                      <a
                        href={selectedRequest.verification_evidence.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedRequest.verification_evidence.instagram_url}
                      </a>
                    </p>
                  )}
                  {selectedRequest.verification_evidence?.youtube_url && (
                    <p>
                      <strong>YouTube:</strong>{' '}
                      <a
                        href={selectedRequest.verification_evidence.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedRequest.verification_evidence.youtube_url}
                      </a>
                    </p>
                  )}
                  {selectedRequest.verification_evidence?.other_urls && (
                    <p><strong>Other:</strong> {selectedRequest.verification_evidence.other_urls}</p>
                  )}
                  {selectedRequest.verification_evidence?.additional_notes && (
                    <p><strong>Notes:</strong> {selectedRequest.verification_evidence.additional_notes}</p>
                  )}
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin_notes" className="text-sm font-medium mb-2 block">
                      Your Review Notes (Required for Approval)
                    </Label>
                    <Textarea
                      id="admin_notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this verification request to help with final review..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rejection_reason" className="text-sm font-medium mb-2 block">
                      Rejection Reason (if rejecting)
                    </Label>
                    <Textarea
                      id="rejection_reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this request is being rejected..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="default"
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={processing || !adminNotes.trim()}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Send to Roger for Final Approval
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedRequest)}
                      disabled={processing || !rejectionReason.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedRequest.status === 'admin_approved' && (
                <Alert>
                  <AlertDescription>
                    This request has been approved by an admin and is awaiting final approval from Roger.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerification;
