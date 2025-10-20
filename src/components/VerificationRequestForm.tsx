import { useState, useEffect } from "react";
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
import { SocialStat } from "@/hooks/useSocialStats";

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
  const [socialStats, setSocialStats] = useState<SocialStat[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [qualifyingPlatforms, setQualifyingPlatforms] = useState<SocialStat[]>([]);
  const [evidence, setEvidence] = useState({
    spotify_url: "",
    instagram_url: "",
    youtube_url: "",
    other_urls: "",
    additional_notes: ""
  });

  useEffect(() => {
    const fetchSocialStats = async () => {
      const { data } = await supabase
        .from('artist_social_stats')
        .select('*')
        .eq('artist_id', artistId)
        .in('platform', ['tiktok', 'instagram', 'linkedin']);
      
      if (data) {
        setSocialStats(data);
        const qualifying = data.filter(stat => stat.followers_count >= 1000);
        setQualifyingPlatforms(qualifying);
        setIsEligible(qualifying.length > 0);
      }
    };
    
    fetchSocialStats();
  }, [artistId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEligible) {
      toast.error('You must have 1,000+ followers on TikTok, Instagram, or LinkedIn to apply');
      return;
    }
    
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('artist_verification_requests')
        .insert([{
          artist_id: artistId,
          verification_evidence: {
            ...evidence,
            social_stats: JSON.parse(JSON.stringify(socialStats)),
            qualifying_platforms: JSON.parse(JSON.stringify(qualifyingPlatforms))
          },
          status: 'pending'
        }]);

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
        {!isEligible ? (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Not Eligible for Verification</strong>
              <p className="mt-2">
                To qualify for verification, you need at least 1,000 followers on TikTok, Instagram, or LinkedIn.
              </p>
              <p className="mt-2">Current follower counts:</p>
              <ul className="mt-1 ml-4 list-disc">
                {socialStats.length > 0 ? (
                  socialStats.map(stat => (
                    <li key={stat.platform}>
                      {stat.platform}: {stat.followers_count.toLocaleString()} followers
                    </li>
                  ))
                ) : (
                  <li>No social stats added yet</li>
                )}
              </ul>
              <p className="mt-2 text-sm">
                Please add or update your social media stats in your Profile to qualify.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong className="text-green-700">Eligible for Verification!</strong>
              <p className="mt-2 text-green-600">
                You have {qualifyingPlatforms[0]?.followers_count.toLocaleString()} followers on{' '}
                {qualifyingPlatforms[0]?.platform}.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Provide links to your official social media and streaming profiles to support your verification request.
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

          <Button type="submit" disabled={submitting || !isEligible} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Verification Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
