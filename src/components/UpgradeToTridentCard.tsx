import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const UpgradeToTridentCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Upgrade to Trident
        </CardTitle>
        <CardDescription>
          Unlock live streaming and connect with your audience in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="font-semibold mb-3 text-muted-foreground">Current Plan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground/50" />
                Basic features
              </li>
              <li className="flex items-center gap-2 opacity-50">
                <span className="h-4 w-4" />
                No live streaming
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-semibold mb-3 text-primary">Trident Plan</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Live streaming with RTMP
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                120 minutes included per month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                HLS playback for viewers
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Stream recordings saved
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Real-time viewer analytics
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            Join thousands of artists already streaming live on SubAmerica. 
            Engage with your fans, build your community, and grow your reach.
          </p>
        </div>

        <Button 
          onClick={() => navigate('/monetization')} 
          className="w-full"
          size="lg"
        >
          <Zap className="mr-2 h-4 w-4" />
          Upgrade to Trident Now
        </Button>
      </CardContent>
    </Card>
  );
};
