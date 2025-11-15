import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get artist_id for this user
    const { data: artist } = await supabaseClient
      .from('artists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!artist) throw new Error('Artist profile not found');

    const clientId = Deno.env.get('TIKTOK_CLIENT_ID');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-tiktok/callback`;

    if (pathname.endsWith('/authorize')) {
      const state = crypto.randomUUID();
      
      // Store state for verification
      await supabaseClient
        .from('oauth_states')
        .insert({ state, user_id: user.id, platform: 'tiktok', expires_at: new Date(Date.now() + 600000).toISOString() });

      const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authUrl.searchParams.set('client_key', clientId!);
      authUrl.searchParams.set('scope', 'user.info.basic,video.upload,video.publish,artist.certification.read,user.info.profile');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': authUrl.toString(),
        },
      });
    }

    if (pathname.endsWith('/callback')) {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        throw new Error('Missing code or state');
      }

      // Verify state
      const { data: stateRecord } = await supabaseClient
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .eq('user_id', user.id)
        .single();

      if (!stateRecord) throw new Error('Invalid state');

      // Exchange code for token
      const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: clientId!,
          client_secret: clientSecret!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || tokenData.error) {
        throw new Error(tokenData.error_description || 'Failed to get access token');
      }

      // Get user info including verification status
      const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,is_verified', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const userInfo = await userInfoResponse.json();
      const isVerified = userInfo?.data?.user?.is_verified || false;

      // Store tokens in social_auth
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      await supabaseClient
        .from('social_auth')
        .upsert({
          artist_id: artist.id,
          platform: 'tiktok',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          platform_user_id: userInfo.data.user.open_id,
          platform_username: userInfo.data.user.display_name,
          platform_verified: isVerified,
          is_active: true,
        }, {
          onConflict: 'artist_id,platform'
        });

      // Clean up state
      await supabaseClient
        .from('oauth_states')
        .delete()
        .eq('state', state);

      const callbackUrl = `${url.origin}/oauth-callback?platform=tiktok&success=true`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': callbackUrl,
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TikTok OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const callbackUrl = `${new URL(req.url).origin}/oauth-callback?platform=tiktok&success=false&error=${encodeURIComponent(errorMessage)}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': callbackUrl,
      },
    });
  }
});
