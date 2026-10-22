import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Card } from '../components/UI';

export default function PublicScanView() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return setError("No token provided");
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-scan-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ token })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid QR code.");
      } else {
        setMember(data.member);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
        {loading ? (
          <p style={{ color: THEME.textMuted }}>Loading Profile...</p>
        ) : error ? (
          <>
            <h1 style={{ color: THEME.danger, marginBottom: '1rem' }}>Invalid QR Code</h1>
            <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>{error}</p>
          </>
        ) : (
          <>
            <h2 style={{ color: THEME.success, marginBottom: '1rem' }}>Member Profile</h2>
            {member.photo_url ? (
              <img src={member.photo_url} alt="Profile" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%', border: `4px solid ${THEME.success}`, marginBottom: '1rem' }} />
            ) : (
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: THEME.input, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textMuted }}>No Photo</div>
            )}
            <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: THEME.text }}>{member.full_name}</h3>
            <p style={{ color: THEME.textMuted, marginBottom: '0.25rem' }}>ID: {member.member_reference}</p>
            <p style={{ color: THEME.textMuted, marginBottom: '1.5rem' }}>Email: {member.email}</p>
            
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', border: `1px solid ${THEME.success}` }}>
              <p style={{ margin: 0, color: THEME.success, fontSize: '0.875rem', fontWeight: 600 }}>This QR code is valid and ready to be scanned by the Admin.</p>
            </div>
          </>
        )}
        <Link to="/" style={{ display: 'block', marginTop: '2rem', color: THEME.primary }}>Return Home</Link>
      </Card>
    </div>
  );
}