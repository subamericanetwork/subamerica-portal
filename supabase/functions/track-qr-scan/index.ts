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

    const {
      subclip_id,
      post_id,
      qr_type,
      user_agent,
      referrer,
      conversion_type = null,
      conversion_value = null,
    } = await req.json();

    console.log('Tracking QR scan:', { subclip_id, post_id, qr_type });

    // Get location from IP (basic implementation)
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const scan_location = 'Unknown'; // In production, use IP geolocation service

    // Insert scan record
    const { data: scan, error: scanError } = await supabase
      .from('qr_analytics')
      .insert({
        subclip_id,
        post_id,
        qr_type,
        scan_location,
        user_agent,
        referrer,
        converted: conversion_type !== null,
        conversion_type,
        conversion_value,
        scanned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scanError) {
      console.error('Error inserting QR scan:', scanError);
      throw scanError;
    }

    console.log('QR scan tracked successfully:', scan.id);

    return new Response(
      JSON.stringify({ success: true, scan_id: scan.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-qr-scan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
