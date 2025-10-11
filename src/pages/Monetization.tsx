import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QrCode, DollarSign, CheckCircle, ExternalLink, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useArtistData } from "@/hooks/useArtistData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Monetization = () => {
  const { artist, loading: artistLoading } = useArtistData();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    heartland_link: "",
    paypal_link: "",
  });
  const [qrData, setQrData] = useState({
    default_action: "tip",
    fallback_action: "tip",
    utm_template: "utm_source=tv&utm_medium=qr&utm_campaign=artist_port&utm_content={slug}",
  });

  useEffect(() => {
    if (artist) {
      fetchData();
    }
  }, [artist]);

  const fetchData = async () => {
    if (!artist) return;

    try {
      // Fetch payment data
      const { data: paymentInfo } = await supabase
        .from("payments")
        .select("*")
        .eq("artist_id", artist.id)
        .single();

      if (paymentInfo) {
        setPaymentData({
          heartland_link: paymentInfo.heartland_link || "",
          paypal_link: paymentInfo.paypal_link || "",
        });
      }

      // Fetch QR settings
      const { data: qrInfo } = await supabase
        .from("qr_settings")
        .select("*")
        .eq("artist_id", artist.id)
        .single();

      if (qrInfo) {
        setQrData({
          default_action: qrInfo.default_action || "tip",
          fallback_action: qrInfo.fallback_action || "tip",
          utm_template: qrInfo.utm_template || "utm_source=tv&utm_medium=qr&utm_campaign=artist_port&utm_content={slug}",
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.error("Error fetching monetization data:", error);
      }
    }
  };

  const handleSavePayments = async () => {
    if (!artist) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("payments")
        .upsert({
          artist_id: artist.id,
          heartland_link: paymentData.heartland_link || null,
          paypal_link: paymentData.paypal_link || null,
        }, {
          onConflict: 'artist_id'
        });

      if (error) throw error;
      toast.success("Payment links saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment links");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQRSettings = async () => {
    if (!artist) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("qr_settings")
        .upsert({
          artist_id: artist.id,
          default_action: qrData.default_action,
          fallback_action: qrData.fallback_action,
          utm_template: qrData.utm_template,
        }, {
          onConflict: 'artist_id'
        });

      if (error) throw error;
      toast.success("QR settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save QR settings");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeUrl = () => {
    if (!artist) return "";
    const portUrl = `${window.location.origin}/${artist.slug}`;
    const utmParams = qrData.utm_template.replace('{slug}', artist.slug);
    const fullUrl = `${portUrl}?${utmParams}`;
    // Using QR Server API for QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
  };

  const handleDownloadQR = (format: 'png' | 'svg') => {
    const qrUrl = generateQRCodeUrl();
    const link = document.createElement('a');
    link.href = format === 'svg' 
      ? qrUrl.replace('create-qr-code', 'create-qr-code').concat('&format=svg')
      : qrUrl;
    link.download = `${artist?.slug}-qr.${format}`;
    link.click();
  };

  if (artistLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const hasPaymentLinks = paymentData.heartland_link || paymentData.paypal_link;

  return (
    <DashboardLayout>
      <TooltipProvider>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monetization</h1>
          <p className="text-muted-foreground mt-1">
            Configure payment links and QR code defaults
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p><strong>Payment Flow:</strong> Heartland is your primary payment link (used for tips and purchases). PayPal serves as a fallback option for fans.</p>
              <p><strong>QR Codes:</strong> Generate trackable QR codes for TV/broadcasts. Choose what action happens when fans scan (tip, tickets, merch, etc.). UTM parameters help track QR scans.</p>
            </div>
          </AlertDescription>
        </Alert>

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
              {hasPaymentLinks && (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="heartland">Heartland Hosted Checkout Link</Label>
              <div className="flex gap-2">
                <Input
                  id="heartland"
                  placeholder="https://heartlandpay.link/..."
                  value={paymentData.heartland_link}
                  onChange={(e) => setPaymentData({ ...paymentData, heartland_link: e.target.value })}
                  className="font-mono text-sm"
                />
                {paymentData.heartland_link && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={paymentData.heartland_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
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
                  value={paymentData.paypal_link}
                  onChange={(e) => setPaymentData({ ...paymentData, paypal_link: e.target.value })}
                  className="font-mono text-sm"
                />
                {paymentData.paypal_link && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={paymentData.paypal_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Backup payment option for fans
              </p>
            </div>

            <Button onClick={handleSavePayments} disabled={loading}>
              {loading ? "Saving..." : "Save Payment Links"}
            </Button>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="qr-action">Default QR Action</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">This determines what page or action fans are directed to when they scan your QR code from TV or live broadcasts.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={qrData.default_action}
                onValueChange={(value) => setQrData({ ...qrData, default_action: value })}
              >
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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="utm-template">UTM Template</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">UTM parameters help track where QR scans come from (e.g., TV, print ads, etc.). They're automatically added to your QR code URLs.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="utm-template"
                value={qrData.utm_template}
                onChange={(e) => setQrData({ ...qrData, utm_template: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use {'{slug}'} as a placeholder for your artist slug. Example use: Track QR scans from TV vs. flyers.
              </p>
            </div>

            {artist && (
              <div className="p-4 rounded-lg border border-border bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="w-24 h-24 bg-background rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src={generateQRCodeUrl()} 
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Your QR Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Scans to: {window.location.origin}/{artist.slug}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {qrData.utm_template.replace('{slug}', artist.slug)}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadQR('png')}>
                        Download PNG
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadQR('svg')}>
                        Download SVG
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSaveQRSettings} disabled={loading}>
              {loading ? "Saving..." : "Update QR Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* UTM Preview */}
        {artist && (
          <Card>
            <CardHeader>
              <CardTitle>UTM Parameters Preview</CardTitle>
              <CardDescription>
                Automatically applied to QR code links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                {qrData.utm_template.split('&').map((param) => {
                  const [key, value] = param.split('=');
                  return (
                    <div key={key}>
                      <span className="text-muted-foreground">{key.replace('utm_', '')}:</span>
                      <span className="ml-2">{value?.replace('{slug}', artist.slug)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default Monetization;
