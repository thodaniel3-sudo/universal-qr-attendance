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

    // 1. Check the database first
    let { data: payment } = await supabaseAdmin
      .from('payments')
      .select('status, metadata, organization_name, organization_email')
      .eq('paystack_reference', reference)
      .single();

    if (!payment) throw new Error('Payment not found in database');

    // 2. If the database says "pending", ask Paystack directly!
    if (payment.status === 'pending') {
      const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${secretKey}` }
      });
      
      const data = await res.json();
      
      if (data.status && data.data.status === 'success') {
        // Paystack confirms it is paid. Update the database manually right now!
        await supabaseAdmin.from('payments').update({
          status: 'success',
          paid_at: new Date().toISOString(),
        }).eq('paystack_reference', reference);
        
        // Update our local variable
        payment.status = 'success';
      } else {
        throw new Error('Payment not successful yet. Please wait a moment.');
      }
    }

    // 3. Now fetch the password and return it
    const tempPassword = payment.metadata?.tempPassword;
    if (!tempPassword) throw new Error('Temporary password not found. Contact support.');

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