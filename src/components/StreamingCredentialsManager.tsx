import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Unplug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamingCredentialsManagerProps {
  artistId: string;
  provider: "mux" | "livepush";
}

export const StreamingCredentialsManager = ({ artistId, provider }: StreamingCredentialsManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastValidated, setLastValidated] = useState<string | null>(null);
  
  // Mux credentials
  const [muxTokenId, setMuxTokenId] = useState("");
  const [muxTokenSecret, setMuxTokenSecret] = useState("");
  
  // Livepush credentials
  const [livepushClientId, setLivepushClientId] = useState("");
  const [livepushClientSecret, setLivepushClientSecret] = useState("");

  useEffect(() => {
    checkConnection();
  }, [artistId, provider]);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("artist_streaming_credentials")
        .select("is_active, last_validated_at")
        .eq("artist_id", artistId)
        .eq("provider", provider)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setIsConnected(data.is_active);
        setLastValidated(data.last_validated_at);
      } else {
        setIsConnected(false);
        setLastValidated(null);
      }
    } catch (error) {
      console.error("Error checking credentials:", error);
      toast.error("Failed to check credentials");
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const credentials = provider === "mux" 
        ? { tokenId: muxTokenId, tokenSecret: muxTokenSecret }
        : { clientId: livepushClientId, clientSecret: livepushClientSecret };

      const { data, error } = await supabase.functions.invoke("manage-streaming-credentials", {
        body: {
          action: "connect",
          provider,
          credentials,
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(`${provider === "mux" ? "Mux" : "Livepush"} account connected successfully!`);
        setIsConnected(true);
        setLastValidated(new Date().toISOString());
        // Clear sensitive inputs
        setMuxTokenId("");
        setMuxTokenSecret("");
        setLivepushClientId("");
        setLivepushClientSecret("");
      } else {
        throw new Error(data.error || "Failed to connect account");
      }
    } catch (error: any) {
      console.error("Error connecting credentials:", error);
      toast.error(error.message || "Failed to connect account");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-streaming-credentials", {
        body: {
          action: "disconnect",
          provider,
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(`${provider === "mux" ? "Mux" : "Livepush"} account disconnected`);
        setIsConnected(false);
        setLastValidated(null);
      } else {
        throw new Error(data.error || "Failed to disconnect account");
      }
    } catch (error: any) {
      console.error("Error disconnecting credentials:", error);
      toast.error(error.message || "Failed to disconnect account");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {provider === "mux" ? "Mux" : "Livepush"} Connected
              </CardTitle>
              <CardDescription>
                {lastValidated && `Last validated: ${new Date(lastValidated).toLocaleString()}`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Your {provider === "mux" ? "Mux" : "Livepush"} account is connected. You can now stream using your own credentials without using Subamerica's streaming minutes.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={loading}
            className="mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              Connect {provider === "mux" ? "Mux" : "Livepush"} Account
            </CardTitle>
            <CardDescription>
              Use your own {provider === "mux" ? "Mux" : "Livepush"} account to stream without minute limits
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Not Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            {provider === "mux" ? (
              <>
                Enter your Mux access token credentials. You can create these in your{" "}
                <a href="https://dashboard.mux.com/settings/access-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Mux Dashboard
                </a>.
              </>
            ) : (
              <>
                Enter your Livepush API credentials. You can find these in your Livepush dashboard.
              </>
            )}
          </AlertDescription>
        </Alert>

        {provider === "mux" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="mux-token-id">Token ID</Label>
              <Input
                id="mux-token-id"
                type="text"
                value={muxTokenId}
                onChange={(e) => setMuxTokenId(e.target.value)}
                placeholder="Enter your Mux Token ID"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mux-token-secret">Token Secret</Label>
              <Input
                id="mux-token-secret"
                type="password"
                value={muxTokenSecret}
                onChange={(e) => setMuxTokenSecret(e.target.value)}
                placeholder="Enter your Mux Token Secret"
                disabled={loading}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="livepush-client-id">Client ID</Label>
              <Input
                id="livepush-client-id"
                type="text"
                value={livepushClientId}
                onChange={(e) => setLivepushClientId(e.target.value)}
                placeholder="Enter your Livepush Client ID"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livepush-client-secret">Client Secret</Label>
              <Input
                id="livepush-client-secret"
                type="password"
                value={livepushClientSecret}
                onChange={(e) => setLivepushClientSecret(e.target.value)}
                placeholder="Enter your Livepush Client Secret"
                disabled={loading}
              />
            </div>
          </>
        )}

        <Button
          onClick={handleConnect}
          disabled={loading || (provider === "mux" ? (!muxTokenId || !muxTokenSecret) : (!livepushClientId || !livepushClientSecret))}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Account"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
