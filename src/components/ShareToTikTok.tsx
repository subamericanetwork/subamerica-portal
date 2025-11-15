import { Button } from "./ui/button";
import { toast } from "sonner";

interface ShareToTikTokProps {
  url: string;
  title?: string;
  description?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const ShareToTikTok = ({ 
  url, 
  title = "", 
  description = "",
  variant = "outline",
  size = "sm",
  className = ""
}: ShareToTikTokProps) => {
  
  const handleShare = async () => {
    const shareText = `${title}${description ? ' - ' + description : ''}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(shareText);
    
    // TikTok Share Kit deep link
    const tiktokShareUrl = `https://www.tiktok.com/share?url=${encodedUrl}&text=${encodedText}&utm_source=subamerica&utm_medium=share&utm_campaign=artist_share`;

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Check this out on Subamerica',
          text: shareText,
          url: url
        });
        toast.success('Shared successfully!');
        return;
      } catch (error) {
        // User cancelled or share failed, continue to fallback
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }

    // Fallback: Open TikTok in new tab
    window.open(tiktokShareUrl, '_blank');
    toast.success('Opening TikTok share dialog...');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
    >
      <svg 
        className="h-4 w-4 mr-2" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
      Share to TikTok
    </Button>
  );
};
