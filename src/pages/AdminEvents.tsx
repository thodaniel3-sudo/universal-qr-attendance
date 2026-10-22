import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, Badge, PageContainer } from '../components/UI';

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      
      const org = user.app_metadata?.org_id;
      setOrgId(org);

      if (org) {
        const { data } = await supabase.from('events').select('*').eq('organization_id', org).order('created_at', { ascending: false });
        if (data) setEvents(data);
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setIsCreating(true);

    const { data, error } = await supabase.from('events').insert({
      organization_id: orgId, name, description, status: 'open', starts_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      alert("Error: " + error.message);
    } else if (data) {
      setEvents([data, ...events]);
      setName(''); setDescription('');
    }
    setIsCreating(false);
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', id);
    if (!error) setEvents(events.map(e => e.id === id ? { ...e, status: newStatus } : e));
  }

  return (
    <PageContainer 
      title="Event Management" 
      subtitle="Create events and open them for attendance scanning"
      action={<Link to="/admin/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>}
    >
      <Card style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '1.5rem' }}>Create New Event</h2>
        <form onSubmit={createEvent} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 250px' }}>
            <Input label="Event Name" placeholder="e.g., Sunday Service, Math 101" value={name} onChange={(e:any) => setName(e.target.value)} required />
          </div>
          <div style={{ flex: '1 1 250px' }}>
            <Input label="Description (Optional)" placeholder="Brief description" value={description} onChange={(e:any) => setDescription(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        {loading ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>Loading events...</p>
        ) : events.length === 0 ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>No events created yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: THEME.text }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${THEME.border}`, textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Event Name</th>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Created</th>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Status</th>
                <th style={{ padding: '1rem', color: THEME.textMuted }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{event.name}</td>
                  <td style={{ padding: '1rem', color: THEME.textMuted }}>{new Date(event.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <Badge type={event.status === 'open' ? 'success' : 'danger'}>{event.status.toUpperCase()}</Badge>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Button variant={event.status === 'open' ? 'danger' : 'success'} onClick={() => toggleStatus(event.id, event.status)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>
                      {event.status === 'open' ? 'Close' : 'Re-open'}
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