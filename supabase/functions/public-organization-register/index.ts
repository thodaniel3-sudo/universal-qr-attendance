import { getServiceClient } from '../_shared/auth.ts';
import { jsonResponse, corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  const svc = getServiceClient();
  // Only active organizations. Only safe fields.
  const { data, error } = await svc
    .from('organizations')
    .select('name, organization_type, slug')
    .eq('contract_status', 'active')
    .eq('is_archived', false)
    .order('name', { ascending: true });

  if (error) return jsonResponse({ error: 'Lookup failed' }, 500);
  return jsonResponse({ organizations: data ?? [] });
});