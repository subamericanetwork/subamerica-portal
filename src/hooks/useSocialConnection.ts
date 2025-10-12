import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSocialConnection = () => {
  const queryClient = useQueryClient();

  const disconnect = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("social_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-analytics"] });
      toast.success("Platform disconnected successfully");
    },
    onError: () => {
      toast.error("Failed to disconnect platform");
    },
  });

  const syncNow = useMutation({
    mutationFn: async ({ platform, artistId }: { platform: string; artistId: string }) => {
      // This will call the edge function when OAuth is implemented
      toast.info("Manual sync will be available once OAuth is configured");
      return null;
    },
  });

  const initiateConnection = (platform: "instagram" | "facebook") => {
    // This will redirect to OAuth flow when implemented
    toast.info(`${platform} connection will be available once OAuth is configured`);
  };

  return {
    initiateConnection,
    disconnect: disconnect.mutate,
    syncNow: syncNow.mutate,
    isDisconnecting: disconnect.isPending,
    isSyncing: syncNow.isPending,
  };
};
