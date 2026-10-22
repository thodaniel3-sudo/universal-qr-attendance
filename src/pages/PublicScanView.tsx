import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Card } from '../components/UI';

export default function PublicScanView() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return setError("No token provided");
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-scan-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ token })
      });
      
      if (!res.ok) {
        setError("Invalid or expired QR code.");
      } else {
        // If valid, we just want to confirm it's active. 
        // We don't need to show the photo to the member, just a "Please show this to the admin" message.
      }
      setLoading(false);
    }
    load();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
        {loading ? (
          <p style={{ color: THEME.textMuted }}>Checking QR Code...</p>
        ) : error ? (
          <>
            <h1 style={{ color: THEME.danger, marginBottom: '1rem' }}>Invalid QR Code</h1>
            <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>{error}</p>
            <Link to="/" style={{ color: THEME.primary }}>Return Home</Link>
          </>
        ) : (
          <>
            <h1 style={{ color: THEME.success, marginBottom: '1rem' }}>✅ Valid Check-In Code</h1>
            <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>
              Please present this screen to the event administrator to have your attendance recorded.
            </p>
            <Link to="/" style={{ color: THEME.primary }}>Return Home</Link>
          </>
        )}
      </Card>
    </div>
  );
}