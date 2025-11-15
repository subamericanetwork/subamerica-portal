import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get artist ID
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (artistError || !artist) {
      return new Response(JSON.stringify({ error: 'Artist not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, provider, credentials } = await req.json();

    if (action === 'connect') {
      // Validate credentials with provider API
      let isValid = false;
      
      if (provider === 'mux') {
        // Validate Mux credentials
        const muxAuth = btoa(`${credentials.tokenId}:${credentials.tokenSecret}`);
        const muxResponse = await fetch('https://api.mux.com/video/v1/live-streams?limit=1', {
          headers: {
            'Authorization': `Basic ${muxAuth}`,
          }
        });
        isValid = muxResponse.ok;
      } else if (provider === 'livepush') {
        // Validate Livepush credentials
        const livepushResponse = await fetch('https://api.livepush.io/v1/streams', {
          headers: {
            'X-API-Key': credentials.clientId,
            'X-API-Secret': credentials.clientSecret,
          }
        });
        isValid = livepushResponse.ok;
      }

      if (!isValid) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid credentials. Please check your API keys and try again.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Encrypt credentials (basic encryption - in production use proper encryption)
      const encryptedCredentials = btoa(JSON.stringify(credentials));

      // Store credentials
      const { error: insertError } = await supabase
        .from('artist_streaming_credentials')
        .upsert({
          artist_id: artist.id,
          provider,
          encrypted_credentials: encryptedCredentials,
          is_active: true,
          last_validated_at: new Date().toISOString(),
        }, {
          onConflict: 'artist_id,provider'
        });

      if (insertError) {
        console.error('Error storing credentials:', insertError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to store credentials' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Credentials connected successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'disconnect') {
      // Deactivate credentials
      const { error: updateError } = await supabase
        .from('artist_streaming_credentials')
        .update({ is_active: false })
        .eq('artist_id', artist.id)
        .eq('provider', provider);

      if (updateError) {
        console.error('Error disconnecting credentials:', updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to disconnect credentials' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Credentials disconnected successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in manage-streaming-credentials:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
