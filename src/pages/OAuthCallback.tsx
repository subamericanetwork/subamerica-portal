import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform');
    const success = params.get('success') === 'true';
    const error = params.get('error');

    if (success) {
      toast.success(`Successfully connected ${platform}!`);
      
      // Notify parent window if in popup
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth-success', platform },
          window.location.origin
        );
        window.close();
      } else {
        // Direct redirect (not in popup)
        navigate(`/artist-portal/social-console?connected=${platform}`);
      }
    } else {
      const errorMessage = error || 'Unknown error occurred';
      toast.error(`Failed to connect ${platform}: ${errorMessage}`);
      
      if (window.opener) {
        setTimeout(() => window.close(), 3000);
      } else {
        setTimeout(() => navigate('/artist-portal/social-console'), 3000);
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing OAuth callback...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
