import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreamManager } from "@/components/StreamManager";
import { useArtistData } from "@/hooks/useArtistData";
import { Loader2 } from "lucide-react";

const MyStreams = () => {
  const { artist, loading } = useArtistData();
  const [activeTab, setActiveTab] = useState("live");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!artist) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Artist profile not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Streams</h1>
          <p className="text-muted-foreground">
            Manage all your live, scheduled, and past streams
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Live & Scheduled</TabsTrigger>
            <TabsTrigger value="ended">Past Streams</TabsTrigger>
            <TabsTrigger value="all">All Streams</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active & Upcoming Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <StreamManager artistId={artist.id} showActions={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ended" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Past Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View analytics and recordings from your completed streams
                </p>
                {/* StreamManager will be updated to filter ended streams */}
                <div className="mt-4">
                  <StreamManager artistId={artist.id} showActions={false} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <StreamManager artistId={artist.id} showActions={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyStreams;
