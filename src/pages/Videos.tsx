import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Star, Clock, CheckCircle, PlayCircle } from "lucide-react";

const Videos = () => {
  const videos = [
    {
      id: "1",
      title: "Lunar Static",
      kind: "Music Video",
      status: "ready",
      duration: "3:24",
      isFeatured: true,
      hasCaptions: true,
      thumbUrl: "/placeholder.svg",
    },
    {
      id: "2",
      title: "Live at Loft",
      kind: "Performance",
      status: "ready",
      duration: "3:32",
      isFeatured: false,
      hasCaptions: true,
      thumbUrl: "/placeholder.svg",
    },
    {
      id: "3",
      title: "Neon Dreams",
      kind: "Music Video",
      status: "processing",
      duration: "4:12",
      isFeatured: false,
      hasCaptions: false,
      thumbUrl: "/placeholder.svg",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage your videos and set your featured content
            </p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Featured Video Requirements</CardTitle>
            <CardDescription>
              Your featured video must have captions for accessibility
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Upload .SRT caption file for featured video</li>
              <li>Recommended: Add captions to all videos for better reach</li>
              <li>Featured video appears at the top of your Port</li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="gradient-card">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-40 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <PlayCircle className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{video.title}</h3>
                          {video.isFeatured && (
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              <Star className="h-3 w-3 mr-1 fill-primary" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{video.kind}</span>
                          <span>•</span>
                          <span>{video.duration}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {video.status === "ready" ? (
                          <Badge variant="outline" className="border-green-500/50 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <Button variant="outline" size="sm">
                        Edit Details
                      </Button>
                      {!video.isFeatured && (
                        <Button variant="ghost" size="sm">
                          Set as Featured
                        </Button>
                      )}
                      {!video.hasCaptions && (
                        <Button variant="ghost" size="sm" className="text-yellow-500">
                          Add Captions
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Videos;
