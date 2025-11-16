import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StreamSetupForm } from "@/components/StreamSetupForm";
import { useArtistData } from "@/hooks/useArtistData";
import { Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ScheduleStream = () => {
  const { artist, loading } = useArtistData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (config: any) => {
    setSubmitting(true);
    try {
      // The config already contains all necessary fields from the form
      // Just need to pass it to the livepush-api edge function
      const { data, error } = await supabase.functions.invoke('livepush-api', {
        body: {
          action: 'create_stream',
          ...config,
          artist_id: artist.id
        }
      });

      if (error) throw error;

      toast({
        title: "Stream Scheduled",
        description: "Your stream has been scheduled successfully",
      });
      navigate("/streaming/my-streams");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule stream",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schedule Stream</h1>
            <p className="text-muted-foreground">
              Plan your next live stream in advance
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stream Details</CardTitle>
            <CardDescription>
              Set up your stream information and schedule when it will go live
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StreamSetupForm 
              artistId={artist.id}
              onSubmit={handleSubmit}
              loading={submitting}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ScheduleStream;
