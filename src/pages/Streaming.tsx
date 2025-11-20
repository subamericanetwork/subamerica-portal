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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Clock, AlertCircle, Zap, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { StreamManager } from "@/components/StreamManager";

const Streaming = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
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

  // Poll for status updates when stream is active
  useEffect(() => {
    if (!stream?.streamId || streamStatus === 'ended' || streamStatus === 'idle') {
      return;
    }

    const pollStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('sync-stream-status', {
          body: { streamId: stream.streamId },
        });

        if (error) {
          console.error('Error polling status:', error);
          return;
        }

        if (data?.synced && data.newStatus) {
          console.log('Status update:', data.oldStatus, '→', data.newStatus);
          setStreamStatus(data.newStatus);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 15 seconds
    const interval = setInterval(pollStatus, 15000);

    return () => clearInterval(interval);
  }, [stream?.streamId, streamStatus]);

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

  const handleCreateTestStream = async () => {
    if (!artistId || !user) return;
    
    setCreatingTest(true);
    try {
      const { data, error } = await supabase
        .from('artist_live_streams')
        .insert({
          artist_id: artistId,
          user_id: user.id,
          title: 'Test Stream',
          description: 'This is a test stream for testing purposes',
          status: 'live',
          streaming_mode: 'subamerica_managed',
          provider: 'mux',
          rtmp_ingest_url: 'rtmp://test.example.com/live',
          stream_key: 'test-' + Math.random().toString(36).substring(7),
          hls_playback_url: 'https://test.example.com/stream.m3u8',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Test stream created and set to live!');
      
      // Reload the page to show the test stream
      window.location.reload();
    } catch (error) {
      console.error('Error creating test stream:', error);
      toast.error('Failed to create test stream');
    } finally {
      setCreatingTest(false);
    }
  };

  const handleTestStream = async () => {
    if (!stream?.streamId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-stream-status', {
        body: { streamId: stream.streamId }
      });
      
      if (error) throw error;
      
      console.log('Test stream result:', data);
      
      if (data?.newStatus === 'live' || data?.oldStatus === 'live') {
        toast.success('✅ Stream is receiving video! You are live!');
      } else if (data?.newStatus === 'waiting' || data?.oldStatus === 'waiting') {
        toast.error(
          '❌ Stream is not receiving video. Make sure you are streaming to the RTMP URL with the correct stream key.',
          { duration: 5000 }
        );
      } else {
        toast.info(`Stream status: ${data?.newStatus || data?.oldStatus || 'unknown'}`);
      }
    } catch (error) {
      console.error('Test stream error:', error);
      toast.error('Failed to test stream');
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

        {/* Show tabs when not actively streaming */}
        {!stream && artistId && (
          <Tabs defaultValue="my-streams" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-streams">My Streams</TabsTrigger>
              <TabsTrigger value="start-new">Start New Stream</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-streams" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Streams</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="live" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="live">Live & Scheduled</TabsTrigger>
                      <TabsTrigger value="ended">Past Streams</TabsTrigger>
                      <TabsTrigger value="all">All Streams</TabsTrigger>
                    </TabsList>

                    <TabsContent value="live" className="mt-4">
                      <StreamManager artistId={artistId} showActions={true} filter="active" />
                    </TabsContent>

                    <TabsContent value="ended" className="mt-4">
                      <StreamManager artistId={artistId} showActions={false} filter="ended" />
                    </TabsContent>

                    <TabsContent value="all" className="mt-4">
                      <StreamManager artistId={artistId} showActions={true} filter="all" />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="start-new" className="space-y-6">
              <StreamSetupForm
                artistId={artistId}
                onSubmit={handleCreateStream}
                loading={creating}
              />
              
              {/* Admin: Test Stream & Stream Schedule */}
              {isAdmin && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Testing Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create a test stream that's immediately set to live status for testing the streaming workflow.
                      </p>
                      <Button 
                        onClick={handleCreateTestStream} 
                        variant="outline"
                        disabled={creatingTest}
                      >
                        {creatingTest ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Test Stream...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Create Test Stream
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Manage Scheduled Streams</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => navigate('/admin/stream-schedule')}
                        variant="outline"
                        className="w-full"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        View All Scheduled Streams
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StreamStatusIndicator status={streamStatus} />
                  Stream Status: {streamStatus}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {streamStatus === 'waiting' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your stream is ready! Start streaming using the RTMP credentials above.
                      Use OBS Studio or another streaming software to begin broadcasting.
                    </AlertDescription>
                  </Alert>
                )}
                {streamStatus === 'live' && (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                    <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      You are live! Your stream is broadcasting.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={handleTestStream}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Test Stream Connection
                </Button>
              </CardContent>
            </Card>

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
