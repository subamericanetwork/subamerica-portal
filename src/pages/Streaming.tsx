import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useGoLive } from "@/hooks/useGoLive";
import { StreamSetupForm } from "@/components/StreamSetupForm";
import { RTMPCredentials } from "@/components/RTMPCredentials";
import { StreamControls } from "@/components/StreamControls";
import { StreamOverlayManager } from "@/components/admin/StreamOverlayManager";
import { UpgradeToTridentCard } from "@/components/UpgradeToTridentCard";
import { PurchaseMinutesCard } from "@/components/PurchaseMinutesCard";
import { MobileStreamingGuide } from "@/components/MobileStreamingGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Clock, AlertCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Streaming = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);
  const { createStream, endStream, checkEligibility, stream, creating, streamStatus } = useGoLive(artistId || '');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchArtist = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching artist:', error);
        setLoading(false);
        return;
      }

      setArtistId(data.id);
    };

    fetchArtist();
  }, [user]);

  useEffect(() => {
    if (!artistId) return;

    const checkStreamEligibility = async () => {
      const result = await checkEligibility();
      setEligibility(result);
      setLoading(false);
    };

    checkStreamEligibility();
  }, [artistId]);

  const handleCreateStream = async (config: any) => {
    if (!artistId) return;
    await createStream(config);
  };

  const handleEndStream = async () => {
    if (!stream) return;
    const success = await endStream(stream.streamId);
    if (success) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Admin access badge
  const AdminBadge = () => (
    <Badge variant="default" className="mb-4">
      <Shield className="h-3 w-3 mr-1" />
      Admin Access
    </Badge>
  );

  // Show upgrade card for non-admin users who need Trident
  if (!eligibility?.canStream && eligibility?.reason === 'upgrade_required') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <UpgradeToTridentCard />
        </div>
      </DashboardLayout>
    );
  }

  // Show purchase minutes card for users with no minutes remaining
  if (!eligibility?.canStream && eligibility?.reason === 'no_minutes') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <PurchaseMinutesCard minutesRemaining={eligibility.minutesRemaining} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Live Streaming</h1>
          <p className="text-muted-foreground">
            Go live and connect with your audience in real-time
          </p>
          {eligibility?.isAdmin && <AdminBadge />}
          {eligibility?.minutesRemaining && !eligibility?.isAdmin && (
            <p className="text-sm text-muted-foreground mt-2">
              {eligibility.minutesRemaining} streaming minutes remaining
            </p>
          )}
        </div>

        {!stream && streamStatus === 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Stream</CardTitle>
              <CardDescription>
                Set up your stream details before going live
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreamSetupForm
                artistId={artistId!}
                onSubmit={handleCreateStream}
                loading={creating}
              />
            </CardContent>
          </Card>
        )}

        {stream && (streamStatus === 'waiting' || streamStatus === 'live') && (
          <>
            <div className={`grid gap-4 sm:gap-6 ${isMobile ? '' : 'md:grid-cols-2'}`}>
              <div className="space-y-4 sm:space-y-6">
                <RTMPCredentials
                  rtmpUrl={stream.rtmpUrl}
                  streamKey={stream.streamKey}
                  hlsPlaybackUrl={stream.hlsPlaybackUrl}
                />
                {isMobile && <MobileStreamingGuide />}
              </div>
              <div>
                <StreamControls
                  streamId={stream.streamId}
                  status={streamStatus}
                  onEndStream={handleEndStream}
                />
              </div>
            </div>
            <StreamOverlayManager streamId={stream.streamId} />
          </>
        )}

        {streamStatus === 'ended' && (
          <Card>
            <CardHeader>
              <CardTitle>Stream Ended</CardTitle>
              <CardDescription>
                Your stream has ended successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your stream recording will be available in your dashboard shortly.
              </p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Streaming;
