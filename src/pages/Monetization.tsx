import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrCode, DollarSign, CheckCircle, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Monetization = () => {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monetization</h1>
          <p className="text-muted-foreground mt-1">
            Configure payment links and QR code defaults
          </p>
        </div>

        {/* Payment Links */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Links</CardTitle>
                <CardDescription>
                  Add your Heartland and PayPal payment links
                </CardDescription>
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="heartland">Heartland Hosted Checkout Link</Label>
              <div className="flex gap-2">
                <Input
                  id="heartland"
                  placeholder="https://heartlandpay.link/..."
                  defaultValue="https://heartlandpay.link/starry-schemes"
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your primary payment method for tips and purchases
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypal">PayPal Fallback Link</Label>
              <div className="flex gap-2">
                <Input
                  id="paypal"
                  placeholder="https://paypal.me/..."
                  defaultValue="https://paypal.me/starryschemes"
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Backup payment option for fans
              </p>
            </div>

            <Button>Save Payment Links</Button>
          </CardContent>
        </Card>

        {/* QR Code Settings */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Settings
            </CardTitle>
            <CardDescription>
              Configure default action for broadcast QR codes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="qr-action">Default QR Action</Label>
              <Select defaultValue="tip">
                <SelectTrigger id="qr-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tip">Tip (Network Default)</SelectItem>
                  <SelectItem value="tickets">Event Tickets</SelectItem>
                  <SelectItem value="product">Featured Product</SelectItem>
                  <SelectItem value="fanclub">Fan Club / Patreon</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                What fans see when they scan your QR code on TV/broadcasts
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="w-24 h-24 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                  <QrCode className="h-16 w-16" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Your QR Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Includes UTM tracking: source=tv, medium=qr
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Download PNG
                    </Button>
                    <Button variant="outline" size="sm">
                      Download SVG
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button>Update QR Settings</Button>
          </CardContent>
        </Card>

        {/* UTM Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>UTM Tracking</CardTitle>
            <CardDescription>
              Automatically applied to all Port links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Source:</span>
                <span className="ml-2">tv</span>
              </div>
              <div>
                <span className="text-muted-foreground">Medium:</span>
                <span className="ml-2">qr</span>
              </div>
              <div>
                <span className="text-muted-foreground">Campaign:</span>
                <span className="ml-2">artist_port</span>
              </div>
              <div>
                <span className="text-muted-foreground">Content:</span>
                <span className="ml-2">starry-schemes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Monetization;
