import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Smartphone, ExternalLink, Zap, Info } from "lucide-react";

export const MobileStreamingGuide = () => {
  const apps = [
    {
      name: "Larix Broadcaster",
      platforms: ["iOS", "Android"],
      features: ["Free", "Low latency", "RTMP support"],
      ios: "https://apps.apple.com/app/larix-broadcaster/id1042474385",
      android: "https://play.google.com/store/apps/details?id=com.wmspanel.larix_broadcaster"
    },
    {
      name: "Prism Live Studio",
      platforms: ["iOS", "Android"],
      features: ["Free", "Professional quality", "Easy setup"],
      ios: "https://apps.apple.com/app/prism-live-studio/id1456263909",
      android: "https://play.google.com/store/apps/details?id=com.prism.live.studio"
    },
    {
      name: "Streamlabs Mobile",
      platforms: ["iOS", "Android"],
      features: ["Free", "Popular choice", "Built-in chat"],
      ios: "https://apps.apple.com/app/streamlabs/id1294855119",
      android: "https://play.google.com/store/apps/details?id=com.streamlabs"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          <CardTitle className="text-lg sm:text-xl">Stream from Mobile</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base">
          Use these recommended RTMP streaming apps to go live from your phone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Copy your RTMP credentials above and paste them into any of these mobile streaming apps
          </AlertDescription>
        </Alert>

        <div className="space-y-3 sm:space-y-4">
          {apps.map((app) => (
            <div key={app.name} className="border rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-base sm:text-lg">{app.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {app.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={app.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Get on iOS
                </a>
                <a
                  href={app.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Get on Android
                </a>
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Mobile Streaming Tips:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs sm:text-sm">
              <li>Use a stable WiFi connection when possible</li>
              <li>Keep your phone plugged in or fully charged</li>
              <li>Close other apps to maximize performance</li>
              <li>Test your stream before going live</li>
              <li>Use landscape mode for better viewing experience</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
