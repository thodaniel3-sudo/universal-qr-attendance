import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin/login');
        return;
      }
      setEmail(user.email ?? null);

      const orgId = user.app_metadata?.org_id;
      if (orgId) {
        const { data } = await supabase.from('organizations').select('name').eq('id', orgId).single();
        if (data) setOrgName(data.name);
      }
    }
    load();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{orgName || 'Loading…'}</h1>
            <p style={{ color: '#64748b' }}>Admin: {email}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        {/* Dashboard Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <Link to="/admin/scanner" style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textDecoration: 'none', color: 'inherit', display: 'block', borderLeft: '4px solid #059669' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#0f172a' }}>Scan Attendance</h2>
            <p style={{ color: '#64748b' }}>Open the camera to check members in for active events.</p>
          </Link>

          <Link to="/admin/events" style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textDecoration: 'none', color: 'inherit', display: 'block', borderLeft: '4px solid #2563eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#0f172a' }}>Manage Events</h2>
            <p style={{ color: '#64748b' }}>Create new lectures, services, or meetings and open them for attendance.</p>
          </Link>

        </div>
      </div>
    </div>
  );
}