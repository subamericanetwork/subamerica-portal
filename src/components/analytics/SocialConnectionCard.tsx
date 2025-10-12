import { Instagram, Facebook, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface SocialConnectionCardProps {
  platform: "instagram" | "facebook";
  isConnected: boolean;
  username?: string;
  lastSynced?: string;
  onConnect: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
  isDisconnecting?: boolean;
  isSyncing?: boolean;
}

export const SocialConnectionCard = ({
  platform,
  isConnected,
  username,
  lastSynced,
  onConnect,
  onDisconnect,
  onSync,
  isDisconnecting,
  isSyncing,
}: SocialConnectionCardProps) => {
  const Icon = platform === "instagram" ? Instagram : Facebook;
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{platformName}</CardTitle>
              {username && (
                <CardDescription>@{username}</CardDescription>
              )}
            </div>
          </div>
          {isConnected ? (
            <Badge variant="default">Connected</Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lastSynced && (
            <p className="text-sm text-muted-foreground">
              Last synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
            </p>
          )}
          
          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={onConnect} className="w-full">
                Connect {platformName}
              </Button>
            ) : (
              <>
                <Button
                  onClick={onSync}
                  disabled={isSyncing}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                  variant="outline"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
