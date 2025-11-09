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

    const appId = Deno.env.get('META_APP_ID');
    const appSecret = Deno.env.get('META_APP_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-instagram/callback`;

    if (pathname.endsWith('/authorize')) {
      const state = crypto.randomUUID();
      
      await supabaseClient
        .from('oauth_states')
        .insert({ state, user_id: user.id, platform: 'instagram', expires_at: new Date(Date.now() + 600000).toISOString() });

      const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      authUrl.searchParams.set('client_id', appId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list');
      authUrl.searchParams.set('response_type', 'code');
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
      const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', appId!);
      tokenUrl.searchParams.set('client_secret', appSecret!);
      tokenUrl.searchParams.set('redirect_uri', redirectUri);
      tokenUrl.searchParams.set('code', code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || tokenData.error) {
        throw new Error(tokenData.error?.message || 'Failed to get access token');
      }

      // Get long-lived token
      const longTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
      longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
      longTokenUrl.searchParams.set('client_id', appId!);
      longTokenUrl.searchParams.set('client_secret', appSecret!);
      longTokenUrl.searchParams.set('fb_exchange_token', tokenData.access_token);

      const longTokenResponse = await fetch(longTokenUrl.toString());
      const longTokenData = await longTokenResponse.json();

      // Get Instagram Business Account
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${longTokenData.access_token}`
      );
      const pagesData = await pagesResponse.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook Pages found. Please connect a Facebook Page with an Instagram Business account.');
      }

      const pageId = pagesData.data[0].id;
      const pageAccessToken = pagesData.data[0].access_token;

      // Get Instagram account connected to page
      const igAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igAccountData = await igAccountResponse.json();

      if (!igAccountData.instagram_business_account) {
        throw new Error('No Instagram Business account connected to your Facebook Page.');
      }

      const igUserId = igAccountData.instagram_business_account.id;

      // Get Instagram username
      const igUserResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}?fields=username&access_token=${pageAccessToken}`
      );
      const igUserData = await igUserResponse.json();

      // Store tokens
      const expiresAt = new Date(Date.now() + (longTokenData.expires_in || 5184000) * 1000);
      await supabaseClient
        .from('social_auth')
        .upsert({
          artist_id: artist.id,
          platform: 'instagram',
          access_token: pageAccessToken,
          refresh_token: null,
          expires_at: expiresAt.toISOString(),
          platform_user_id: igUserId,
          platform_username: igUserData.username,
          is_active: true,
        }, {
          onConflict: 'artist_id,platform'
        });

      await supabaseClient
        .from('oauth_states')
        .delete()
        .eq('state', state);

      const callbackUrl = `${url.origin}/oauth-callback?platform=instagram&success=true`;
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
    console.error('Instagram OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const callbackUrl = `${new URL(req.url).origin}/oauth-callback?platform=instagram&success=false&error=${encodeURIComponent(errorMessage)}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': callbackUrl,
      },
    });
  }
});
