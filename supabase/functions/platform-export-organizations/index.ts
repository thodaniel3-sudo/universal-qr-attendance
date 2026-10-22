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
    
    // Verify user is a platform owner
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: owner } = await supabaseAdmin.from('platform_owners').select('status').eq('id', user.id).single();
    if (!owner || owner.status !== 'active') throw new Error('Not a platform owner');

    // Fetch all organizations
    const { data: orgs, error } = await supabaseAdmin
      .from('organizations')
      .select('name, organization_type, contact_email, contract_status, contract_expires_at, created_at')
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    // Generate CSV
    const headers = ['Organization Name', 'Type', 'Contact Email', 'Status', 'Expires At', 'Created At'];
    const rows = orgs.map((o: any) => [
      `"${o.name || ''}"`,
      `"${o.organization_type || ''}"`,
      `"${o.contact_email || ''}"`,
      `"${o.contract_status || ''}"`,
      `"${new Date(o.contract_expires_at).toLocaleDateString()}"`,
      `"${new Date(o.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="platform_organizations_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});