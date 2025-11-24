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

    const formData = await req.formData();
    const artistId = formData.get('artist_id') as string;
    const autoPublish = formData.get('auto_publish') === 'true';
    const tags = formData.get('tags') as string;
    const tagArray = tags ? tags.split(',').map(t => t.trim()) : [];

    // Get all files from FormData
    const files: Array<{ file: File; title: string; duration: number; description?: string }> = [];
    let fileIndex = 0;
    
    while (formData.has(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File;
      const title = formData.get(`title_${fileIndex}`) as string;
      const duration = parseInt(formData.get(`duration_${fileIndex}`) as string);
      const description = formData.get(`description_${fileIndex}`) as string;
      
      files.push({ file, title, duration, description });
      fileIndex++;
    }

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Admin Bulk Upload] Processing ${files.length} files for artist ${artistId}`);

    // Verify artist exists
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, display_name')
      .eq('id', artistId)
      .single();

    if (artistError || !artist) {
      return new Response(
        JSON.stringify({ error: 'Artist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const { file, title, duration, description } = files[i];
      
      try {
        console.log(`[Admin Bulk Upload] Uploading file ${i + 1}/${files.length}: ${title}`);

        // Upload to Cloudinary
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('upload_preset', 'mobile_recordings');
        cloudinaryFormData.append('resource_type', 'video');
        cloudinaryFormData.append('folder', `artists/${artistId}/audio`);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
          { method: 'POST', body: cloudinaryFormData }
        );

        if (!cloudinaryResponse.ok) {
          const errorText = await cloudinaryResponse.text();
          console.error(`[Admin Bulk Upload] Cloudinary upload failed for ${title}:`, errorText);
          results.push({
            title,
            success: false,
            error: 'Cloudinary upload failed'
          });
          continue;
        }

        const cloudinaryData = await cloudinaryResponse.json();

        // Create audio track entry with admin override
        const { data: audioTrack, error: insertError } = await supabase
          .from('audio_tracks')
          .insert({
            artist_id: artistId,
            title,
            description: description || null,
            audio_url: cloudinaryData.secure_url,
            cloudinary_public_id: cloudinaryData.public_id,
            cloudinary_resource_type: 'video',
            duration: duration || null,
            tags: tagArray.length > 0 ? tagArray : null,
            moderation_status: 'approved', // Admin override
            status: autoPublish ? 'published' : 'draft',
            published_at: autoPublish ? new Date().toISOString() : null,
            source_type: 'admin_bulk_upload'
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Admin Bulk Upload] DB insert failed for ${title}:`, insertError);
          results.push({
            title,
            success: false,
            error: insertError.message
          });
          continue;
        }

        console.log(`[Admin Bulk Upload] Successfully created audio track ${audioTrack.id}: ${title}`);
        results.push({
          title,
          success: true,
          audio_track_id: audioTrack.id
        });

      } catch (fileError) {
        console.error(`[Admin Bulk Upload] Error processing ${title}:`, fileError);
        results.push({
          title,
          success: false,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        });
      }
    }

    // Audit log
    await supabase.from('audit').insert({
      actor_id: user.id,
      entity: 'audio_tracks',
      action: 'admin_bulk_upload',
      diff: {
        artist_id: artistId,
        files_count: files.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        total: files.length,
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
