import { Button } from "@/components/ui/button";
import { Heart, UserPlus, Share2 } from "lucide-react";
import { toast } from "sonner";

interface PortFooterActionsProps {
  artistId: string;
  artistName: string;
  artistSlug: string;
  socials?: Record<string, unknown> | null;
}

export const PortFooterActions = ({ 
  artistId, 
  artistName, 
  artistSlug,
  socials 
}: PortFooterActionsProps) => {
  
  const handleTip = () => {
    // Navigate to tip section or open payment modal
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
      toast.info("Tip options coming soon!");
    }
  };

  const handleFollow = () => {
    // Open social links or subscription modal
    if (socials && Object.keys(socials).length > 0) {
      const footerSection = document.getElementById('footer');
      if (footerSection) {
        footerSection.scrollIntoView({ behavior: 'smooth' });
        toast.success("Check out the social links below!");
      }
    } else {
      toast.info("Follow options coming soon!");
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${artistSlug}`;
    const shareData = {
      title: `${artistName} - Artist Port`,
      text: `Check out ${artistName}'s portfolio!`,
      url: shareUrl,
    };

    // Try Web Share API first
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        // User cancelled share
        if ((err as Error).name !== 'AbortError') {
          fallbackCopyToClipboard(shareUrl);
        }
      }
    } else {
      fallbackCopyToClipboard(shareUrl);
    }
  };

  const fallbackCopyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied to clipboard!"),
      () => toast.error("Failed to copy link")
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <Button 
            onClick={handleTip}
            variant="default"
            size="lg"
            className="flex-1 max-w-xs"
          >
            <Heart className="h-5 w-5 mr-2" />
            Tip
          </Button>
          
          <Button 
            onClick={handleFollow}
            variant="secondary"
            size="lg"
            className="flex-1 max-w-xs"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Follow
          </Button>
          
          <Button 
            onClick={handleShare}
            variant="outline"
            size="lg"
            className="flex-1 max-w-xs"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};
