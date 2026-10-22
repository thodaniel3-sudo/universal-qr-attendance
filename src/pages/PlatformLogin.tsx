import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input } from '../components/UI';

export default function PlatformLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if the user has MFA enabled (Verified factor)
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors && factors.totp.length > 0) {
      setRequiresMfa(true);
      setLoading(false);
      return;
    }

    // If no MFA, proceed (in production, enforce MFA)
    await finalizeLogin(data.user.id);
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: (await supabase.auth.mfa.listFactors()).data?.totp[0].id! });
    if (challengeError) { setError(challengeError.message); setLoading(false); return; }

    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId: (await supabase.auth.mfa.listFactors()).data?.totp[0].id!,
      challengeId: challenge.id,
      code: mfaCode
    });

    if (verifyError) { setError(verifyError.message); setLoading(false); return; }
    
    await finalizeLogin(verifyData.user.id);
  }

  async function finalizeLogin(userId: string) {
    // Verify user is a platform owner
    const { data: owner } = await supabase.from('platform_owners').select('status').eq('id', userId).single();
    
    if (!owner || owner.status !== 'active') {
      await supabase.auth.signOut();
      setError('This account is not a Platform Owner.');
      setLoading(false);
      return;
    }
    navigate('/platform-admin/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card style={{ maxWidth: '24rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: THEME.text, marginBottom: '0.5rem' }}>Platform Admin</h1>
          <p style={{ color: THEME.textMuted, fontSize: '0.875rem' }}>Privileged access — MFA required</p>
        </div>

        {!requiresMfa ? (
          <form onSubmit={handleLogin}>
            <Input label="Email" type="email" value={email} onChange={(e:any) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e:any) => setPassword(e.target.value)} required />
            {error && <p style={{ color: THEME.danger, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
            <Button type="submit" disabled={loading} style={{ width: '100%' }}>{loading ? 'Checking...' : 'Sign in'}</Button>
          </form>
        ) : (
          <form onSubmit={verifyMfa}>
            <p style={{ color: THEME.textMuted, marginBottom: '1rem', fontSize: '0.875rem' }}>Enter the 6-digit code from your authenticator app.</p>
            <Input label="MFA Code" type="text" value={mfaCode} onChange={(e:any) => setMfaCode(e.target.value)} required maxLength={6} />
            {error && <p style={{ color: THEME.danger, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>{loading ? 'Verifying...' : 'Verify Code'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}