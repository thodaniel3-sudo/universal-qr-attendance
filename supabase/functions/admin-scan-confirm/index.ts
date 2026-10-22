import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    // 2. Initialize Supabase client with the caller's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 3. Verify the user is logged in
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');
    
    // 4. Get the Organization ID from the user's metadata
    const orgId = user.app_metadata?.org_id;
    if (!orgId) throw new Error('No organization found for this user');

    // 5. Parse the request body
    const { token, event_id, override, override_reason } = await req.json();
    if (!token || !event_id) throw new Error('Missing token or event_id');

    // 6. Use service role to bypass RLS for the backend transaction
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 7. Verify the Event is open and belongs to the user's org
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, organization_id, status, attendance_opens_at, attendance_closes_at')
      .eq('id', event_id)
      .maybeSingle();

    if (!event) throw new Error('Event not found');
    if (event.organization_id !== orgId) throw new Error('Event belongs to another organization');
    
    const now = new Date();
    if (event.status !== 'open') throw new Error('Event is not open for attendance');
    if (event.attendance_closes_at && new Date(event.attendance_closes_at) < now) throw new Error('Attendance window has closed');
    if (event.attendance_opens_at && new Date(event.attendance_opens_at) > now) throw new Error('Attendance window has not opened');

    // 8. Hash the token to match the database
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 9. Find the QR credential
    const { data: qrData } = await supabaseAdmin
      .from('qr_credentials')
      .select('member_id, status')
      .eq('token_hash', tokenHash)
      .eq('status', 'active')
      .maybeSingle();

    if (!qrData) throw new Error('Invalid or revoked QR code');

    // 10. Verify the Member
    const { data: member } = await supabaseAdmin
      .from('organization_memberships')
      .select('id, organization_id, status, profile_photo_url')
      .eq('id', qrData.member_id)
      .maybeSingle();

    if (!member) throw new Error('Member not found');
    if (member.organization_id !== orgId) throw new Error('QR code belongs to another organization');
    if (member.status !== 'active') throw new Error('Member is inactive');

    // 11. Check photo policy
    const photoMissing = member.profile_photo_url.startsWith('__deleted');
    if (photoMissing && !override) {
      throw new Error('Photo is missing. An administrator must confirm attendance with override.');
    }

    // 12. Check for duplicate attendance
    const { data: existing } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('event_id', event_id)
      .eq('member_id', member.id)
      .maybeSingle();

    if (existing) throw new Error('Attendance already recorded for this event');

    // 13. Insert Attendance Record
    const { error: insertError } = await supabaseAdmin
      .from('attendance_records')
      .insert({
        organization_id: orgId,
        event_id: event_id,
        member_id: member.id,
        checked_in_by: user.id,
        photo_verified: !photoMissing && !override,
        override_reason: override ? (override_reason ?? 'override') : null,
      });

    if (insertError) throw new Error('Failed to record attendance: ' + insertError.message);

    // 14. Log the Audit
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: orgId,
      actor_user_id: user.id,
      actor_role: 'organization_administrator', // We can extract this from user.app_metadata if needed
      action: override ? 'attendance_override' : 'attendance_confirmed',
      target_type: 'organization_membership',
      target_id: member.id,
      metadata: { event_id: event_id },
    });

    // Success Response
    return new Response(
      JSON.stringify({ success: true, message: 'Attendance recorded successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Scan Confirmation Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});