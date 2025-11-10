import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { qrcode } from "https://esm.sh/jsr/@libs/qrcode@3";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY');
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');

// Generate Cloudinary signature
async function generateSignature(params: Record<string, string | number>): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const message = sortedParams + CLOUDINARY_API_SECRET;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { video_id, start_time, end_time, qr_type, caption, auto_caption, orientation = 'vertical' } = await req.json();

    console.log('[create-subclip] Processing request:', { video_id, start_time, end_time, qr_type, auto_caption });

    // Validate inputs
    if (!video_id || start_time == null || end_time == null || !qr_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const duration = end_time - start_time;
    if (duration < 3 || duration > 60) {
      return new Response(JSON.stringify({ error: 'Clip duration must be between 3 and 60 seconds' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch video and verify ownership
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select('*, artists!inner(id, user_id, slug)')
      .eq('id', video_id)
      .single();

    if (videoError || !video) {
      console.error('[create-subclip] Video fetch error:', videoError);
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (video.artists.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden - not your video' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const artistSlug = video.artists.slug;

    // Generate QR code URL based on type
    const qrUrls = {
      tip: `https://subamerica.net/${artistSlug}?action=tip&utm_source=social&utm_medium=qr&utm_campaign=subclip`,
      ticket: `https://subamerica.net/${artistSlug}?action=tickets&utm_source=social&utm_medium=qr`,
      content: `https://subamerica.net/${artistSlug}?action=subscribe&utm_source=social&utm_medium=qr`,
      merch: `https://subamerica.net/${artistSlug}/merch?utm_source=social&utm_medium=qr`,
    };

    const qrUrl = qrUrls[qr_type as keyof typeof qrUrls];
    console.log('[create-subclip] Generated QR URL:', qrUrl);

    // Generate QR code using QR Server API - guarantees proper quiet zone
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(qrUrl)}&format=png&margin=50&ecc=H`;
    
    console.log('[create-subclip] Generating QR code via API with 50px margin');

    // Fetch the QR PNG from API
    const qrImageResponse = await fetch(qrApiUrl);
    if (!qrImageResponse.ok) {
      throw new Error('Failed to generate QR code from API');
    }

    const qrPngBuffer = await qrImageResponse.arrayBuffer();
    console.log('[create-subclip] QR code generated as PNG with guaranteed quiet zone');

    // Upload QR code to Cloudinary
    const qrTimestamp = Math.floor(Date.now() / 1000);
    const qrPublicId = `qr_codes/qr_${user.id}_${qrTimestamp}`;
    
    const qrUploadParams = {
      public_id: qrPublicId,
      timestamp: qrTimestamp,
      // NO eager transformations - PNG already perfect from API
    };
    
    const qrSignature = await generateSignature(qrUploadParams);
    
    const qrFormData = new FormData();
    qrFormData.append('file', new Blob([qrPngBuffer], { type: 'image/png' })); // Upload PNG buffer
    qrFormData.append('public_id', qrPublicId);
    qrFormData.append('timestamp', qrTimestamp.toString());
    qrFormData.append('api_key', CLOUDINARY_API_KEY!);
    qrFormData.append('signature', qrSignature);
    // NO eager parameter - image is already perfect
    
    const qrUploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: qrFormData,
      }
    );
    
    if (!qrUploadResponse.ok) {
      const errorText = await qrUploadResponse.text();
      console.error('[create-subclip] QR upload error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to upload QR code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const qrUploadData = await qrUploadResponse.json();
    console.log('[create-subclip] QR code uploaded to Cloudinary:', qrUploadData.public_id);
    
    // Get the high-res PNG version from eager transformation
    let qrPngPublicId = qrUploadData.public_id;
    if (qrUploadData.eager && qrUploadData.eager.length > 0) {
      qrPngPublicId = qrUploadData.public_id; // PNG replaces SVG at same path
      console.log('[create-subclip] High-res PNG QR created for sharp overlay');
    }

    // Get source video URL from Supabase Storage
    const videoPathParts = video.video_url.split('/videos/')[1];
    const { data: { publicUrl: sourceVideoUrl } } = supabaseClient.storage
      .from('videos')
      .getPublicUrl(videoPathParts);
    
    console.log('[create-subclip] Source video URL:', sourceVideoUrl);

    // Upload video to Cloudinary with eager transformations
    const videoTimestamp = Math.floor(Date.now() / 1000);
    const videoPublicId = `subclips/clip_${user.id}_${videoTimestamp}`;
    
    // Build transformation with QR overlay based on orientation
    const qrLayerId = qrPngPublicId.replace(/\//g, ':');
    
    // Set dimensions based on orientation
    const dimensions = orientation === 'vertical' 
      ? 'w_1080,h_1920'  // 9:16 for TikTok/Reels
      : 'w_1920,h_1080'; // 16:9 for YouTube/Facebook
    
    // Calculate when QR should appear (last 2.5 seconds of clip as end-card)
    const clipDuration = end_time - start_time;
    const qrDisplayDuration = 2.5; // Show QR in last 2.5 seconds only
    const qrStartOffset = Math.max(0, clipDuration - qrDisplayDuration);
    const qrAbsoluteStart = start_time + qrStartOffset;
    
    // QR size and positioning - balanced size for social media
    const qrSize = '220'; // 220px - scannable but not intrusive
    const qrPaddingX = '30'; // 30px from right edge
    const qrPaddingY = '30'; // 30px from top edge
    
    // End-card QR: appears only in last 2.5 seconds, high-res PNG for scannability
    const eagerTransformation = `so_${start_time},eo_${end_time}/${dimensions},c_fill,g_center/so_${qrAbsoluteStart},l_${qrLayerId},w_${qrSize},q_100,fl_layer_apply,g_north_east,x_${qrPaddingX},y_${qrPaddingY}`;
    
    console.log('[create-subclip] Transformation:', { 
      orientation, 
      qrSize,
      qrTiming: `end-card (shows at ${qrAbsoluteStart}s for last ${qrDisplayDuration}s)`,
      transformation: eagerTransformation 
    });
    
    console.log('[create-subclip] Uploading raw video to Cloudinary');
    
    const videoUploadParams = {
      public_id: videoPublicId,
      timestamp: videoTimestamp
      // Plain upload only - no eager transformations
    };
    
    const videoSignature = await generateSignature(videoUploadParams);
    
    const videoFormData = new FormData();
    videoFormData.append('file', sourceVideoUrl);
    videoFormData.append('public_id', videoPublicId);
    videoFormData.append('timestamp', videoTimestamp.toString());
    videoFormData.append('api_key', CLOUDINARY_API_KEY!);
    videoFormData.append('signature', videoSignature);
    // Plain upload - transformations will be requested via Explicit API
    
    const videoUploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: videoFormData,
      }
    );
    
    if (!videoUploadResponse.ok) {
      const errorText = await videoUploadResponse.text();
      console.error('[create-subclip] Video upload error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to process video with Cloudinary' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const videoUploadData = await videoUploadResponse.json();
    console.log('[create-subclip] Video uploaded to Cloudinary:', videoUploadData.public_id);
    
    // Step 2: Request eager transformation via Explicit API
    console.log('[create-subclip] Requesting transformation via Explicit API');
    const explicitTimestamp = Math.round(Date.now() / 1000);
    const explicitParams = {
      public_id: videoPublicId,
      timestamp: explicitTimestamp,
      type: 'upload',
      eager: eagerTransformation,
      eager_async: 'true'
    };
    
    const explicitSignature = await generateSignature(explicitParams);
    
    const explicitFormData = new FormData();
    explicitFormData.append('public_id', videoPublicId);
    explicitFormData.append('type', 'upload');
    explicitFormData.append('api_key', CLOUDINARY_API_KEY!);
    explicitFormData.append('timestamp', String(explicitTimestamp));
    explicitFormData.append('signature', explicitSignature);
    explicitFormData.append('eager', eagerTransformation);
    explicitFormData.append('eager_async', 'true');
    
    const explicitResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/explicit`,
      {
        method: 'POST',
        body: explicitFormData,
      }
    );
    
    if (!explicitResponse.ok) {
      const explicitError = await explicitResponse.json();
      console.error('[create-subclip] Explicit API error:', explicitError);
      throw new Error(`Cloudinary explicit transformation failed: ${JSON.stringify(explicitError)}`);
    }
    
    const explicitData = await explicitResponse.json();
    console.log('[create-subclip] Transformation requested:', explicitData);
    
    // Capture the transformation URL from the Explicit API response
    let processedVideoUrl = null;
    if (explicitData.eager && explicitData.eager.length > 0) {
      processedVideoUrl = explicitData.eager[0].secure_url;
      console.log('[create-subclip] Transformation URL:', processedVideoUrl);
    } else {
      console.error('[create-subclip] No eager transformation URL in response');
      throw new Error('Failed to get transformation URL from Cloudinary');
    }
    
    // Step 3: Poll the transformation URL directly until it's ready
    console.log('[create-subclip] Polling transformation URL for completion');
    let retries = 0;
    const maxRetries = 30; // 30 retries × 2 seconds = 60 seconds total
    let videoReady = false;
    
    while (retries < maxRetries && !videoReady) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds between checks
      
      console.log(`[create-subclip] Checking if video is ready (attempt ${retries + 1}/${maxRetries})`);
      
      try {
        // Try HEAD request first (faster)
        const headResponse = await fetch(processedVideoUrl, { method: 'HEAD' });
        
        if (headResponse.ok) {
          // Video is ready!
          console.log('[create-subclip] Transformation complete, video is ready');
          videoReady = true;
          break;
        } else {
          console.log(`[create-subclip] Video not ready yet (status: ${headResponse.status})`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'unknown error';
        console.log(`[create-subclip] Video not ready yet (fetch error: ${errorMsg})`);
      }
      
      retries++;
    }
    
    if (!videoReady) {
      console.error('[create-subclip] Transformation timed out after all retries');
      return new Response(JSON.stringify({ 
        error: 'Video processing timed out. Please try again.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download the processed video
    const processedVideoResponse = await fetch(processedVideoUrl);
    
    if (!processedVideoResponse.ok) {
      console.error('[create-subclip] Failed to download processed video:', processedVideoResponse.status);
      return new Response(JSON.stringify({ error: 'Failed to download processed video' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[create-subclip] Processed video downloaded after', retries, 'retries');
    console.log('[create-subclip] Processed video has end-card QR (220px, top-right, last 2.5s)');
    console.log('[create-subclip] QR timing: appears at', qrAbsoluteStart, 'seconds in source video');
    
    const processedVideoBlob = await processedVideoResponse.blob();
    const processedVideoBuffer = await processedVideoBlob.arrayBuffer();
    console.log('[create-subclip] Processed video downloaded');

    // Generate caption with Lovable AI if requested
    let generatedCaption = caption || '';
    let hashtags: string[] = [];

    if (auto_caption && !caption) {
      console.log('[create-subclip] Generating AI caption...');
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a professional social media caption writer. Create engaging captions with relevant hashtags for TikTok/Instagram. Format your response as: [Caption text]\\n\\nHashtags: #tag1 #tag2 #tag3'
              },
              {
                role: 'user',
                content: `Create a viral caption for a ${duration}s video titled "${video.title}". Include 5-8 relevant hashtags. The video is about ${video.kind.replace('_', ' ')}. Make it engaging and optimized for TikTok/Instagram Reels.`
              }
            ]
          })
        });

        // Check for rate limit or payment errors
        if (aiResponse.status === 429) {
          console.error('[create-subclip] AI rate limit exceeded');
          throw new Error('Rate limit exceeded');
        }
        
        if (aiResponse.status === 402) {
          console.error('[create-subclip] AI payment required');
          throw new Error('Payment required for AI service');
        }

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('[create-subclip] AI API error:', aiResponse.status, errorText);
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        console.log('[create-subclip] AI response:', JSON.stringify(aiData));
        
        const aiMessage = aiData.choices?.[0]?.message?.content;
        
        if (!aiMessage || aiMessage.trim() === '') {
          console.error('[create-subclip] AI returned empty content');
          throw new Error('AI returned empty caption');
        }
        
        // Parse caption and hashtags
        const parts = aiMessage.split('Hashtags:');
        generatedCaption = parts[0].trim();
        
        if (parts[1]) {
          hashtags = parts[1].trim().split(/\s+/)
            .filter((tag: string) => tag.includes('#'))
            .map((tag: string) => {
              // Remove all # symbols and add exactly one back
              const cleanTag = tag.replace(/#/g, '');
              return `#${cleanTag}`;
            });
        }
        
        console.log('[create-subclip] AI caption generated:', generatedCaption);
        console.log('[create-subclip] AI hashtags:', hashtags);
      } catch (aiError) {
        console.error('[create-subclip] AI caption generation failed:', aiError);
        // Provide a better fallback caption
        generatedCaption = `🎵 ${video.title}\n\nWatch the full video on SubAmerica! 🔥`;
        hashtags = ['#music', '#artist', '#viral', '#fyp', '#newrelease'];
        console.log('[create-subclip] Using fallback caption');
      }
    }

    // Upload processed clip to Supabase Storage
    const clipFileName = `${user.id}/${Date.now()}_clip.mp4`;
    
    const { error: uploadError } = await supabaseClient.storage
      .from('social_clips')
      .upload(clipFileName, new Uint8Array(processedVideoBuffer), {
        contentType: 'video/mp4',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('[create-subclip] Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload clip' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { publicUrl: clipUrl } } = supabaseClient.storage
      .from('social_clips')
      .getPublicUrl(clipFileName);

    console.log('[create-subclip] Clip uploaded to storage:', clipUrl);

    // Generate thumbnail using Cloudinary transformation
    const thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/so_1.0,w_360,h_640,c_fill,g_auto/${videoPublicId}.jpg`;
    
    console.log('[create-subclip] Thumbnail URL:', thumbnailUrl);
    
    // Download and upload thumbnail to Supabase Storage
    const thumbnailResponse = await fetch(thumbnailUrl);
    if (thumbnailResponse.ok) {
      const thumbnailBlob = await thumbnailResponse.blob();
      const thumbnailBuffer = await thumbnailBlob.arrayBuffer();
      const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
      
      await supabaseClient.storage
        .from('social_clips')
        .upload(thumbnailFileName, new Uint8Array(thumbnailBuffer), {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      const { data: { publicUrl: storedThumbnailUrl } } = supabaseClient.storage
        .from('social_clips')
        .getPublicUrl(thumbnailFileName);

      console.log('[create-subclip] Thumbnail uploaded:', storedThumbnailUrl);

      // Insert into subclip_library
      const { data: subclip, error: dbError } = await supabaseClient
        .from('subclip_library')
        .insert({
          artist_id: video.artists.id,
          source_video_id: video_id,
          clip_url: clipUrl,
          duration,
          start_time,
          end_time,
          caption: generatedCaption,
          hashtags,
          qr_type,
          qr_url: qrUrl,
          thumbnail_url: storedThumbnailUrl,
          status: 'ready'
        })
        .select()
        .single();

      if (dbError) {
        console.error('[create-subclip] Database error:', dbError);
        return new Response(JSON.stringify({ error: 'Failed to save clip record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Optional: Cleanup Cloudinary assets to save storage
      try {
        // Delete QR code from Cloudinary
        await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_id: qrUploadData.public_id,
              api_key: CLOUDINARY_API_KEY,
              timestamp: Math.floor(Date.now() / 1000),
              signature: await generateSignature({ public_id: qrUploadData.public_id, timestamp: Math.floor(Date.now() / 1000) })
            })
          }
        );
        
        // Delete video from Cloudinary
        await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/destroy`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_id: videoUploadData.public_id,
              api_key: CLOUDINARY_API_KEY,
              timestamp: Math.floor(Date.now() / 1000),
              signature: await generateSignature({ public_id: videoUploadData.public_id, timestamp: Math.floor(Date.now() / 1000), resource_type: 'video' })
            })
          }
        );
        
        console.log('[create-subclip] Cloudinary assets cleaned up');
      } catch (cleanupError) {
        console.warn('[create-subclip] Cloudinary cleanup error:', cleanupError);
      }

      console.log('[create-subclip] SubClip created successfully:', subclip.id);

      return new Response(JSON.stringify({
        success: true,
        subclip_id: subclip.id,
        clip_url: clipUrl,
        thumbnail_url: storedThumbnailUrl,
        caption: generatedCaption,
        hashtags,
        duration
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('[create-subclip] Failed to download thumbnail');
      return new Response(JSON.stringify({ error: 'Failed to generate thumbnail' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('[create-subclip] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
