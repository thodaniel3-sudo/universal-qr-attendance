import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { THEME, Button, Card, Input, PageContainer } from '../components/UI';

const PLANS: Record<string, { amount: number; label: string; days: number }> = {
  weekly:  { amount: 500000,  label: 'Weekly',  days: 7 },
  monthly: { amount: 1500000, label: 'Monthly', days: 30 },
  yearly:  { amount: 12000000, label: 'Yearly', days: 365 },
};

export default function PaymentGatewaySelect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'monthly';
  
  const [form, setForm] = useState({ email: '', fullName: '', orgName: '', orgType: 'church' });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = PLANS[plan];
  if (!selectedPlan) {
    return <PageContainer title="Invalid Plan"><Card>Please go back and choose a valid plan.</Card></PageContainer>;
  }

  async function handlePay(gateway: 'paystack' | 'monnify') {
    setError(null);
    setLoading(gateway);

    try {
      const endpoint = gateway === 'paystack' 
        ? 'platform-payment-initialize' 
        : 'monnify-initialize';

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ plan, ...form }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment initialization failed');

      // Redirect to the gateway's checkout page
      window.location.href = data.authorization_url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  return (
    <PageContainer title="Complete Your Payment" subtitle={`Selected plan: ${selectedPlan.label}`}>
      <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ color: THEME.text, marginBottom: '1rem' }}>1. Your Details</h3>
        <Input label="Full Name" value={form.fullName} onChange={(e: any) => setForm({ ...form, fullName: e.target.value })} required />
        <Input label="Email (for login)" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Organization Name" value={form.orgName} onChange={(e: any) => setForm({ ...form, orgName: e.target.value })} required />
        
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: THEME.textMuted, fontSize: '0.875rem' }}>Organization Type</label>
          <select value={form.orgType} onChange={e => setForm({ ...form, orgType: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${THEME.input}`, background: THEME.input, color: THEME.text }}>
            <option value="church">Church</option>
            <option value="mosque">Mosque</option>
            <option value="school">School</option>
            <option value="university">University</option>
            <option value="company">Company</option>
            <option value="ngo">NGO</option>
            <option value="other">Other</option>
          </select>
        </div>

        <h3 style={{ color: THEME.text, marginBottom: '1rem' }}>2. Choose Payment Gateway</h3>
        
        {error && <p style={{ color: THEME.danger, marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.5rem', border: `2px solid ${THEME.border}`, borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
            <h4 style={{ color: THEME.text, marginBottom: '0.5rem' }}>Paystack</h4>
            <p style={{ color: THEME.textMuted, fontSize: '0.75rem', marginBottom: '1rem' }}>Card, Transfer, USSD</p>
            <Button variant="primary" onClick={() => handlePay('paystack')} disabled={!!loading} style={{ width: '100%' }}>
              {loading === 'paystack' ? 'Redirecting...' : 'Pay with Paystack'}
            </Button>
          </div>
          <div style={{ padding: '1.5rem', border: `2px solid ${THEME.border}`, borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏦</div>
            <h4 style={{ color: THEME.text, marginBottom: '0.5rem' }}>Monnify</h4>
            <p style={{ color: THEME.textMuted, fontSize: '0.75rem', marginBottom: '1rem' }}>Card, Transfer, USSD</p>
            <Button variant="success" onClick={() => handlePay('monnify')} disabled={!!loading} style={{ width: '100%' }}>
              {loading === 'monnify' ? 'Redirecting...' : 'Pay with Monnify'}
            </Button>
          </div>
        </div>

        <Link to="/pricing"><Button variant="outline" style={{ width: '100%' }}>← Back to Plans</Button></Link>
      </Card>
    </PageContainer>
  );
}