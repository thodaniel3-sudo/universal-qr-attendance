import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function generatePassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes).map(b => b.toString(36)).join('').slice(0, 14) + 'Aa1!';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;

  // Verify signature (proves the request came from Paystack, not a hacker)
  const hmac = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (expected !== signature) {
    console.error('Invalid webhook signature');
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event !== 'charge.success') {
    return new Response('Ignored', { status: 200 });
  }

  const tx = event.data;
  const reference = tx.reference;
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Idempotency: check if already processed
  const { data: existing } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('paystack_reference', reference)
    .single();

  if (!existing) {
    console.error('Unknown reference:', reference);
    return new Response('Unknown reference', { status: 200 });
  }
  if (existing.status === 'success') {
    return new Response('Already processed', { status: 200 });
  }

  try {
    // Fetch payment record for full details
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    const meta = payment?.metadata || {};
    const plan = payment.plan;
    const planDays = meta.planDays || 30;
    const orgName = meta.orgName || payment.organization_name;
    const fullName = meta.fullName || 'Organization Admin';
    const orgType = meta.orgType || 'other';
    const email = payment.organization_email;

    // Generate unique slug
    let baseSlug = slugify(orgName);
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const { data: clash } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    const now = new Date();
    const contractExpiry = new Date(now);
    contractExpiry.setFullYear(contractExpiry.getFullYear() + 1); // 1-year contract
    const subscriptionExpiry = new Date(now);
    subscriptionExpiry.setDate(subscriptionExpiry.getDate() + planDays);

    // 1. Create the organization
    const { data: org, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        organization_type: orgType,
        contact_email: email,
        contact_phone: 'N/A',
        address: 'N/A',
        contract_duration_months: 12,
        contract_duration_days: planDays,
        contract_started_at: now.toISOString(),
        contract_expires_at: contractExpiry.toISOString(),
        subscription_plan: plan,
        subscription_expires_at: subscriptionExpiry.toISOString(),
        contract_status: 'active',
      })
      .select('id')
      .single();

    if (orgErr || !org) throw new Error('Failed to create organization: ' + orgErr?.message);

    // 2. Create the admin auth user
    const tempPassword = await generatePassword();
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authErr || !authUser.user) {
      await supabaseAdmin.from('organizations').delete().eq('id', org.id);
      throw new Error('Failed to create admin user: ' + authErr?.message);
    }

    // 3. Set admin role and org_id in metadata
    await supabaseAdmin.auth.admin.updateUserById(authUser.user.id, {
      app_metadata: { role: 'organization_owner', org_id: org.id },
    });

    // 4. Create profile
    await supabaseAdmin.from('profiles').insert({
      id: authUser.user.id,
      full_name: fullName,
      email,
    });

    // 5. Update payment record with org + success
    await supabaseAdmin.from('payments').update({
      organization_id: org.id,
      status: 'success',
      paid_at: now.toISOString(),
      metadata: { ...meta, tempPassword, orgId: org.id, slug },
    }).eq('paystack_reference', reference);

    // 6. Log contract start
    await supabaseAdmin.from('contract_events').insert({
      organization_id: org.id,
      event_type: 'started',
      metadata: { plan, planDays, reference },
    });

    // 7. Send welcome email (placeholders - configure SMTP later)
    console.log(`✅ Organization created: ${orgName} (${email}) — plan: ${plan}, expires: ${subscriptionExpiry.toISOString()}`);
    console.log(`Temporary password: ${tempPassword}`);

    return new Response(
      JSON.stringify({ success: true, organization_id: org.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Webhook processing error:', error.message);
    await supabaseAdmin.from('payments').update({
      status: 'failed',
      metadata: { error: error.message },
    }).eq('paystack_reference', reference);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});