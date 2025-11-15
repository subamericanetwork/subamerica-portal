import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const StreamingWebhookSetup = () => {
  const [copied, setCopied] = useState(false);
  const webhookUrl = "https://hxzjhhsvssqrjlmbeokn.supabase.co/functions/v1/mux-webhook";

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-orange-900 dark:text-orange-100">
              Webhook Configuration Required
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Configure Mux webhooks to automatically update stream status
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle className="text-sm font-medium">Why is this needed?</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Webhooks allow Mux to notify your app when your stream goes live or ends. Without this, you'll need to manually update stream status.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">Webhook URL:</p>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs break-all">
              {webhookUrl}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={copyWebhookUrl}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Setup Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Go to Mux Dashboard → Settings → Webhooks</li>
            <li>Click "Create new webhook"</li>
            <li>Paste the webhook URL above</li>
            <li>Select events: <code className="text-xs">video.live_stream.active</code>, <code className="text-xs">video.live_stream.idle</code></li>
            <li>Save the webhook</li>
          </ol>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open('https://dashboard.mux.com/settings/webhooks', '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Mux Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};
