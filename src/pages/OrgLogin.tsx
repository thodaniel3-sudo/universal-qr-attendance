import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input } from '../components/UI';

export default function OrgLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Login failed.');
      setLoading(false);
      return;
    }

    const role = authData.user.app_metadata?.role;
    if (!role || !role.startsWith('organization')) {
      await supabase.auth.signOut();
      setError('This account is not registered as an organization administrator.');
      setLoading(false);
      return;
    }

    navigate('/admin/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card style={{ maxWidth: '24rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: THEME.text, marginBottom: '0.5rem' }}>Organization Admin</h1>
          <p style={{ color: THEME.textMuted, fontSize: '0.875rem' }}>Sign in to manage your members and events</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(e:any) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e:any) => setPassword(e.target.value)} required />

          {error && <p style={{ color: THEME.danger, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: THEME.textMuted, fontSize: '0.875rem', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </Card>
    </div>
  );
}