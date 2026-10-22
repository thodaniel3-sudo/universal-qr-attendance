import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, Badge, PageContainer } from '../components/UI';

export default function AdminMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      
      const orgId = user.app_metadata?.org_id;
      if (orgId) {
        const { data } = await supabase
          .from('organization_memberships')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });
        if (data) setMembers(data);
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('organization_memberships').update({ status: newStatus }).eq('id', id);
    if (!error) setMembers(members.map(m => m.id === id ? { ...m, status: newStatus } : m));
  }

  const filtered = members.filter(m => 
    m.full_name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.member_reference.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer 
      title="Member Management" 
      subtitle="View and manage all registered members"
      action={<Link to="/admin/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>}
    >
      <Card style={{ marginBottom: '2rem' }}>
        <Input 
          label="Search Members" 
          placeholder="Search by name, email, or ID number..." 
          value={search} 
          onChange={(e:any) => setSearch(e.target.value)} 
        />
      </Card>

      <Card>
        {loading ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>Loading members...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>No members found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: THEME.text }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${THEME.border}`, textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Name</th>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>ID Number</th>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Email</th>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Status</th>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => (
                <tr key={member.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{member.full_name}</td>
                  <td style={{ padding: '1rem' }}>{member.member_reference}</td>
                  <td style={{ padding: '1rem', color: THEME.textMuted }}>{member.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <Badge type={member.status === 'active' ? 'success' : 'danger'}>{member.status.toUpperCase()}</Badge>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Button variant={member.status === 'active' ? 'danger' : 'success'} onClick={() => toggleStatus(member.id, member.status)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>
                      {member.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </PageContainer>
  );
}