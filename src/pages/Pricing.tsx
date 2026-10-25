import { useState } from 'react';
import { Link } from 'react-router-dom';
import { THEME, Button, Card, Input, PageContainer } from '../components/UI';
import { useNavigate, Link } from 'react-router-dom';
const PLANS = [
  { id: 'weekly',  label: 'Weekly',  price: '₦5,000',   days: '7 days',    highlight: false },
  { id: 'monthly', label: 'Monthly', price: '₦15,000',  days: '30 days',   highlight: true  },
  { id: 'yearly',  label: 'Yearly',  price: '₦120,000', days: '365 days',  highlight: false },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', fullName: '', orgName: '', orgType: 'church' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const navigate = useNavigate();
  async function handlePay(planId: string) {
    setSelectedPlan(planId);
    setError(null);
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platform-payment-initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ plan: selectedPlan, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      
      
      // Redirect to Paystack checkout
    function handlePay(planId: string) {
  navigate(`/payment-gateway?plan=${planId}`);
}
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <PageContainer title="Choose Your Plan" subtitle="Simple pricing. Cancel anytime." action={<Link to="/"><Button variant="outline">Back to Home</Button></Link>}>
      {!selectedPlan ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
          {PLANS.map(plan => (
           
           
           
           
          <Card
  key={plan.id}
  style={{
    textAlign: 'center',
    borderTop: `4px solid ${plan.highlight ? THEME.primary : THEME.border}`,
    transform: plan.highlight ? 'scale(1.03)' : 'none',
    boxShadow: plan.highlight ? '0 10px 30px rgba(59, 130, 246, 0.2)' : undefined,
  }}
>
  {plan.highlight && <div style={{ color: THEME.primary, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>MOST POPULAR</div>}
  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: THEME.text, marginBottom: '0.5rem' }}>{plan.label}</h2>
  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: THEME.primary, marginBottom: '0.25rem' }}>{plan.price}</div>
  <p style={{ color: THEME.textMuted, marginBottom: '1.5rem' }}>per organization / {plan.days}</p>
  
  {/* REPLACED BUTTON WITH WHATSAPP LINK */}
  <a 
    href={`https://wa.me/2348107247625?text=Hi, I want to subscribe to the ${plan.label} plan for my organization.`}
    target="_blank"
    rel="noreferrer"
    style={{ textDecoration: 'none', display: 'block', width: '100%' }}
  >
    <Button variant={plan.highlight ? 'primary' : 'outline'} style={{ width: '100%' }}>
      Choose {plan.label} (Contact Sales)
    </Button>
  </a>
</Card>





          ))}
        </div>
      ) : (
        <Card style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ color: THEME.text, marginBottom: '1rem' }}>Complete Your Subscription</h2>
          <p style={{ color: THEME.textMuted, marginBottom: '1.5rem' }}>
            Selected plan: <strong style={{ color: THEME.primary }}>{PLANS.find(p => p.id === selectedPlan)?.label}</strong>
          </p>
          <form onSubmit={submitPayment}>
            <Input label="Your Full Name" value={form.fullName} onChange={(e: any) => setForm({ ...form, fullName: e.target.value })} required />
            <Input label="Your Email (for login)" type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Organization Name" value={form.orgName} onChange={(e: any) => setForm({ ...form, orgName: e.target.value })} required />
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: THEME.textMuted, fontSize: '0.875rem' }}>Organization Type</label>
              <select
                value={form.orgType}
                onChange={e => setForm({ ...form, orgType: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${THEME.input}`, background: THEME.input, color: THEME.text, fontSize: '1rem' }}
              >
                <option value="church">Church</option>
                <option value="mosque">Mosque</option>
                <option value="school">School</option>
                <option value="university">University</option>
                <option value="company">Company</option>
                <option value="ngo">NGO</option>
                <option value="other">Other</option>
              </select>
            </div>
            {error && <p style={{ color: THEME.danger, marginBottom: '1rem' }}>{error}</p>}
            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Redirecting to payment...' : 'Pay with Paystack'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setSelectedPlan(null)} style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              Back to Plans
            </Button>
          </form>
        </Card>
      )}
    </PageContainer>
  );
}