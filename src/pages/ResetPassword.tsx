import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, PageContainer } from '../components/UI';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Supabase handles the token in the URL automatically when the user lands here
  
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/admin/dashboard'), 3000);
    }
    setLoading(false);
  }

  return (
    <PageContainer title="Set New Password" subtitle="Choose a strong password for your admin account">
      <Card style={{ maxWidth: '400px', margin: '0 auto' }}>
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: THEME.success, marginBottom: '1rem' }}>Password Updated!</h2>
            <p style={{ color: THEME.textMuted, marginBottom: '2rem' }}>
              Your password has been successfully changed. Redirecting you to the dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            
            {error && <p style={{ color: THEME.danger, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

            <Button type="submit" variant="success" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </Card>
    </PageContainer>
  );
}