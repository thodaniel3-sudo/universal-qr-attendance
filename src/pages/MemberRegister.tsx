import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';

export default function MemberRegister() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ token: string, name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [orgId, setOrgId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberRef, setMemberRef] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  // Load active organizations on mount
  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('contract_status', 'active')
      .eq('is_archived', false)
      .order('name')
      .then(({ data }) => {
        if (data) setOrgs(data);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return setError('Please select an organization.');
    if (!photo) return setError('Profile photograph is required.');
    if (photo.size > 5 * 1024 * 1024) return setError('Photo must be under 5 MB.');

    setError(null);
    setLoading(true);

    // 1. Prepare FormData for Edge Function
    const formData = new FormData();
    formData.append('organization_id', orgId);
    formData.append('full_name', fullName);
    formData.append('phone', phone);
    formData.append('member_reference', memberRef);
    formData.append('email', email);
    formData.append('address', address);
    formData.append('accepted_privacy_notice', 'true');
    formData.append('photo', photo);

    // 2. Call the Edge Function (We will deploy this next)
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-member-register`,
      {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: formData, // No Content-Type header! FormData sets it automatically.
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Registration failed.');
      setLoading(false);
      return;
    }

    // 3. Success! Show the QR code screen
    setSuccessData({ token: data.qr_token, name: data.member.full_name });
    setLoading(false);
  }

  // Render QR Success Screen
  if (successData) {
    return <QRSuccessView token={successData.token} name={successData.name} />;
  }

  const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', marginTop: '0.25rem' };
  const labelStyle = { display: 'block', fontSize: '0.875rem', marginBottom: '1rem', color: '#334155', fontWeight: 500 };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to home</Link>
        
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Member Registration</h1>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>
              Organization *
              <select required value={orgId} onChange={e => setOrgId(e.target.value)} style={inputStyle}>
                <option value="">-- Select an organization --</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.organization_type})</option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Full Name *
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Phone Number *
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Identification Number *
              <input type="text" required value={memberRef} onChange={e => setMemberRef(e.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Email Address *
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Residential Address *
              <textarea required value={address} onChange={e => setAddress(e.target.value)} rows={2} style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Profile Photograph * (Required for check-in)
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                required 
                onChange={e => setPhoto(e.target.files?.[0] || null)} 
                style={{ ...inputStyle, padding: '0.4rem' }} 
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>Max 5MB. JPG, PNG, or WebP.</span>
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <input type="checkbox" required id="privacy" />
              <label htmlFor="privacy" style={{ fontSize: '0.875rem', color: '#475569' }}>
                I accept the privacy notice. My photo will be deleted when the organization's contract expires.
              </label>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: '#059669', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, fontWeight: 600 }}
            >
              {loading ? 'Registering…' : 'Register Member'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sub-component to render the QR Code
function QRSuccessView({ token, name }: { token: string, name: string }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    // Generate QR code data URL
    QRCode.toDataURL(token, { width: 300, margin: 2 }).then(setQrUrl);
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '24rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginBottom: '0.5rem' }}>Registration Successful!</h1>
        <p style={{ color: '#475569', marginBottom: '1.5rem' }}>Welcome, {name}</p>
        
        {qrUrl && <img src={qrUrl} alt="QR Code" style={{ width: '100%', maxWidth: '250px', margin: '0 auto 1.5rem', display: 'block' }} />}
        
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Save this QR code. You will use it to check in at events.
        </p>
        
        <button onClick={() => window.print()} style={{ padding: '0.75rem 1.5rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
          Print QR Code
        </button>
      </div>
    </div>
  );
}