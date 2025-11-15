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
import { CheckCircle, Clock, XCircle, Info, ExternalLink } from "lucide-react";
import { SocialStat } from "@/hooks/useSocialStats";
import { Link } from "react-router-dom";

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
  const [missingUrls, setMissingUrls] = useState<string[]>([]);
  const [verificationMethod, setVerificationMethod] = useState<'platform_verified' | 'follower_threshold'>('follower_threshold');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformVerified, setPlatformVerified] = useState<Record<string, boolean>>({});
  const [evidence, setEvidence] = useState({
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
        
        // Check for missing profile URLs on qualifying platforms
        const missing = qualifying
          .filter(stat => !stat.profile_url)
          .map(stat => stat.platform);
        setMissingUrls(missing);
        
        setIsEligible(qualifying.length > 0 && missing.length === 0);
      }
    };
    
    const fetchPlatformVerification = async () => {
      const { data } = await supabase
        .from('social_auth')
        .select('platform, platform_verified')
        .eq('artist_id', artistId);
      
      if (data) {
        const verified = data.reduce((acc, item) => {
          acc[item.platform] = item.platform_verified || false;
          return acc;
        }, {} as Record<string, boolean>);
        setPlatformVerified(verified);
      }
    };
    
    fetchSocialStats();
    fetchPlatformVerification();
  }, [artistId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationMethod === 'follower_threshold' && !isEligible) {
      toast.error('You must have 1,000+ followers on TikTok, Instagram, or LinkedIn to apply');
      return;
    }

    if (verificationMethod === 'platform_verified' && selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform where you have a verification badge');
      return;
    }
    
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('artist_verification_requests')
        .insert([{
          artist_id: artistId,
          verification_method: verificationMethod,
          verified_platforms: selectedPlatforms,
          notes: evidence.additional_notes,
          verification_evidence: {
            ...evidence,
            verification_method: verificationMethod,
            verified_platforms: selectedPlatforms,
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
          Get a blue checkmark to show members your profile is authentic
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

        {missingUrls.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Missing Profile URLs</strong>
              <p className="mt-2">
                You have 1,000+ followers on {missingUrls.join(', ')}, but no profile URL saved. 
                Please add your profile URL in Social Media & Analytics.
              </p>
              <Link to="/profile">
                <Button variant="link" className="p-0 h-auto mt-2">
                  Go to Social Media & Analytics →
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {socialStats.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Profile URLs for Verification
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Your verification request will use these profiles from your Social Media & Analytics:
            </p>
            <div className="space-y-2">
              {socialStats.map(stat => (
                <div key={stat.platform} className="flex items-start justify-between gap-2 text-sm">
                  <div className="flex-1">
                    <div className="font-medium capitalize flex items-center gap-2">
                      {stat.platform}
                      {platformVerified[stat.platform] && (
                        <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Platform Verified
                        </Badge>
                      )}
                    </div>
                    {stat.profile_url ? (
                      <a 
                        href={stat.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-xs"
                      >
                        {stat.profile_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">No URL added</span>
                    )}
                  </div>
                  <Badge variant={stat.followers_count >= 1000 ? "default" : "secondary"} className="text-xs">
                    {stat.followers_count.toLocaleString()} followers
                  </Badge>
                </div>
              ))}
            </div>
            <Link to="/profile">
              <Button variant="link" className="p-0 h-auto mt-3 text-sm">
                Edit Social Stats →
              </Button>
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Choose Verification Method</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/5">
                <input
                  type="radio"
                  name="verification_method"
                  value="platform_verified"
                  checked={verificationMethod === 'platform_verified'}
                  onChange={(e) => setVerificationMethod(e.target.value as 'platform_verified')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Platform Verification Badge (Fast-Track)</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    You have a verified badge on LinkedIn, Instagram, or X/Twitter
                  </div>
                  
                  {verificationMethod === 'platform_verified' && (
                    <div className="mt-3 space-y-2">
                      {['linkedin', 'instagram', 'twitter'].map(platform => {
                        const stat = socialStats.find(s => s.platform === platform);
                        const isSelected = selectedPlatforms.includes(platform);
                        
                        return (
                          <label key={platform} className="flex items-start gap-2 p-3 bg-muted/50 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPlatforms([...selectedPlatforms, platform]);
                                } else {
                                  setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium capitalize">{platform} Verified Badge</div>
                              {stat?.profile_url ? (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Profile: <a href={stat.profile_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{stat.profile_url}</a>
                                </div>
                              ) : (
                                <div className="text-sm text-destructive mt-1">
                                  No profile URL set. Add it in Social Media & Analytics first.
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/5">
                <input
                  type="radio"
                  name="verification_method"
                  value="follower_threshold"
                  checked={verificationMethod === 'follower_threshold'}
                  onChange={(e) => setVerificationMethod(e.target.value as 'follower_threshold')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Follower Threshold (Standard Review)</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    You have 1,000+ followers on qualifying platforms
                  </div>
                  
                  {verificationMethod === 'follower_threshold' && qualifyingPlatforms.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {qualifyingPlatforms.map(stat => (
                        <div key={stat.platform} className="text-sm p-2 bg-muted/50 rounded">
                          <span className="font-medium capitalize">{stat.platform}:</span> {stat.followers_count?.toLocaleString()} followers
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
            <Textarea
              id="additional_notes"
              placeholder="Any additional information to support your verification request..."
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
