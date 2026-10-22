import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PlatformLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Login failed.');
      setLoading(false);
      return;
    }

    // 2. Verify this user is a Platform Owner
    const { data: owner, error: ownerError } = await supabase
      .from('platform_owners')
      .select('id, status')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (ownerError || !owner || owner.status !== 'active') {
      await supabase.auth.signOut();
      setError('This account is not a Platform Owner.');
      setLoading(false);
      return;
    }

    // 3. Redirect to console
    navigate('/platform-admin/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '24rem', width: '100%', background: '#1e293b', borderRadius: '1rem', padding: '2rem', color: 'white' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Platform Admin</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Privileged access — MFA required in production
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: '#334155', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: '#334155', color: 'white' }}
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}