import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useGoLive } from "@/hooks/useGoLive";
import { StreamSetupForm } from "@/components/StreamSetupForm";
import { RTMPCredentials } from "@/components/RTMPCredentials";
import { StreamControls } from "@/components/StreamControls";
import { StreamOverlayManager } from "@/components/admin/StreamOverlayManager";
import { StreamStatusIndicator } from "@/components/StreamStatusIndicator";
import { UpgradeToTridentCard } from "@/components/UpgradeToTridentCard";
import { PurchaseMinutesCard } from "@/components/PurchaseMinutesCard";
import { MobileStreamingGuide } from "@/components/MobileStreamingGuide";
import { StreamingWebhookSetup } from "@/components/StreamingWebhookSetup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Clock, AlertCircle, Zap, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Streaming = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { createStream, endStream, checkEligibility, stream, creating, streamStatus, setStreamStatus } = useGoLive(artistId || '');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchArtist = async () => {
      if (!user) return;

      // Check if admin
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!rolesData);

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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Go Live</h1>
          <p className="text-muted-foreground">
            Set up your stream and start broadcasting
          </p>
          {isAdmin && <AdminBadge />}
        </div>

        {isAdmin && (
          <StreamingWebhookSetup />
        )}

        {!stream && artistId && (
          <>
            <StreamSetupForm
              artistId={artistId}
              onSubmit={handleCreateStream}
              loading={creating}
            />
            
            {/* Admin: Link to Stream Schedule */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Scheduled Streams</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View all scheduled streams, manage their status, and access stream credentials.
                  </p>
                  <Button onClick={() => navigate("/admin/stream-schedule")} variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View All Scheduled Streams
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {stream && (
          <div className="space-y-6">
            {streamStatus === 'waiting' && (
              <Alert>
                <AlertDescription className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <StreamStatusIndicator status={streamStatus} />
                    <span className="font-semibold">Stream Created!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Next steps: Connect with OBS using the credentials below, or use the "Force Live" button to go live manually.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            <RTMPCredentials
              rtmpUrl={stream.rtmpUrl}
              streamKey={stream.streamKey}
              hlsPlaybackUrl={stream.hlsPlaybackUrl}
            />

            <MobileStreamingGuide />

            <StreamControls
              streamId={stream.streamId}
              status={streamStatus === 'creating' || streamStatus === 'idle' ? 'waiting' : streamStatus}
              onEndStream={handleEndStream}
              isAdmin={isAdmin}
              onStatusChange={setStreamStatus}
            />

            {stream.streamId && (
              <StreamOverlayManager streamId={stream.streamId} />
            )}
          </div>
        )}

        {streamStatus === 'ended' && (
          <Card>
            <CardHeader>
              <CardTitle>Stream Ended</CardTitle>
              <CardDescription>
                Your stream has ended. Return to the dashboard to see analytics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
              {isAdmin && (
                <Button 
                  onClick={() => navigate('/admin/stream-schedule')} 
                  variant="outline" 
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Stream Schedule
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Streaming;
