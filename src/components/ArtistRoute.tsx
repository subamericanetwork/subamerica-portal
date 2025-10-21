import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ArtistRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [isArtist, setIsArtist] = useState<boolean | null>(null);

  useEffect(() => {
    const checkArtistRole = async () => {
      if (!user) {
        setIsArtist(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'artist'
      });

      if (error) {
        console.error('Artist check error:', error);
        setIsArtist(false);
      } else {
        setIsArtist(data);
      }
    };

    checkArtistRole();
  }, [user]);

  if (authLoading || isArtist === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isArtist) {
    return <Navigate to="/become-artist" replace />;
  }

  return <>{children}</>;
};

export default ArtistRoute;
