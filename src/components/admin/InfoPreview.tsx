import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InfoPreviewProps {
  artistId: string;
  onUpdate: (data: {
    artist_name: string;
    avatar_url?: string;
    bio?: string;
    social_links?: Array<{ platform: string; url: string }>;
  }) => void;
  initialBio?: string;
}

export function InfoPreview({ artistId, onUpdate, initialBio }: InfoPreviewProps) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customBio, setCustomBio] = useState(initialBio || '');
  const { toast } = useToast();

  useEffect(() => {
    fetchArtist();
  }, [artistId]);

  const fetchArtist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      if (error) throw error;
      
      setArtist(data);
      if (!customBio && data.bio_short) {
        setCustomBio(data.bio_short);
      }
      
      // Auto-populate data
      const socials = data.socials as any || {};
      const socialLinks = Object.entries(socials)
        .filter(([_, url]) => url)
        .map(([platform, url]) => ({ platform, url: url as string }));

      onUpdate({
        artist_name: data.display_name,
        avatar_url: socials.avatar || socials.profile_image,
        bio: customBio || data.bio_short || '',
        social_links: socialLinks,
      });
    } catch (error: any) {
      toast({
        title: "Error loading artist info",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBioChange = (newBio: string) => {
    setCustomBio(newBio);
    const socials = artist?.socials as any || {};
    const socialLinks = Object.entries(socials)
      .filter(([_, url]) => url)
      .map(([platform, url]) => ({ platform, url: url as string }));

    onUpdate({
      artist_name: artist?.display_name || '',
      avatar_url: socials.avatar || socials.profile_image,
      bio: newBio,
      social_links: socialLinks,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Artist information not found</p>
      </div>
    );
  }

  const socials = artist.socials as any || {};
  const avatarUrl = socials.avatar || socials.profile_image;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="info-bio">Bio Snippet (shown in overlay)</Label>
        <Textarea
          id="info-bio"
          value={customBio}
          onChange={(e) => handleBioChange(e.target.value)}
          placeholder="A short bio about yourself..."
          rows={3}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          {customBio.length}/200 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={artist.display_name} />
              <AvatarFallback>{artist.display_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{artist.display_name}</h4>
              {customBio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {customBio}
                </p>
              )}
            </div>
          </div>
          <Button size="sm" variant="secondary" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Artist Port
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>Artist name and avatar are automatically pulled from your profile.</p>
        <p className="mt-1">Social links will be included if configured in your profile.</p>
      </div>
    </div>
  );
}
