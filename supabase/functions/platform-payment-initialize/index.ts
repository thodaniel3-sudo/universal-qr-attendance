import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { amount: number; label: string; days: number }> = {
  weekly:  { amount: 500000,  label: 'Weekly',  days: 7   },   // ₦5,000
  monthly: { amount: 1500000, label: 'Monthly', days: 30  },   // ₦15,000
  yearly:  { amount: 12000000, label: 'Yearly', days: 365 },   // ₦120,000
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { plan, email, fullName, orgName, orgType } = await req.json();

    if (!plan || !PLANS[plan]) throw new Error('Invalid plan');
    if (!email || !fullName || !orgName) throw new Error('Missing required fields');

    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) throw new Error('Payment gateway not configured');

    const reference = `QRATT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const amountKobo = PLANS[plan].amount;

    // Store a pending payment record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseAdmin.from('payments').insert({
      organization_name: orgName,
      organization_email: email,
      plan,
      amount: amountKobo / 100,
      currency: 'NGN',
      paystack_reference: reference,
      status: 'pending',
      metadata: { fullName, orgType, planLabel: PLANS[plan].label, planDays: PLANS[plan].days },
    });

    // Call Paystack to initialize
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        callback_url: `${Deno.env.get('APP_URL')}/payment-success`,
        metadata: {
          plan,
          planLabel: PLANS[plan].label,
          planDays: PLANS[plan].days,
          orgName,
          fullName,
          orgType,
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: PLANS[plan].label },
            { display_name: 'Organization', variable_name: 'org', value: orgName },
          ],
        },
      }),
    });

    const data = await res.json();
    if (!data.status) throw new Error(data.message || 'Payment initialization failed');

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});