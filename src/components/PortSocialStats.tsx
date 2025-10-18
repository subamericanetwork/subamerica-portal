import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Facebook, Twitter, Youtube, Linkedin, Music2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SocialStat {
  id: string;
  platform: string;
  profile_url: string | null;
  followers_count: number;
  is_visible: boolean;
  show_stats: boolean;
}

interface PortSocialStatsProps {
  artistId: string;
}

const platformConfig: Record<string, { icon: any; label: string; colorClass: string }> = {
  instagram: { icon: Instagram, label: "Instagram", colorClass: "text-pink-500" },
  facebook: { icon: Facebook, label: "Facebook", colorClass: "text-blue-600" },
  twitter: { icon: Twitter, label: "Twitter", colorClass: "text-sky-500" },
  youtube: { icon: Youtube, label: "YouTube", colorClass: "text-red-600" },
  linkedin: { icon: Linkedin, label: "LinkedIn", colorClass: "text-blue-700" },
  spotify: { icon: Music2, label: "Spotify", colorClass: "text-green-500" },
  other: { icon: Globe, label: "Website", colorClass: "text-gray-500" },
};

export const PortSocialStats = ({ artistId }: PortSocialStatsProps) => {
  const [stats, setStats] = useState<SocialStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("artist_social_stats")
          .select("*")
          .eq("artist_id", artistId)
          .eq("is_visible", true)
          .order("platform");

        if (error) throw error;
        setStats(data || []);
      } catch (error) {
        console.error("Error fetching social stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [artistId]);

  if (loading || stats.length === 0) {
    return null;
  }

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {stats.map((stat) => {
        const config = platformConfig[stat.platform.toLowerCase()] || platformConfig.other;
        const Icon = config.icon;

        return (
          <a
            key={stat.id}
            href={stat.profile_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border/50 hover:bg-card hover:border-border transition-all group"
          >
            <Icon className={`h-5 w-5 ${config.colorClass} group-hover:scale-110 transition-transform`} />
            {stat.show_stats && stat.followers_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {formatFollowers(stat.followers_count)}
              </Badge>
            )}
          </a>
        );
      })}
    </div>
  );
};
