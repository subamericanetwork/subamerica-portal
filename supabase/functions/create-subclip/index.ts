import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { video_id, start_time, end_time, qr_type, caption, auto_caption } = await req.json();

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

    // Generate QR code as PNG buffer (works in Deno/server environment)
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      width: 200,
      margin: 2,
      type: 'png',
      color: { dark: '#000000FF', light: '#FFFFFFFF' }
    });

    const qrPath = `/tmp/qr_${Date.now()}.png`;
    await Deno.writeFile(qrPath, qrBuffer);
    console.log('[create-subclip] QR code saved to:', qrPath);

    // Download source video from storage
    const videoFileName = video.video_url.split('/').pop()!;
    const videoPathParts = video.video_url.split('/videos/')[1];
    
    const { data: videoData, error: downloadError } = await supabaseClient.storage
      .from('videos')
      .download(videoPathParts);

    if (downloadError || !videoData) {
      console.error('[create-subclip] Video download error:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to download source video' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inputPath = `/tmp/input_${Date.now()}.mp4`;
    const outputPath = `/tmp/output_${Date.now()}.mp4`;
    
    const videoBuffer = await videoData.arrayBuffer();
    await Deno.writeFile(inputPath, new Uint8Array(videoBuffer));
    console.log('[create-subclip] Source video saved to:', inputPath);

    // FFmpeg command to extract segment, convert to 9:16, and add QR overlay
    console.log('[create-subclip] Running FFmpeg...');
    const ffmpegProcess = new Deno.Command("ffmpeg", {
      args: [
        "-i", inputPath,
        "-ss", start_time.toString(),
        "-t", duration.toString(),
        "-i", qrPath,
        "-filter_complex",
        "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black[v];[v][1:v]overlay=W-w-30:H-h-30",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-y",
        outputPath
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stderr } = await ffmpegProcess.output();
    
    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      console.error('[create-subclip] FFmpeg error:', errorText);
      return new Response(JSON.stringify({ error: 'Video processing failed', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[create-subclip] FFmpeg processing complete');

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

        const aiData = await aiResponse.json();
        const aiMessage = aiData.choices?.[0]?.message?.content || '';
        
        // Parse caption and hashtags
        const parts = aiMessage.split('Hashtags:');
        generatedCaption = parts[0].trim();
        
        if (parts[1]) {
          hashtags = parts[1].trim().split(/\s+/).filter((tag: string) => tag.startsWith('#'));
        }
        
        console.log('[create-subclip] AI caption generated:', generatedCaption);
      } catch (aiError) {
        console.error('[create-subclip] AI caption generation failed:', aiError);
        // Fallback to video title
        generatedCaption = `Check out my latest: ${video.title} 🎵`;
        hashtags = ['#music', '#artist', '#newrelease'];
      }
    }

    // Upload processed clip to storage
    const clipFileName = `${user.id}/${Date.now()}_clip.mp4`;
    const processedVideo = await Deno.readFile(outputPath);
    
    const { error: uploadError } = await supabaseClient.storage
      .from('social_clips')
      .upload(clipFileName, processedVideo, {
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

    console.log('[create-subclip] Clip uploaded:', clipUrl);

    // Generate thumbnail from clip (frame at 1s)
    const thumbnailPath = `/tmp/thumb_${Date.now()}.jpg`;
    const thumbProcess = new Deno.Command("ffmpeg", {
      args: [
        "-i", outputPath,
        "-ss", "1",
        "-vframes", "1",
        "-y",
        thumbnailPath
      ],
      stdout: "piped",
      stderr: "piped",
    });

    await thumbProcess.output();
    
    const thumbnailData = await Deno.readFile(thumbnailPath);
    const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
    
    await supabaseClient.storage
      .from('social_clips')
      .upload(thumbnailFileName, thumbnailData, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

    const { data: { publicUrl: thumbnailUrl } } = supabaseClient.storage
      .from('social_clips')
      .getPublicUrl(thumbnailFileName);

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
        thumbnail_url: thumbnailUrl,
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

    // Cleanup temp files
    try {
      await Deno.remove(inputPath);
      await Deno.remove(outputPath);
      await Deno.remove(qrPath);
      await Deno.remove(thumbnailPath);
    } catch (cleanupError) {
      console.warn('[create-subclip] Cleanup error:', cleanupError);
    }

    console.log('[create-subclip] SubClip created successfully:', subclip.id);

    return new Response(JSON.stringify({
      success: true,
      subclip_id: subclip.id,
      clip_url: clipUrl,
      thumbnail_url: thumbnailUrl,
      caption: generatedCaption,
      hashtags,
      duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[create-subclip] Unexpected error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});