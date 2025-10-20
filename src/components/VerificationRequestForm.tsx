import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Clock, XCircle, Info } from "lucide-react";

interface VerificationRequestFormProps {
  artistId: string;
  isVerified: boolean;
  existingRequest?: {
    status: string;
    requested_at: string;
    rejection_reason?: string;
  };
}

export const VerificationRequestForm = ({ 
  artistId, 
  isVerified,
  existingRequest 
}: VerificationRequestFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [evidence, setEvidence] = useState({
    spotify_url: "",
    instagram_url: "",
    youtube_url: "",
    other_urls: "",
    additional_notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('artist_verification_requests')
        .insert({
          artist_id: artistId,
          verification_evidence: evidence,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Verification request submitted! We\'ll review it shortly.');
      window.location.reload();
    } catch (error: any) {
      console.error('Error submitting verification request:', error);
      toast.error('Failed to submit verification request');
    } finally {
      setSubmitting(false);
    }
  };

  if (isVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500 fill-blue-500" />
            Verified Artist
          </CardTitle>
          <CardDescription>
            Your artist profile is verified
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (existingRequest?.status === 'pending') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Verification Pending
          </CardTitle>
          <CardDescription>
            Your verification request is under review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Submitted {new Date(existingRequest.requested_at).toLocaleDateString()}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (existingRequest?.status === 'rejected') {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Verification Request Rejected</strong>
            {existingRequest.rejection_reason && (
              <p className="mt-2">{existingRequest.rejection_reason}</p>
            )}
            <p className="mt-2 text-sm">You can submit a new request below.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Verification</CardTitle>
        <CardDescription>
          Get a blue checkmark to show fans your profile is authentic
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            To be eligible for verification, provide links to your official social media and streaming profiles.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="spotify_url">Spotify Profile URL</Label>
            <Input
              id="spotify_url"
              type="url"
              placeholder="https://open.spotify.com/artist/..."
              value={evidence.spotify_url}
              onChange={(e) => setEvidence({ ...evidence, spotify_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="instagram_url">Instagram Profile URL</Label>
            <Input
              id="instagram_url"
              type="url"
              placeholder="https://instagram.com/..."
              value={evidence.instagram_url}
              onChange={(e) => setEvidence({ ...evidence, instagram_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="youtube_url">YouTube Channel URL</Label>
            <Input
              id="youtube_url"
              type="url"
              placeholder="https://youtube.com/@..."
              value={evidence.youtube_url}
              onChange={(e) => setEvidence({ ...evidence, youtube_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="other_urls">Other Verification Links (comma separated)</Label>
            <Input
              id="other_urls"
              placeholder="https://soundcloud.com/..., https://twitter.com/..."
              value={evidence.other_urls}
              onChange={(e) => setEvidence({ ...evidence, other_urls: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="additional_notes">Additional Information</Label>
            <Textarea
              id="additional_notes"
              placeholder="Tell us why you should be verified..."
              value={evidence.additional_notes}
              onChange={(e) => setEvidence({ ...evidence, additional_notes: e.target.value })}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Verification Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
