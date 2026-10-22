import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, PageContainer } from '../components/UI';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      setEmail(user.email ?? null);
      const orgId = user.app_metadata?.org_id;
      if (orgId) {
        const { data } = await supabase.from('organizations').select('name').eq('id', orgId).single();
        if (data) setOrgName(data.name);
      }
    }
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <PageContainer 
      title={orgName || 'Dashboard'} 
      subtitle={`Admin: ${email}`}
      action={<Button variant="danger" onClick={handleLogout}>Sign out</Button>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        <Link to="/admin/scanner" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid ${THEME.success}`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Scan Attendance</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>Open the camera to check members in for active events.</p>
          </Card>
        </Link>

        <Link to="/admin/events" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid ${THEME.primary}`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Manage Events</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>Create new lectures, services, or meetings and open them for attendance.</p>
          </Card>
        </Link>
        
      </div>
    </PageContainer>
  );
}