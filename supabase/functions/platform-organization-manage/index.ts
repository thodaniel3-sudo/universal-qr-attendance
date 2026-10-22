import { getServiceClient, requirePlatformOwner, HttpError } from '../_shared/auth.ts';
import { jsonResponse, corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    // 1. Verify the caller is a Platform Owner
    const user = await requirePlatformOwner(req);
    const svc = getServiceClient();

    // 2. Parse the request body
    const body = await req.json();
    const {
      name, organization_type, contact_email, contact_phone, address,
      admin_full_name, admin_email, admin_password,
      contract_duration_months, photo_missing_policy
    } = body;

    // Basic validation
    if (!name || !admin_email || !admin_password || !contract_duration_months) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // 3. Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 4. Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + contract_duration_months);

    // 5. Create the Organization
    const { data: org, error: orgError } = await svc
      .from('organizations')
      .insert({
        name, slug, organization_type, contact_email, contact_phone, address,
        contract_duration_months,
        contract_started_at: new Date().toISOString(),
        contract_expires_at: expiresAt.toISOString(),
        contract_status: 'active',
      })
      .select('id')
      .single();

    if (orgError || !org) {
      console.error('Org creation failed:', orgError);
      return jsonResponse({ error: 'Failed to create organization: ' + orgError?.message }, 500);
    }

    // 6. Create the Organization Settings
    await svc.from('organization_settings').insert({
      organization_id: org.id,
      setting_key: 'photo_missing_policy',
      setting_value: JSON.stringify(photo_missing_policy || 'allow_with_flag'),
    });

    // 7. Create the Auth User for the Org Admin
    const { data: authUser, error: authError } = await svc.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_full_name }
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation failed:', authError);
      // Rollback org creation (in a real app, use a transaction)
      await svc.from('organizations').delete().eq('id', org.id);
      return jsonResponse({ error: 'Failed to create admin account: ' + authError?.message }, 500);
    }

    const userId = authUser.user.id;

    // 8. Assign the user role in metadata (used by RLS)
    await svc.auth.admin.updateUserById(userId, {
      app_metadata: {
        role: 'organization_owner',
        org_id: org.id
      }
    });

    // 9. Create Profile
    await svc.from('profiles').insert({
      id: userId,
      full_name: admin_full_name,
      email: admin_email,
    });

    // 10. Log Contract Event
    await svc.from('contract_events').insert({
      organization_id: org.id,
      event_type: 'started',
      metadata: { duration_months: contract_duration_months }
    });

    // 11. Log Audit
    await svc.from('audit_logs').insert({
      organization_id: org.id,
      actor_user_id: user.id,
      actor_role: 'platform_owner',
      action: 'organization_created',
      target_type: 'organization',
      target_id: org.id,
      metadata: { name }
    });

    return jsonResponse({
      success: true,
      organization_id: org.id,
      slug,
      admin_email,
    });

  } catch (e) {
    if (e instanceof HttpError) return jsonResponse({ error: e.message }, e.status);
    console.error(e);
    return jsonResponse({ error: 'Unexpected error' }, 500);
  }
});