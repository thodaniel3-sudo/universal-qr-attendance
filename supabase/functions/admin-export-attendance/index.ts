import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Auth header');

    // Verify the caller is an authenticated org admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const orgId = user.app_metadata?.org_id;
    if (!orgId) throw new Error('No organization');

    // Parse filters
    const body = await req.json().catch(() => ({}));
    const { event_id, date_from, date_to, search } = body;

    // Query attendance with joined member + event details
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabaseAdmin
      .from('attendance_records')
      .select(`
        checked_in_at,
        photo_verified,
        override_reason,
        organization_memberships!inner ( full_name, member_reference, email, phone ),
        events!inner ( name, starts_at )
      `)
      .eq('organization_id', orgId)
      .order('checked_in_at', { ascending: false });

    if (event_id && event_id !== 'all') {
      query = query.eq('event_id', event_id);
    }
    if (date_from) {
      query = query.gte('checked_in_at', date_from);
    }
    if (date_to) {
      // Add one day so the end date is inclusive
      const endDate = new Date(date_to);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('checked_in_at', endDate.toISOString());
    }
    if (search) {
      // Search by member name, ID, or email
      query = query.or(
        `organization_memberships.full_name.ilike.%${search}%,` +
        `organization_memberships.member_reference.ilike.%${search}%,` +
        `organization_memberships.email.ilike.%${search}%`
      );
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // Build CSV
    const headers = [
      'Member Name',
      'ID Number',
      'Email',
      'Phone',
      'Event',
      'Event Date',
      'Checked In At',
      'Status',
      'Override Reason'
    ];

    const rows = records.map((r: any) => [
      `"${(r.organization_memberships?.full_name || '').replace(/"/g, '""')}"`,
      `"${(r.organization_memberships?.member_reference || '').replace(/"/g, '""')}"`,
      `"${(r.organization_memberships?.email || '').replace(/"/g, '""')}"`,
      `"${(r.organization_memberships?.phone || '').replace(/"/g, '""')}"`,
      `"${(r.events?.name || '').replace(/"/g, '""')}"`,
      `"${r.events?.starts_at ? new Date(r.events.starts_at).toLocaleDateString() : ''}"`,
      `"${new Date(r.checked_in_at).toLocaleString()}"`,
      r.photo_verified ? 'Verified' : 'Override',
      `"${(r.override_reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});