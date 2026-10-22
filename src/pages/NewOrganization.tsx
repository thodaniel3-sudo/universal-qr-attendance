import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CONTRACT_OPTIONS = [
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '1 Year' },
  { months: 24, label: '2 Years' },
  { months: 60, label: '5 Years' },
  { months: 120, label: '10 Years' },
  { months: 180, label: '15 Years' },
];

export default function NewOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('church');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [duration, setDuration] = useState(12);
  const [policy, setPolicy] = useState('allow_with_flag');
  
  // Admin state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Get current session token to pass to Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/platform-admin/login');
      return;
    }

    // 2. Call the Edge Function
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platform-organization-manage`,
      {
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
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to create organization.');
      setLoading(false);
      return;
    }

    // Success! Redirect back to dashboard
    navigate('/platform-admin/dashboard');
  }

  const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #334155', background: '#0f172a', color: 'white', marginTop: '0.25rem' };
  const labelStyle = { display: 'block', fontSize: '0.875rem', marginBottom: '1rem', color: '#cbd5e1' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '2rem' }}>
      <div style={{ maxWidth: '50rem', margin: '0 auto' }}>
        <Link to="/platform-admin/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Back to dashboard</Link>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '1.5rem' }}>Create Organization</h1>

        <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '2rem', borderRadius: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Organization Details</h2>
          
          <label style={labelStyle}>
            Organization Name
            <input type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Organization Type
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
              <option value="church">Church</option>
              <option value="mosque">Mosque</option>
              <option value="school">School</option>
              <option value="university">University</option>
              <option value="company">Company</option>
              <option value="conference">Conference</option>
              <option value="ngo">NGO</option>
              <option value="government">Government</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={labelStyle}>
              Contact Email
              <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Contact Phone
              <input type="tel" required value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <label style={labelStyle}>
            Address
            <input type="text" required value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <label style={labelStyle}>
              Contract Duration
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={inputStyle}>
                {CONTRACT_OPTIONS.map(o => (
                  <option key={o.months} value={o.months}>{o.label}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Photo Missing Policy
              <select value={policy} onChange={e => setPolicy(e.target.value)} style={inputStyle}>
                <option value="allow_with_flag">Allow with flag (default)</option>
                <option value="block">Block attendance</option>
              </select>
            </label>
          </div>

          <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '1rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>Admin Account</h2>

          <label style={labelStyle}>
            Admin Full Name
            <input type="text" required value={adminName} onChange={e => setAdminName(e.target.value)} style={inputStyle} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={labelStyle}>
              Admin Email
              <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Admin Password
              <input type="password" required minLength={8} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={inputStyle} />
            </label>
          </div>

          {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating…' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}