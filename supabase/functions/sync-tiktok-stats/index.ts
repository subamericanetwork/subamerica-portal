import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshToken(refreshToken: string) {
  const clientId = Deno.env.get('TIKTOK_CLIENT_ID');
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientId!,
      client_secret: clientSecret!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error('Failed to refresh token');
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting TikTok stats sync...');

    // Get all active TikTok connections
    const { data: connections } = await supabaseClient
      .from('social_auth')
      .select('*')
      .eq('platform', 'tiktok')
      .eq('is_active', true);

    if (!connections || connections.length === 0) {
      console.log('No active TikTok connections found');
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: 'No connections to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${connections.length} TikTok connections to sync`);
    let syncedCount = 0;
    const errors: any[] = [];

    for (const auth of connections) {
      try {
        let accessToken = auth.access_token;

        // Refresh token if expiring soon
        const expiresAt = new Date(auth.expires_at);
        if (expiresAt.getTime() - Date.now() < 3600000) {
          console.log(`Refreshing token for artist ${auth.artist_id}`);
          const newTokens = await refreshToken(auth.refresh_token);
          await supabaseClient
            .from('social_auth')
            .update({
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
              expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            })
            .eq('id', auth.id);
          accessToken = newTokens.access_token;
        }

        // Fetch user stats
        const userInfoResponse = await fetch(
          'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,username,display_name',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const userInfo = await userInfoResponse.json();

        if (!userInfoResponse.ok || userInfo.error) {
          console.error(`Failed to fetch stats for artist ${auth.artist_id}:`, userInfo.error);
          errors.push({ artist_id: auth.artist_id, error: userInfo.error?.message });
          continue;
        }

        const userData = userInfo?.data?.user || {};

        // Update artist_social_stats
        if (userData.follower_count !== undefined) {
          await supabaseClient
            .from('artist_social_stats')
            .upsert({
              artist_id: auth.artist_id,
              platform: 'tiktok',
              followers_count: userData.follower_count,
              profile_url: `https://www.tiktok.com/@${userData.username || userData.display_name}`,
              metrics: {
                following_count: userData.following_count || 0,
                likes_count: userData.likes_count || 0,
                video_count: userData.video_count || 0,
              },
              is_visible: true,
              show_stats: true,
              last_updated: new Date().toISOString(),
            }, {
              onConflict: 'artist_id,platform'
            });

          syncedCount++;
          console.log(`Synced stats for artist ${auth.artist_id}: ${userData.follower_count} followers`);
        }

      } catch (error) {
        console.error(`Error syncing artist ${auth.artist_id}:`, error);
        errors.push({ 
          artist_id: auth.artist_id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log(`Sync complete: ${syncedCount} successful, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        total: connections.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync TikTok stats error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
