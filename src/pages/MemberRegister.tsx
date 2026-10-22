import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'qrcode';
import { THEME, Button, Card, Input, PageContainer } from '../components/UI';

export default function MemberRegister() {
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');

  const [org, setOrg] = useState<any>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ token: string, name: string, qr_url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberRef, setMemberRef] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  // Load the organization based on the ?org= slug
  useEffect(() => {
    if (!orgParam) {
      setOrgLoading(false);
      return;
    }
    supabase
      .from('organizations')
      .select('id, name, organization_type, slug, contract_status')
      .eq('slug', orgParam)
      .eq('contract_status', 'active')
      .eq('is_archived', false)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setOrgError('This registration link is invalid or the organization is no longer active.');
        } else {
          setOrg(data);
        }
        setOrgLoading(false);
      });
  }, [orgParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) return setError('Profile photograph is required.');
    if (!org) return setError('Organization not found.');

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('organization_id', org.id);
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
    
    setSuccessData({ token: data.qr_url, name: data.member.full_name, qr_url: data.qr_url });
    setLoading(false);
  }

  if (successData) return <QRSuccessView token={successData.token} name={successData.name} qrUrl={successData.qr_url} />;

  // No org parameter — show blocking message
  if (!orgParam) {
    return (
      <PageContainer title="Registration" subtitle="Registration is by invitation only">
        <Card style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: THEME.text, marginBottom: '1rem' }}>Please use your organization's link</h2>
          <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>
            To register, you need the unique registration link provided by your organization's administrator.
            If you don't have the link, please contact your organization.
          </p>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  if (orgLoading) {
    return (
      <PageContainer title="Loading..." subtitle="">
        <Card style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: THEME.textMuted }}>Checking registration link...</p>
        </Card>
      </PageContainer>
    );
  }

  if (orgError || !org) {
    return (
      <PageContainer title="Invalid Link" subtitle="">
        <Card style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: THEME.danger, marginBottom: '1rem' }}>Registration link invalid</h2>
          <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>
            {orgError || 'This organization could not be found.'}
          </p>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  // Valid org — show registration form with org locked in
  return (
    <PageContainer title="Member Registration" subtitle="Register to get your secure attendance QR code." action={<Link to="/"><Button variant="outline">Back to Home</Button></Link>}>
      <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Organization shown as locked-in banner, not a dropdown */}
        <div style={{ padding: '1rem', background: THEME.input, borderRadius: '0.5rem', marginBottom: '1.5rem', borderLeft: `4px solid ${THEME.success}` }}>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.875rem' }}>Registering for:</p>
          <p style={{ margin: '0.25rem 0 0', fontWeight: 600, color: THEME.success, fontSize: '1.1rem' }}>
            {org.name}
          </p>
          <p style={{ margin: '0.25rem 0 0', color: THEME.textMuted, fontSize: '0.75rem', textTransform: 'capitalize' }}>
            {org.organization_type}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input label="Full Name *" value={fullName} onChange={(e: any) => setFullName(e.target.value)} required />
          <Input label="Phone Number *" value={phone} onChange={(e: any) => setPhone(e.target.value)} required />
          <Input label="Identification Number *" value={memberRef} onChange={(e: any) => setMemberRef(e.target.value)} required />
          <Input label="Email Address *" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Input label="Residential Address *" value={address} onChange={(e: any) => setAddress(e.target.value)} required />

          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: THEME.textMuted, fontSize: '0.875rem' }}>Profile Photograph *</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setPhoto(e.target.files?.[0] || null)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${THEME.input}`, background: THEME.input, color: THEME.text, fontSize: '1rem', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', color: THEME.textMuted }}>
            <input type="checkbox" required id="privacy" style={{ marginTop: '0.25rem' }} />
            <label htmlFor="privacy" style={{ fontSize: '0.875rem' }}>I accept the privacy notice.</label>
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

function QRSuccessView({ token, name, qrUrl }: { token: string, name: string, qrUrl: string }) {
  const [qrImage, setQrImage] = useState('');
  useEffect(() => {
    QRCode.toDataURL(token, { width: 400, margin: 2 }).then((url) => {
      setQrImage(url);
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
        {qrImage && <img src={qrImage} alt="QR Code" style={{ width: '100%', maxWidth: '250px', margin: '0 auto 1.5rem', display: 'block', background: 'white', padding: '1rem', borderRadius: '0.5rem' }} />}
        <p style={{ fontSize: '0.875rem', color: THEME.textMuted, marginBottom: '1rem' }}>Your QR code has been downloaded. You can view your profile below.</p>
        <a href={qrUrl} target="_blank" rel="noreferrer" style={{ color: THEME.primary, textDecoration: 'underline', marginBottom: '1.5rem', display: 'block' }}>Open My Profile Link</a>
        <Button variant="primary" onClick={() => { const link = document.createElement('a'); link.href = qrImage; link.download = `QR-${name.replace(/\s+/g, '-')}.png`; link.click(); }} style={{ width: '100%' }}>Download Again</Button>
      </Card>
    </div>
  );
}