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
    const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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

    const formData = await req.formData();
    const file = formData.get('file');
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const mediaType = formData.get('media_type') as string; // 'video' or 'audio'
    const artistId = formData.get('artist_id') as string;
    const durationSeconds = parseInt(formData.get('duration_seconds') as string);

    // Validate duration limits
    const maxDuration = mediaType === 'audio' ? 600 : 300; // 10min audio, 5min video
    if (durationSeconds > maxDuration) {
      return new Response(
        JSON.stringify({ error: 'Duration exceeds limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify artist ownership
    const { data: artist } = await supabase
      .from('artists')
      .select('is_verified, user_id')
      .eq('id', artistId)
      .single();

    if (!artist || artist.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file!);
    cloudinaryFormData.append('upload_preset', 'mobile_recordings');
    cloudinaryFormData.append('resource_type', 'video');

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      { method: 'POST', body: cloudinaryFormData }
    );

    if (!cloudinaryResponse.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }

    const cloudinaryData = await cloudinaryResponse.json();

    // Auto-approve for verified artists
    const approvalStatus = artist.is_verified ? 'approved' : 'pending_moderation';

    // Create entry in videos or audio_tracks table
    const tableName = mediaType === 'video' ? 'videos' : 'audio_tracks';
    const mediaField = mediaType === 'video' ? 'video_url' : 'audio_url';

    const { data: mediaEntry } = await supabase
      .from(tableName)
      .insert({
        artist_id: artistId,
        title,
        description,
        [mediaField]: cloudinaryData.secure_url,
        cloudinary_public_id: cloudinaryData.public_id,
        cloudinary_resource_type: 'video',
        source_type: 'mobile_recording',
        recorded_on_mobile: true,
        recording_duration_seconds: durationSeconds,
        moderation_status: approvalStatus,
        status: approvalStatus === 'approved' ? 'published' : 'draft'
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        media_id: mediaEntry.id,
        requires_moderation: approvalStatus === 'pending_moderation'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Upload Mobile Recording] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});