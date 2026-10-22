import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, Select, PageContainer } from '../components/UI';

const CONTRACT_OPTIONS = [
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '1 Year' },
  { months: 24, label: '2 Years' },
  { months: 36, label: '3 Years' },
  { months: 60, label: '5 Years' },
  { months: 96, label: '8 Years' },
  { months: 120, label: '10 Years' },
  { months: 180, label: '15 Years' },
  { months: 240, label: '20 Years' },
];

export default function NewOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Org State
  const [name, setName] = useState('');
  const [type, setType] = useState('church');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [duration, setDuration] = useState(12);
  const [policy, setPolicy] = useState('allow_with_flag');
  
  // Admin State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/platform-admin/login');

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platform-organization-manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        name, organization_type: type, contact_email: contactEmail,
        contact_phone: contactPhone, address, contract_duration_months: duration,
        photo_missing_policy: policy, admin_full_name: adminName,
        admin_email: adminEmail, admin_password: adminPassword
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create organization.');
      setLoading(false);
      return;
    }

    navigate('/platform-admin/dashboard');
  }

  return (
    <PageContainer 
      title="Create Organization" 
      subtitle="Provision a new tenant with their own admin account."
      action={<Link to="/platform-admin/dashboard"><Button variant="outline">Back to Console</Button></Link>}
    >
      <Card style={{ maxWidth: '700px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ color: THEME.text, marginBottom: '1rem', fontSize: '1.1rem' }}>Organization Details</h3>
          
          <Input label="Organization Name" value={name} onChange={(e:any) => setName(e.target.value)} required />
          
          <Select label="Organization Type" value={type} onChange={(e:any) => setType(e.target.value)}>
            <option value="church">Church</option>
            <option value="mosque">Mosque</option>
            <option value="school">School</option>
            <option value="university">University</option>
            <option value="company">Company</option>
            <option value="ngo">NGO</option>
          </Select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Contact Email" type="email" value={contactEmail} onChange={(e:any) => setContactEmail(e.target.value)} required />
            <Input label="Contact Phone" value={contactPhone} onChange={(e:any) => setContactPhone(e.target.value)} required />
          </div>

          <Input label="Address" value={address} onChange={(e:any) => setAddress(e.target.value)} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <Select label="Contract Duration" value={duration} onChange={(e:any) => setDuration(Number(e.target.value))}>
              {CONTRACT_OPTIONS.map(o => <option key={o.months} value={o.months}>{o.label}</option>)}
            </Select>
            <Select label="Photo Missing Policy" value={policy} onChange={(e:any) => setPolicy(e.target.value)}>
              <option value="allow_with_flag">Allow with flag (Recommended)</option>
              <option value="block">Block attendance</option>
            </Select>
          </div>

          <h3 style={{ color: THEME.text, marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem', borderTop: `1px solid ${THEME.border}`, paddingTop: '1.5rem' }}>Admin Account</h3>

          <Input label="Admin Full Name" value={adminName} onChange={(e:any) => setAdminName(e.target.value)} required />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Admin Email" type="email" value={adminEmail} onChange={(e:any) => setAdminEmail(e.target.value)} required />
            <Input label="Admin Password" type="password" value={adminPassword} onChange={(e:any) => setAdminPassword(e.target.value)} required minLength={8} />
          </div>

          {error && <p style={{ color: THEME.danger, marginBottom: '1rem' }}>{error}</p>}

          <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}