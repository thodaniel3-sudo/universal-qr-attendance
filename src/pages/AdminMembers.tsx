import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, Badge, PageContainer } from '../components/UI';
import BulkImport from '../components/BulkImport';

export default function AdminMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/admin/login');
    
    const org = user.app_metadata?.org_id;
    setOrgId(org);
    
    if (org) {
      const { data } = await supabase.from('organization_memberships').select('*').eq('organization_id', org).order('created_at', { ascending: false });
      if (data) setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, [navigate]);

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await supabase.from('organization_memberships').update({ status: newStatus }).eq('id', id);
    setMembers(members.map(m => m.id === id ? { ...m, status: newStatus } : m));
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ color: THEME.text, fontSize: '1.1rem' }}>Bulk Actions</h3>
          <Button variant="outline" onClick={() => setShowImport(!showImport)}>
            {showImport ? 'Hide Import' : 'Import from CSV'}
          </Button>
        </div>
        {showImport && (
          <div style={{ padding: '1rem', background: THEME.input, borderRadius: '0.5rem' }}>
            <p style={{ color: THEME.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>CSV Format: full_name, email, phone, member_reference, address</p>
            <BulkImport orgId={orgId} onSuccess={loadMembers} />
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: '2rem' }}>
        <Input label="Search Members" placeholder="Search by name, email, or ID number..." value={search} onChange={(e:any) => setSearch(e.target.value)} />
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