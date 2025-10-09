import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, ShoppingBag, Eye, CheckCircle, AlertCircle } from "lucide-react";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, Starry Schemes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-primary/50">
              <CheckCircle className="h-3 w-3 mr-1" />
              Published
            </Badge>
            <Button>Preview Port</Button>
          </div>
        </div>

        {/* Port Status */}
        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader>
            <CardTitle>Port Status</CardTitle>
            <CardDescription>Your public artist page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Port URL</p>
                <p className="text-lg font-mono text-primary">
                  subamerica.net/port/starry-schemes
                </p>
              </div>
              <Button variant="outline" size="sm">Copy Link</Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">1.2k</p>
                <p className="text-xs text-muted-foreground">Port Views (30d)</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">8.4%</p>
                <p className="text-xs text-muted-foreground">Click-through Rate</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-muted-foreground">QR Scans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                1 featured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Upcoming shows
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Merch Items</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                Surface on Port
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Port Health</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">95%</div>
              <p className="text-xs text-muted-foreground">
                Ready to publish
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Complete these to optimize your Port</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Add captions to featured video</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Required for accessibility and publishing
                </p>
              </div>
              <Button size="sm" variant="outline">Fix Now</Button>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/50">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Payment links configured</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Heartland and PayPal ready
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
