import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { multiParser } from "https://deno.land/x/multiparser@0.114.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate Cloudinary signature for authenticated uploads
async function generateCloudinarySignature(
  paramsToSign: string,
  apiSecret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign);
  const key = encoder.encode(apiSecret);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

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

    // Parse multipart form data
    const form = await multiParser(req);
    
    if (!form || !form.fields) {
      return new Response(
        JSON.stringify({ error: 'Invalid form data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artist_id = form.fields.artist_id;
    const auto_publish = form.fields.auto_publish === 'true';
    const tags = form.fields.tags || '';
    
    if (!artist_id) {
      return new Response(
        JSON.stringify({ error: 'artist_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const files = form.files || {};
    const fileCount = Object.keys(files).length;
    
    if (fileCount === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Admin Bulk Upload] Processing ${fileCount} files for artist ${artist_id}`);

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

    // Get Cloudinary credentials
    const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY');
    const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Cloudinary credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each file
    let fileIndex = 0;
    for (const [fieldName, fileData] of Object.entries(files)) {
      fileIndex++;
      
      try {
        const file = Array.isArray(fileData) ? fileData[0] : fileData;
        const title = form.fields[`title_${fieldName}`] || file.filename || `Track ${fileIndex}`;
        const description = form.fields[`description_${fieldName}`] || null;
        const duration = form.fields[`duration_${fieldName}`] ? parseInt(form.fields[`duration_${fieldName}`]) : null;

        console.log(`[Admin Bulk Upload] Processing file ${fileIndex}/${fileCount}: ${title}`);

        // Generate signed upload parameters
        const timestamp = Math.round(Date.now() / 1000).toString();
        const folder = `artists/${artist_id}/audio`;
        const resourceType = 'video';
        
        // Create the string to sign (alphabetically ordered parameters)
        const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
        const signature = await generateCloudinarySignature(paramsToSign, CLOUDINARY_API_SECRET);
        
        // Upload to Cloudinary with signed authentication
        const cloudinaryFormData = new FormData();
        const fileBlob = new Blob([file.content as BlobPart], { type: file.contentType || 'audio/mpeg' });
        cloudinaryFormData.append('file', fileBlob, file.filename);
        cloudinaryFormData.append('folder', folder);
        cloudinaryFormData.append('api_key', CLOUDINARY_API_KEY);
        cloudinaryFormData.append('timestamp', timestamp);
        cloudinaryFormData.append('signature', signature);

        console.log(`[Admin Bulk Upload] Uploading to Cloudinary: ${file.filename}`);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        if (!cloudinaryResponse.ok) {
          const errorText = await cloudinaryResponse.text();
          console.error(`[Admin Bulk Upload] Cloudinary upload failed:`, errorText);
          results.push({
            title,
            success: false,
            error: `Cloudinary upload failed: ${errorText.substring(0, 100)}`
          });
          continue;
        }

        const cloudinaryData = await cloudinaryResponse.json();
        console.log(`[Admin Bulk Upload] Cloudinary upload successful: ${cloudinaryData.public_id}`);

        // Insert into database
        const { data: audioTrack, error: insertError } = await supabase
          .from('audio_tracks')
          .insert({
            artist_id,
            title,
            description,
            audio_url: cloudinaryData.secure_url,
            cloudinary_public_id: cloudinaryData.public_id,
            cloudinary_resource_type: 'video',
            duration,
            tags: tagArray.length > 0 ? tagArray : null,
            moderation_status: 'approved', // Admin override
            status: auto_publish ? 'published' : 'draft',
            published_at: auto_publish ? new Date().toISOString() : null,
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
        console.error(`[Admin Bulk Upload] Error processing file ${fileIndex}:`, fileError);
        results.push({
          title: `File ${fileIndex}`,
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
        artist_id,
        tracks_count: fileCount,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        total: fileCount,
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
