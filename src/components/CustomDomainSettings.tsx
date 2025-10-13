import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, CheckCircle2, AlertCircle, Clock, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CustomDomainSettingsProps {
  artistId: string;
  slug: string;
  currentDomain?: string;
  isVerified?: boolean;
}

export const CustomDomainSettings = ({ artistId, slug, currentDomain, isVerified }: CustomDomainSettingsProps) => {
  const { toast } = useToast();
  const [domain, setDomain] = useState(currentDomain || "");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed" | null>(
    isVerified ? "verified" : currentDomain ? "pending" : null
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dnsResults, setDnsResults] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (currentDomain && !isVerified) {
      fetchVerificationStatus();
    }
  }, [currentDomain, isVerified]);

  const fetchVerificationStatus = async () => {
    try {
      const { data } = await supabase
        .from("domain_verifications")
        .select("*")
        .eq("artist_id", artistId)
        .eq("domain", currentDomain)
        .single();

      if (data) {
        setVerificationToken(data.verification_token);
        setVerificationStatus(data.verification_status as "pending" | "verified" | "failed");
        setDnsResults(data.dns_check_results);
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const validateDomain = (domain: string): boolean => {
    // Remove any protocol or trailing slash
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
    
    // Check if it's a valid domain format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain (e.g., artistname.com)",
        variant: "destructive",
      });
      return false;
    }

    // Block subamerica.net subdomains
    if (cleanDomain.includes("subamerica.net")) {
      toast({
        title: "Invalid Domain",
        description: "Please use your own domain, not a SubAmerica subdomain",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSaveDomain = async () => {
    if (!domain || !validateDomain(domain)) return;

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
    setIsSaving(true);

    try {
      // Generate verification token
      const token = `lovable-verify-${Math.random().toString(36).substring(2, 15)}`;

      // Check if domain is already in use
      const { data: existing } = await supabase
        .from("port_settings")
        .select("artist_id")
        .eq("custom_domain", cleanDomain)
        .neq("artist_id", artistId)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Domain Already in Use",
          description: "This domain is already connected to another artist",
          variant: "destructive",
        });
        return;
      }

      // Update port_settings
      const { error: settingsError } = await supabase
        .from("port_settings")
        .update({
          custom_domain: cleanDomain,
          custom_domain_verified: false,
          custom_domain_dns_instructions: {
            a_record: "185.158.133.1",
            txt_record: token,
          },
        })
        .eq("artist_id", artistId);

      if (settingsError) throw settingsError;

      // Create or update domain verification record
      const { error: verifyError } = await supabase
        .from("domain_verifications")
        .upsert({
          artist_id: artistId,
          domain: cleanDomain,
          verification_token: token,
          verification_status: "pending",
        });

      if (verifyError) throw verifyError;

      setDomain(cleanDomain);
      setVerificationToken(token);
      setVerificationStatus("pending");

      toast({
        title: "Domain Saved",
        description: "Please configure your DNS records and verify",
      });
    } catch (error: any) {
      toast({
        title: "Error Saving Domain",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!domain) return;

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: {
          artistId,
          domain,
          verificationToken,
        },
      });

      if (error) throw error;

      setDnsResults(data.checks);

      if (data.verified) {
        setVerificationStatus("verified");
        toast({
          title: "Domain Verified!",
          description: "Your custom domain is now active",
        });
      } else {
        setVerificationStatus("failed");
        const nextStepsMessage = Array.isArray(data.nextSteps) 
          ? data.nextSteps.join(". ") 
          : "Please check your DNS configuration";
        toast({
          title: "Verification Failed",
          description: nextStepsMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
      setVerificationStatus("failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Are you sure you want to remove your custom domain?")) return;

    try {
      await supabase
        .from("port_settings")
        .update({
          custom_domain: null,
          custom_domain_verified: false,
          custom_domain_verified_at: null,
          custom_domain_dns_instructions: null,
        })
        .eq("artist_id", artistId);

      await supabase
        .from("domain_verifications")
        .delete()
        .eq("artist_id", artistId)
        .eq("domain", domain);

      setDomain("");
      setVerificationToken("");
      setVerificationStatus(null);
      setDnsResults(null);

      toast({
        title: "Domain Removed",
        description: "Your custom domain has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusBadge = () => {
    if (!verificationStatus) {
      return <Badge variant="secondary"><Globe className="h-3 w-3 mr-1" />Not Configured</Badge>;
    }
    switch (verificationStatus) {
      case "verified":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Verification Failed</Badge>;
    }
  };

  const defaultUrl = `https://artist-portal.subamerica.net/${slug}`;
  const customUrl = domain ? `https://${domain}` : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Domain</CardTitle>
            <CardDescription>
              Connect your own domain to your artist port
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Domain Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Domain</label>
          <div className="flex gap-2">
            <Input
              placeholder="artistname.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={verificationStatus === "verified"}
            />
            {verificationStatus === "verified" ? (
              <Button onClick={handleRemoveDomain} variant="outline">
                Remove
              </Button>
            ) : (
              <Button onClick={handleSaveDomain} disabled={isSaving || !domain}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>

        {/* URLs Display */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Default URL</label>
            <div className="flex gap-2">
              <Input value={defaultUrl} readOnly className="font-mono text-sm" />
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(defaultUrl, "Default URL")}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => window.open(defaultUrl, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {customUrl && verificationStatus === "verified" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Custom Domain URL</label>
              <div className="flex gap-2">
                <Input value={customUrl} readOnly className="font-mono text-sm" />
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(customUrl, "Custom URL")}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => window.open(customUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* DNS Instructions */}
        {domain && verificationStatus !== "verified" && verificationToken && (
          <Alert>
            <AlertDescription className="space-y-4">
              <p className="font-medium">DNS Configuration Required</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">1. Add these A records to your domain:</p>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-muted-foreground">Type:</span> A &nbsp;
                        <span className="text-muted-foreground">Name:</span> @ &nbsp;
                        <span className="text-muted-foreground">Value:</span> 185.158.133.1
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard("185.158.133.1", "IP Address")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-muted-foreground">Type:</span> A &nbsp;
                        <span className="text-muted-foreground">Name:</span> www &nbsp;
                        <span className="text-muted-foreground">Value:</span> 185.158.133.1
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard("185.158.133.1", "IP Address")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-1">2. Add this TXT record for verification:</p>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <div className="break-all">
                        <span className="text-muted-foreground">Type:</span> TXT &nbsp;
                        <span className="text-muted-foreground">Name:</span> _lovable-verify &nbsp;
                        <span className="text-muted-foreground">Value:</span> {String(verificationToken)}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(verificationToken, "Verification Token")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  ⚠️ DNS changes can take 24-48 hours to propagate worldwide
                </p>
              </div>

              <Button onClick={handleVerifyDomain} disabled={isVerifying} className="w-full">
                {isVerifying ? "Verifying..." : "Check DNS Now"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* DNS Check Results */}
        {dnsResults && verificationStatus === "failed" && (
          <Alert variant="destructive">
            <AlertDescription className="space-y-2">
              <p className="font-medium">DNS Check Results:</p>
              <ul className="text-sm space-y-1">
                {dnsResults.aRecord?.status === "fail" && dnsResults.aRecord?.message && (
                  <li>❌ A Record: {String(dnsResults.aRecord.message)}</li>
                )}
                {dnsResults.wwwRecord?.status === "fail" && dnsResults.wwwRecord?.message && (
                  <li>❌ WWW Record: {String(dnsResults.wwwRecord.message)}</li>
                )}
                {dnsResults.txtRecord?.status === "fail" && dnsResults.txtRecord?.message && (
                  <li>❌ TXT Record: {String(dnsResults.txtRecord.message)}</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Help Section */}
        <Collapsible open={showHelp} onOpenChange={setShowHelp}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full">
              {showHelp ? "Hide" : "Show"} DNS Setup Help
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="text-sm space-y-2">
              <p className="font-medium">Common DNS Setup Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</li>
                <li>Navigate to DNS settings or DNS management</li>
                <li>Add the A records and TXT record as shown above</li>
                <li>Save your changes</li>
                <li>Wait for DNS propagation (up to 48 hours)</li>
                <li>Click "Check DNS Now" to verify</li>
              </ol>
              <p className="text-muted-foreground">
                Need help? Check your DNS at{" "}
                <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  dnschecker.org
                </a>
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
