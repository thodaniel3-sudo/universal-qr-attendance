import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, PageContainer } from '../components/UI';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPayment() {
      if (!reference) {
        setError("No payment reference found in the URL.");
        setLoading(false);
        return;
      }

      // Poll the Edge Function until the webhook finishes processing
      let attempts = 0;
      while (attempts < 15) {
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-payment-temp-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
            body: JSON.stringify({ reference }),
          });
          
          const data = await res.json();
          
          if (res.ok && data.success) {
            setTempPassword(data.tempPassword);
            // Fetch basic payment data for the UI (name/email) from public table
            const { data: pubData } = await supabase.from('payments').select('organization_name, organization_email').eq('paystack_reference', reference).single();
            setPaymentData(pubData);
            setLoading(false);
            return;
          }
        } catch (err) {
          // Ignore error, keep polling
        }
        
        // Wait 2 seconds before trying again
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      }

      setError("Payment is still processing. Please wait a moment and refresh the page.");
      setLoading(false);
    }
    fetchPayment();
  }, [reference]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (!tempPassword || !paymentData) return setError("Missing data. Please refresh.");

    setSubmitting(true);
    setError(null);

    const email = paymentData.organization_email;

    try {
      // 1. Log in with the temp password
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: tempPassword });
      if (loginError) throw new Error("Failed to authenticate your new account. Please contact support.");

      // 2. Update the password to the one they just typed
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error("Failed to set your new password.");

      // 3. Redirect to dashboard
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="Verifying Payment..." subtitle="Please wait while we confirm your transaction">
        <Card style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: THEME.textMuted }}>Connecting to Paystack and setting up your organization...</p>
        </Card>
      </PageContainer>
    );
  }

  if (error && !paymentData) {
    return (
      <PageContainer title="Payment Error" subtitle="Something went wrong">
        <Card style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: THEME.danger, marginBottom: '2rem' }}>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Refresh Page</Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Setup Your Account" subtitle="Your payment was successful! Create your admin password to continue.">
      <Card style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 style={{ color: THEME.success, fontSize: '1.25rem' }}>Welcome, {paymentData?.organization_name}!</h2>
          <p style={{ color: THEME.textMuted, fontSize: '0.875rem' }}>Login Email: {paymentData?.organization_email}</p>
        </div>

        <form onSubmit={handleSetPassword}>
          <Input label="Choose Admin Password" type="password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} required minLength={6} />
          <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} required minLength={6} />
          
          {error && <p style={{ color: THEME.danger, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <Button type="submit" variant="success" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Setting up...' : 'Save Password & Go to Dashboard'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}