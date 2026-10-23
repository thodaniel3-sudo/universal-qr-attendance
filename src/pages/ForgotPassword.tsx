import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, PageContainer } from '../components/UI';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Tell Supabase to send the reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <PageContainer title="Password Recovery" subtitle="We'll send you a link to reset your password">
      <Card style={{ maxWidth: '400px', margin: '0 auto' }}>
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: THEME.success, marginBottom: '1rem' }}>Check your email</h2>
            <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>
              We have sent a password reset link to <strong>{email}</strong>.
              Please check your inbox (and spam folder) and click the link to set a new password.
            </p>
            <Link to="/admin/login">
              <Button variant="outline" style={{ width: '100%' }}>Back to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <p style={{ color: THEME.textMuted, marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Enter the email address associated with your admin account, and we will send you a link to reset your password.
            </p>
            <Input
              label="Admin Email Address"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
            
            {error && <p style={{ color: THEME.danger, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            
            <div style={{ textAlign: 'center' }}>
              <Link to="/admin/login" style={{ color: THEME.textMuted, fontSize: '0.875rem', textDecoration: 'underline' }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </PageContainer>
  );
}