import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) throw new Error('Missing token');

    // 2. Initialize Supabase with Admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Hash the token to match database
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 4. Find the QR credential
    const { data: qrData, error: qrError } = await supabaseAdmin
      .from('qr_credentials')
      .select('member_id, status')
      .eq('token_hash', tokenHash)
      .eq('status', 'active')
      .maybeSingle();

    if (qrError || !qrData) throw new Error('Invalid or revoked QR code');

    // 5. Get member details
    const { data: member, error: memberError } = await supabaseAdmin
      .from('organization_memberships')
      .select('id, full_name, member_reference, email, profile_photo_url, status')
      .eq('id', qrData.member_id)
      .single();

    if (memberError || !member) throw new Error('Member not found');
    if (member.status !== 'active') throw new Error('Member is inactive');

    // 6. Generate temporary signed URL for the photo
    let photoUrl = null;
    if (member.profile_photo_url && !member.profile_photo_url.startsWith('__deleted')) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('member-photos')
        .createSignedUrl(member.profile_photo_url, 120); // Valid for 2 minutes
      photoUrl = signedUrlData?.signedUrl;
    }

    // 7. Return the data to the frontend to display
    return new Response(
      JSON.stringify({ 
        success: true, 
        member: {
          id: member.id,
          full_name: member.full_name,
          member_reference: member.member_reference,
          email: member.email,
          photo_url: photoUrl
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Validate Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});