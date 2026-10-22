import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';
import { THEME, Button, Card, Input, Select, PageContainer } from '../components/UI';

export default function MemberRegister() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ token: string, name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [orgId, setOrgId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberRef, setMemberRef] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, organization_type')
      .eq('contract_status', 'active')
      .eq('is_archived', false)
      .order('name')
      .then(({ data }) => { if (data) setOrgs(data); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) return setError('Profile photograph is required.');
    if (photo.size > 5 * 1024 * 1024) return setError('Photo must be under 5 MB.');

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('organization_id', orgId);
    formData.append('full_name', fullName);
    formData.append('phone', phone);
    formData.append('member_reference', memberRef);
    formData.append('email', email);
    formData.append('address', address);
    formData.append('accepted_privacy_notice', 'true');
    formData.append('photo', photo);

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-member-register`, {
      method: 'POST',
      headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Registration failed.');
      setLoading(false);
      return;
    }
    
    setSuccessData({ token: data.qr_url, name: data.member.full_name });
    setLoading(false);
  }

  if (successData) return <QRSuccessView token={successData.token} name={successData.name} />;

  return (
    <PageContainer 
      title="Member Registration" 
      subtitle="Register to get your secure attendance QR code." 
      action={<Link to="/"><Button variant="outline">Back to Home</Button></Link>}
    >
      <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <Select label="Organization *" value={orgId} onChange={(e: any) => setOrgId(e.target.value)} required>
            <option value="">-- Select an organization --</option>
            {orgs.map(o => (
              <option key={o.id} value={o.id}>{o.name} ({o.organization_type})</option>
            ))}
          </Select>
          
          <Input label="Full Name *" value={fullName} onChange={(e: any) => setFullName(e.target.value)} required />
          <Input label="Phone Number *" value={phone} onChange={(e: any) => setPhone(e.target.value)} required />
          <Input label="Identification Number *" value={memberRef} onChange={(e: any) => setMemberRef(e.target.value)} required />
          <Input label="Email Address *" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Input label="Residential Address *" value={address} onChange={(e: any) => setAddress(e.target.value)} required />

          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: THEME.textMuted, fontSize: '0.875rem' }}>Profile Photograph *</label>
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              required 
              onChange={e => setPhoto(e.target.files?.[0] || null)} 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                border: `1px solid ${THEME.input}`, 
                background: THEME.input, 
                color: THEME.text, 
                fontSize: '1rem', 
                outline: 'none' 
              }} 
            />
            <span style={{ fontSize: '0.75rem', color: THEME.textMuted, marginTop: '0.25rem', display: 'block' }}>Max 5MB. JPG, PNG, or WebP.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', color: THEME.textMuted }}>
            <input type="checkbox" required id="privacy" style={{ marginTop: '0.25rem' }} />
            <label htmlFor="privacy" style={{ fontSize: '0.875rem' }}>
              I accept the privacy notice. My photo will be deleted when the organization's contract expires.
            </label>
          </div>

          {error && <p style={{ color: THEME.danger, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
          
          <Button type="submit" variant="success" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Registering…' : 'Register Member'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}

function QRSuccessView({ token, name }: { token: string, name: string }) {
  const [qrUrl, setQrUrl] = useState('');
  
  useEffect(() => {
    QRCode.toDataURL(token, { width: 400, margin: 2 }).then((url) => {
      setQrUrl(url);
      // Auto-download functionality
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${name.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }, [token, name]);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: THEME.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: THEME.success, marginBottom: '0.5rem' }}>Registration Successful!</h1>
        <p style={{ color: THEME.textMuted, marginBottom: '1.5rem' }}>Welcome, {name}</p>
        
        {qrUrl && (
          <img 
            src={qrUrl} 
            alt="QR Code" 
            style={{ width: '100%', maxWidth: '250px', margin: '0 auto 1.5rem', display: 'block', background: 'white', padding: '1rem', borderRadius: '0.5rem' }} 
          />
        )}
        
        <p style={{ fontSize: '0.875rem', color: THEME.textMuted, marginBottom: '1.5rem' }}>
          Your QR code has been automatically downloaded. Save it for check-in!
        </p>
        
        <Button variant="primary" onClick={() => {
          const link = document.createElement('a');
          link.href = qrUrl;
          link.download = `QR-${name.replace(/\s+/g, '-')}.png`;
          link.click();
        }} style={{ width: '100%' }}>
          Download Again
        </Button>
      </Card>
    </div>
  );
}