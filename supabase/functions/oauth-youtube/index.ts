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

    const { data: artist } = await supabaseClient
      .from('artists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!artist) throw new Error('Artist profile not found');

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-youtube/callback`;

    if (pathname.endsWith('/authorize')) {
      const state = crypto.randomUUID();
      
      await supabaseClient
        .from('oauth_states')
        .insert({ state, user_id: user.id, platform: 'youtube', expires_at: new Date(Date.now() + 600000).toISOString() });

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
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

      const { data: stateRecord } = await supabaseClient
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .eq('user_id', user.id)
        .single();

      if (!stateRecord) throw new Error('Invalid state');

      // Exchange code for token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || tokenData.error) {
        throw new Error(tokenData.error_description || 'Failed to get access token');
      }

      // Get channel info
      const channelResponse = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const channelData = await channelResponse.json();

      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('No YouTube channel found');
      }

      const channel = channelData.items[0];

      // Store tokens
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      await supabaseClient
        .from('social_auth')
        .upsert({
          artist_id: artist.id,
          platform: 'youtube',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          platform_user_id: channel.id,
          platform_username: channel.snippet.title,
          is_active: true,
        }, {
          onConflict: 'artist_id,platform'
        });

      await supabaseClient
        .from('oauth_states')
        .delete()
        .eq('state', state);

      const callbackUrl = `${url.origin}/oauth-callback?platform=youtube&success=true`;
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
    console.error('YouTube OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const callbackUrl = `${new URL(req.url).origin}/oauth-callback?platform=youtube&success=false&error=${encodeURIComponent(errorMessage)}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': callbackUrl,
      },
    });
  }
});
