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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Verify user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const orgId = user.app_metadata?.org_id;
    if (!orgId) throw new Error('No organization');

    // Parse filters from body
    const { event_id } = await req.json();

    // Build query
    let query = supabaseAdmin
      .from('attendance_records')
      .select(`
        checked_in_at,
        photo_verified,
        organization_memberships ( full_name, member_reference, email ),
        events ( name )
      `)
      .eq('organization_id', orgId)
      .order('checked_in_at', { ascending: false });

    if (event_id && event_id !== 'all') {
      query = query.eq('event_id', event_id);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // Generate CSV
    const headers = ['Member Name', 'ID Number', 'Email', 'Event', 'Date & Time', 'Status'];
    const rows = records.map((r: any) => [
      `"${r.organization_memberships?.full_name || ''}"`,
      `"${r.organization_memberships?.member_reference || ''}"`,
      `"${r.organization_memberships?.email || ''}"`,
      `"${r.events?.name || ''}"`,
      `"${new Date(r.checked_in_at).toLocaleString()}"`,
      r.photo_verified ? 'Verified' : 'Override'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});