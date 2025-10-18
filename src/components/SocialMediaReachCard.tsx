import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Youtube, Music, Instagram, Facebook, Video, Tv, 
  Linkedin, Twitter, CloudRain, Disc, TrendingUp 
} from "lucide-react";
import { SocialStat } from "@/hooks/useSocialStats";

interface SocialMediaReachCardProps {
  stats: SocialStat[];
  loading?: boolean;
}

const platformIcons: { [key: string]: any } = {
  youtube: Youtube,
  spotify: Music,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Video,
  twitch: Tv,
  linkedin: Linkedin,
  twitter: Twitter,
  soundcloud: CloudRain,
  bandcamp: Disc,
};

const platformColors: { [key: string]: string } = {
  youtube: 'text-red-500',
  spotify: 'text-green-500',
  instagram: 'text-pink-500',
  facebook: 'text-blue-600',
  tiktok: 'text-slate-900',
  twitch: 'text-purple-500',
  linkedin: 'text-blue-700',
  twitter: 'text-slate-900',
  soundcloud: 'text-orange-500',
  bandcamp: 'text-cyan-600',
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
};

export const SocialMediaReachCard = ({ stats, loading }: SocialMediaReachCardProps) => {
  const navigate = useNavigate();
  
  const totalFollowers = stats.reduce((sum, stat) => sum + stat.followers_count, 0);
  const platformCount = stats.length;
  const topPlatforms = stats.slice(0, 4);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Social Media Reach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading stats...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Social Media Reach
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="mb-4">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          </div>
          <h3 className="font-semibold mb-2">Track your social media growth</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your follower counts and stats to showcase your reach and amplify your voice across platforms.
          </p>
          <Button onClick={() => navigate('/profile')}>
            Add Your Stats
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Social Media Reach
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <div>
              <div className="text-3xl font-bold">{formatNumber(totalFollowers)}</div>
              <div className="text-sm text-muted-foreground">Total Followers</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-muted-foreground">{platformCount}</div>
              <div className="text-xs text-muted-foreground">Platforms</div>
            </div>
          </div>
          
          {topPlatforms.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Top Platforms:</div>
              <div className="grid grid-cols-2 gap-2">
                {topPlatforms.map((stat) => {
                  const Icon = platformIcons[stat.platform];
                  const colorClass = platformColors[stat.platform];
                  
                  return (
                    <div key={stat.id} className="flex items-center gap-2 text-sm">
                      {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
                      <span className="capitalize">{stat.platform}:</span>
                      <span className="font-semibold">{formatNumber(stat.followers_count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
              Manage Stats
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
