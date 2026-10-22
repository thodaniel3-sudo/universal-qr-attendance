import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  contact_email: string;
  contract_status: string;
  contract_expires_at: string;
}

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 1. Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/platform-admin/login');
        return;
      }
      setEmail(user.email ?? null);

      // 2. Fetch organizations
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setOrganizations(data);
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '2rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Platform Admin Console</h1>
            <p style={{ color: '#94a3b8' }}>Signed in as: {email}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        {/* Section: Organizations */}
        <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Organizations</h2>
            <button
              onClick={() => navigate('/platform-admin/organizations/new')}
              style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              + New Organization
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#94a3b8' }}>Loading…</p>
          ) : organizations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <p style={{ marginBottom: '1rem' }}>No organizations yet.</p>
              <p style={{ fontSize: '0.875rem' }}>Create your first organization using the button above, or use the public registration page.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>Name</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>Type</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>Contact Email</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>Status</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>Expires</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '0.75rem' }}>{org.name}</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{org.organization_type}</td>
                    <td style={{ padding: '0.75rem' }}>{org.contact_email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        background: org.contract_status === 'active' ? '#166534' : '#7f1d1d',
                        color: 'white'
                      }}>
                        {org.contract_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{new Date(org.contract_expires_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}