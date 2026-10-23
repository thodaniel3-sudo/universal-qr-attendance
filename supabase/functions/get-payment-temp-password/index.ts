import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { reference } = await req.json();
    if (!reference) throw new Error('Missing reference');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the payment using the service role (bypasses RLS)
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('status, metadata, organization_name, organization_email')
      .eq('paystack_reference', reference)
      .single();

    if (error || !payment) throw new Error('Payment not found');
    if (payment.status !== 'success') throw new Error('Payment not successful yet');

    const tempPassword = payment.metadata?.tempPassword;
    if (!tempPassword) throw new Error('Temporary password not found. Please contact support.');

    return new Response(
      JSON.stringify({ 
        success: true, 
        tempPassword,
        organization_name: payment.organization_name,
        organization_email: payment.organization_email
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