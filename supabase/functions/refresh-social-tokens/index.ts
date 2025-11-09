import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (_req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get tokens expiring in next 24 hours
    const expiryThreshold = new Date(Date.now() + 86400000).toISOString();
    const { data: expiringTokens } = await supabaseClient
      .from('social_auth')
      .select('*')
      .eq('is_active', true)
      .lt('expires_at', expiryThreshold);

    if (!expiringTokens || expiringTokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens to refresh' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Refreshing ${expiringTokens.length} tokens`);

    for (const auth of expiringTokens) {
      try {
        let newTokenData;

        if (auth.platform === 'tiktok') {
          const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_key: Deno.env.get('TIKTOK_CLIENT_ID')!,
              client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET')!,
              grant_type: 'refresh_token',
              refresh_token: auth.refresh_token,
            }),
          });
          newTokenData = await response.json();
          if (!response.ok) throw new Error(newTokenData.error_description);

          await supabaseClient
            .from('social_auth')
            .update({
              access_token: newTokenData.access_token,
              refresh_token: newTokenData.refresh_token,
              expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
            })
            .eq('id', auth.id);

          console.log(`Refreshed TikTok token for artist ${auth.artist_id}`);
        } 
        
        else if (auth.platform === 'youtube') {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
              client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
              refresh_token: auth.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          newTokenData = await response.json();
          if (!response.ok) throw new Error(newTokenData.error_description);

          await supabaseClient
            .from('social_auth')
            .update({
              access_token: newTokenData.access_token,
              expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
            })
            .eq('id', auth.id);

          console.log(`Refreshed YouTube token for artist ${auth.artist_id}`);
        }
        
        else if (auth.platform === 'instagram') {
          // Instagram uses long-lived tokens that need exchange
          const response = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get('META_APP_ID')}&client_secret=${Deno.env.get('META_APP_SECRET')}&fb_exchange_token=${auth.access_token}`
          );
          newTokenData = await response.json();
          if (!response.ok) throw new Error(newTokenData.error?.message);

          await supabaseClient
            .from('social_auth')
            .update({
              access_token: newTokenData.access_token,
              expires_at: new Date(Date.now() + (newTokenData.expires_in || 5184000) * 1000).toISOString(),
            })
            .eq('id', auth.id);

          console.log(`Refreshed Instagram token for artist ${auth.artist_id}`);
        }

      } catch (error) {
        console.error(`Failed to refresh ${auth.platform} token for artist ${auth.artist_id}:`, error);
        
        // Deactivate token on failure
        await supabaseClient
          .from('social_auth')
          .update({ is_active: false })
          .eq('id', auth.id);
      }
    }

    return new Response(JSON.stringify({ success: true, refreshed: expiringTokens.length }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Token refresh cron error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
