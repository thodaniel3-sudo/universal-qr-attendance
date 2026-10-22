import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Badge, PageContainer } from '../components/UI';

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/platform-admin/login');
      setEmail(user.email ?? null);

      // Fetch ALL organizations across the platform
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data) setOrganizations(data);
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <PageContainer 
      title="Platform Admin Console" 
      subtitle={`Signed in as: ${email}`}
      action={
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/platform-admin/organizations/new">
            <Button variant="primary">+ New Organization</Button>
          </Link>
          <Button variant="danger" onClick={handleLogout}>Sign out</Button>
        </div>
      }
    >
      <Card>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '1.5rem' }}>Registered Organizations</h2>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>Loading organizations...</p>
        ) : organizations.length === 0 ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>No organizations found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: THEME.text, minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}`, textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Organization</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Type</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Contact Email</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Status</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Expires</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr key={org.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{org.name}</td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{org.organization_type}</td>
                    <td style={{ padding: '1rem', color: THEME.textMuted }}>{org.contact_email}</td>
                    <td style={{ padding: '1rem' }}>
                      <Badge type={org.contract_status === 'active' ? 'success' : 'danger'}>
                        {org.contract_status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: '1rem', color: THEME.textMuted }}>
                      {new Date(org.contract_expires_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}