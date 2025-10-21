import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface SEOCompletenessProps {
  artist: {
    bio_short: string | null;
    socials: any;
  };
  faqs: any[];
  portSettings: {
    background_type?: string;
    background_value?: string;
  } | null;
}

export const SEOCompleteness = ({ artist, faqs, portSettings }: SEOCompletenessProps) => {
  const checks = [
    {
      id: "bio",
      label: "Short Bio",
      completed: !!artist.bio_short && artist.bio_short.length > 0,
      weight: 20,
    },
    {
      id: "faqs",
      label: "FAQ Section (8 questions)",
      completed: faqs.filter(f => f.is_visible).length >= 8,
      weight: 30,
      detail: `${faqs.filter(f => f.is_visible).length}/8 FAQs completed`,
    },
    {
      id: "socials",
      label: "Social Links",
      completed: artist.socials && Object.values(artist.socials).filter(v => v).length >= 2,
      weight: 20,
      detail: artist.socials 
        ? `${Object.values(artist.socials).filter(v => v).length} links added`
        : "0 links added",
    },
    {
      id: "background",
      label: "Custom Background",
      completed: portSettings?.background_type !== "color" || 
                 (portSettings?.background_value && portSettings.background_value !== "#000000"),
      weight: 20,
    },
    {
      id: "custom_domain",
      label: "Custom Domain ★ Bonus",
      completed: !!(portSettings as any)?.custom_domain_verified,
      weight: 10,
      detail: (portSettings as any)?.custom_domain_verified 
        ? `Verified: ${(portSettings as any).custom_domain}`
        : "Connect your own domain for better branding",
    },
  ];

  const completedWeight = checks
    .filter(c => c.completed)
    .reduce((sum, c) => sum + c.weight, 0);
  
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const percentage = Math.round((completedWeight / totalWeight) * 100);

  const getStatusColor = () => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getStatusMessage = () => {
    if (percentage >= 80) return "Excellent! Your port is well-optimized for discovery.";
    if (percentage >= 50) return "Good progress! Complete remaining items for better discoverability.";
    return "Getting started. Complete these items to maximize your reach.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Discovery Optimization</CardTitle>
        <CardDescription>
          Maximize your discoverability on search engines, AI assistants, and voice platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Optimization Score</span>
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {getStatusMessage()}
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-3 pt-2">
          {checks.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {check.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${check.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {check.label}
                </p>
                {check.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {check.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        {percentage < 100 && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-4">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Pro tip
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Completing all items helps search engines and AI assistants accurately represent your work to potential members.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
