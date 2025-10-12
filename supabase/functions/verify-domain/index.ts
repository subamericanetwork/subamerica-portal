import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DNSCheckResult {
  status: 'pass' | 'fail';
  value?: string;
  message: string;
}

interface VerificationRequest {
  artistId: string;
  domain: string;
  verificationToken: string;
}

async function checkDNSRecord(domain: string, type: string): Promise<any> {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=${type}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`DNS check failed for ${domain} (${type}):`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { artistId, domain, verificationToken } = await req.json() as VerificationRequest;

    // Verify user owns the artist
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('user_id')
      .eq('id', artistId)
      .single();

    if (artistError || !artist || artist.user_id !== user.id) {
      console.error('Authorization failed');
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this artist profile' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check A record for root domain
    const aRecordCheck: DNSCheckResult = await (async () => {
      const dns = await checkDNSRecord(domain, 'A');
      if (!dns || dns.Status !== 0) {
        return {
          status: 'fail',
          message: 'DNS record not found. Please add the A record.',
        };
      }
      
      const hasCorrectIP = dns.Answer?.some((answer: any) => 
        answer.data === '185.158.133.1'
      );

      if (!hasCorrectIP) {
        return {
          status: 'fail',
          value: dns.Answer?.[0]?.data,
          message: `A record points to ${dns.Answer?.[0]?.data || 'unknown'}, but should point to 185.158.133.1`,
        };
      }

      return {
        status: 'pass',
        value: '185.158.133.1',
        message: 'A record configured correctly',
      };
    })();

    // Check A record for www subdomain
    const wwwRecordCheck: DNSCheckResult = await (async () => {
      const dns = await checkDNSRecord(`www.${domain}`, 'A');
      if (!dns || dns.Status !== 0) {
        return {
          status: 'fail',
          message: 'WWW DNS record not found. Please add the A record for www.',
        };
      }
      
      const hasCorrectIP = dns.Answer?.some((answer: any) => 
        answer.data === '185.158.133.1'
      );

      if (!hasCorrectIP) {
        return {
          status: 'fail',
          value: dns.Answer?.[0]?.data,
          message: `WWW record points to ${dns.Answer?.[0]?.data || 'unknown'}, but should point to 185.158.133.1`,
        };
      }

      return {
        status: 'pass',
        value: '185.158.133.1',
        message: 'WWW record configured correctly',
      };
    })();

    // Check TXT record for verification
    const txtRecordCheck: DNSCheckResult = await (async () => {
      const dns = await checkDNSRecord(`_lovable-verify.${domain}`, 'TXT');
      if (!dns || dns.Status !== 0) {
        return {
          status: 'fail',
          message: 'Verification TXT record not found. Please add the TXT record.',
        };
      }
      
      const hasCorrectToken = dns.Answer?.some((answer: any) => 
        answer.data.replace(/"/g, '') === verificationToken
      );

      if (!hasCorrectToken) {
        return {
          status: 'fail',
          value: dns.Answer?.[0]?.data,
          message: 'TXT record found but verification token does not match',
        };
      }

      return {
        status: 'pass',
        value: verificationToken,
        message: 'Verification token matches',
      };
    })();

    const allPassed = 
      aRecordCheck.status === 'pass' && 
      wwwRecordCheck.status === 'pass' && 
      txtRecordCheck.status === 'pass';

    const checks = {
      aRecord: aRecordCheck,
      wwwRecord: wwwRecordCheck,
      txtRecord: txtRecordCheck,
    };

    // Update domain verification record
    const { error: updateError } = await supabase
      .from('domain_verifications')
      .update({
        verification_status: allPassed ? 'verified' : 'failed',
        dns_check_results: checks,
        last_checked_at: new Date().toISOString(),
        verified_at: allPassed ? new Date().toISOString() : null,
      })
      .eq('artist_id', artistId)
      .eq('domain', domain);

    if (updateError) {
      console.error('Error updating domain verification:', updateError);
    }

    // If verified, update port_settings
    if (allPassed) {
      const { error: portError } = await supabase
        .from('port_settings')
        .update({
          custom_domain_verified: true,
          custom_domain_verified_at: new Date().toISOString(),
        })
        .eq('artist_id', artistId);

      if (portError) {
        console.error('Error updating port settings:', portError);
      }
    }

    const nextSteps: string[] = [];
    if (aRecordCheck.status === 'fail') {
      nextSteps.push('Configure the A record for your root domain');
    }
    if (wwwRecordCheck.status === 'fail') {
      nextSteps.push('Configure the A record for www subdomain');
    }
    if (txtRecordCheck.status === 'fail') {
      nextSteps.push('Add the verification TXT record');
    }
    if (!allPassed) {
      nextSteps.push('DNS changes can take up to 48 hours to propagate');
    }

    return new Response(
      JSON.stringify({
        verified: allPassed,
        checks,
        nextSteps,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in verify-domain function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
