import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check admin role
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('[Admin Bulk Upload] Not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON payload (not FormData anymore)
    const payload = await req.json();
    const { artist_id, auto_publish, tags, tracks } = payload;

    if (!artist_id || !tracks || tracks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: artist_id and tracks required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Admin Bulk Upload] Processing ${tracks.length} tracks for artist ${artist_id}`);

    // Verify artist exists
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, display_name')
      .eq('id', artist_id)
      .single();

    if (artistError || !artist) {
      return new Response(
        JSON.stringify({ error: 'Artist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tagArray = tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
    const results = [];

    // Process each track (just database inserts now)
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      try {
        console.log(`[Admin Bulk Upload] Creating DB entry ${i + 1}/${tracks.length}: ${track.title}`);

        // Create audio track entry with admin override
        const { data: audioTrack, error: insertError } = await supabase
          .from('audio_tracks')
          .insert({
            artist_id,
            title: track.title,
            description: track.description || null,
            audio_url: track.audio_url,
            cloudinary_public_id: track.cloudinary_public_id,
            cloudinary_resource_type: track.cloudinary_resource_type || 'video',
            duration: track.duration || null,
            tags: tagArray.length > 0 ? tagArray : null,
            moderation_status: 'approved', // Admin override
            status: auto_publish ? 'published' : 'draft',
            published_at: auto_publish ? new Date().toISOString() : null,
            source_type: 'admin_bulk_upload'
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Admin Bulk Upload] DB insert failed for ${track.title}:`, insertError);
          results.push({
            title: track.title,
            success: false,
            error: insertError.message
          });
          continue;
        }

        console.log(`[Admin Bulk Upload] Successfully created audio track ${audioTrack.id}: ${track.title}`);
        results.push({
          title: track.title,
          success: true,
          audio_track_id: audioTrack.id
        });

      } catch (trackError) {
        console.error(`[Admin Bulk Upload] Error processing ${track.title}:`, trackError);
        results.push({
          title: track.title,
          success: false,
          error: trackError instanceof Error ? trackError.message : 'Unknown error'
        });
      }
    }

    // Audit log
    await supabase.from('audit').insert({
      actor_id: user.id,
      entity: 'audio_tracks',
      action: 'admin_bulk_upload',
      diff: {
        artist_id,
        tracks_count: tracks.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        total: tracks.length,
        successful: successCount,
        failed: failedCount,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Admin Bulk Upload] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
