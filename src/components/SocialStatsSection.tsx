import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useSocialStats, SOCIAL_PLATFORMS, SocialStat } from "@/hooks/useSocialStats";
import { 
  Youtube, Music, Instagram, Facebook, Video, Tv, 
  Linkedin, Twitter, CloudRain, Disc, TrendingUp, ChevronDown, ChevronUp 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const iconMap: { [key: string]: any } = {
  Youtube, Music, Instagram, Facebook, Video, Tv, Linkedin, Twitter, CloudRain, Disc
};

interface SocialStatsSectionProps {
  artistId: string;
}

export const SocialStatsSection = ({ artistId }: SocialStatsSectionProps) => {
  const { stats, loading, updateStat } = useSocialStats(artistId);
  const { toast } = useToast();
  const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>([]);
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);

  const handleExpandAll = () => {
    setExpandedPlatforms(SOCIAL_PLATFORMS.map(p => p.key));
  };

  const handleCollapseAll = () => {
    setExpandedPlatforms([]);
  };

  const getPlatformStat = (platformKey: string): SocialStat | undefined => {
    return stats.find(s => s.platform === platformKey);
  };

  const handleUpdateStat = async (
    platformKey: string,
    followers_count: number,
    profile_url: string,
    metrics: { [key: string]: any }
  ) => {
    setSavingPlatform(platformKey);
    
    const { error } = await updateStat(
      platformKey,
      followers_count,
      profile_url || undefined,
      metrics
    );

    setSavingPlatform(null);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update stats. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${platformKey.charAt(0).toUpperCase() + platformKey.slice(1)} stats updated!`,
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Social Media Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading stats...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Social Media Analytics
        </CardTitle>
        <CardDescription>
          Track your social media reach and growth. These stats help showcase your reach on your Port.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            <ChevronDown className="h-4 w-4 mr-1" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            <ChevronUp className="h-4 w-4 mr-1" />
            Collapse All
          </Button>
        </div>

        <Accordion 
          type="multiple" 
          value={expandedPlatforms}
          onValueChange={setExpandedPlatforms}
        >
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = iconMap[platform.icon];
            const existingStat = getPlatformStat(platform.key);
            const [formData, setFormData] = useState({
              followers_count: existingStat?.followers_count || 0,
              profile_url: existingStat?.profile_url || '',
              metrics: existingStat?.metrics || {},
            });

            const handleFieldChange = (fieldKey: string, value: string | number, metricsKey?: string) => {
              if (metricsKey) {
                setFormData(prev => ({
                  ...prev,
                  metrics: { ...prev.metrics, [metricsKey]: value }
                }));
              } else if (fieldKey === 'followers_count') {
                setFormData(prev => ({ ...prev, followers_count: Number(value) }));
              } else if (fieldKey === 'profile_url') {
                setFormData(prev => ({ ...prev, profile_url: String(value) }));
              }
            };

            return (
              <AccordionItem key={platform.key} value={platform.key}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className={`h-5 w-5 ${platform.colorClass}`} />}
                    <span>{platform.label}</span>
                    {existingStat && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({existingStat.followers_count.toLocaleString()} followers)
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {platform.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${platform.key}-${field.key}`}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                          id={`${platform.key}-${field.key}`}
                          type={field.type === 'url' ? 'url' : 'number'}
                          step={field.type === 'decimal' ? '0.1' : '1'}
                          min="0"
                          placeholder={field.label}
                          value={
                            field.metricsKey 
                              ? formData.metrics[field.metricsKey] || ''
                              : field.key === 'followers_count'
                              ? formData.followers_count
                              : formData.profile_url
                          }
                          onChange={(e) => handleFieldChange(field.key, e.target.value, field.metricsKey)}
                        />
                      </div>
                    ))}
                    
                    {existingStat && (
                      <div className="text-xs text-muted-foreground">
                        Last updated: {formatDistanceToNow(new Date(existingStat.last_updated), { addSuffix: true })}
                      </div>
                    )}
                    
                    <Button 
                      size="sm"
                      onClick={() => handleUpdateStat(
                        platform.key,
                        formData.followers_count,
                        formData.profile_url,
                        formData.metrics
                      )}
                      disabled={savingPlatform === platform.key || formData.followers_count <= 0}
                    >
                      {savingPlatform === platform.key ? 'Saving...' : 'Update Stats'}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};
