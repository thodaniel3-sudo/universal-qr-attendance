import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
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
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', org)
          .order('created_at', { ascending: false });
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

    const { data, error } = await supabase
      .from('events')
      .insert({
        organization_id: orgId,
        name,
        description,
        status: 'open', // Automatically open for attendance
        starts_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      alert("Error creating event: " + error.message);
    } else if (data) {
      setEvents([data, ...events]);
      setName('');
      setDescription('');
      alert("Event created successfully and is now open for scanning!");
    }
    setIsCreating(false);
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setEvents(events.map(e => e.id === id ? { ...e, status: newStatus } : e));
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>Event Management</h1>
            <p style={{ color: '#64748b' }}>Create events and open them for attendance scanning</p>
          </div>
          <Link to="/admin/dashboard" style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#0f172a', textDecoration: 'none', borderRadius: '0.375rem' }}>
            Back to Dashboard
          </Link>
        </div>

        {/* Create Form */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Create New Event</h2>
          <form onSubmit={createEvent} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Event Name (e.g., Sunday Service, Math 101)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              style={{ flex: '1 1 300px', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            />
            <input 
              type="text" 
              placeholder="Description (optional)" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              style={{ flex: '1 1 300px', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            />
            <button 
              type="submit" 
              disabled={isCreating}
              style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: isCreating ? 'wait' : 'pointer', fontWeight: 600 }}
            >
              {isCreating ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>

        {/* Events List */}
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading events...</p>
          ) : events.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No events created yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: '#475569' }}>Event Name</th>
                  <th style={{ padding: '1rem', color: '#475569' }}>Created</th>
                  <th style={{ padding: '1rem', color: '#475569' }}>Status</th>
                  <th style={{ padding: '1rem', color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{event.name}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(event.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem',
                        background: event.status === 'open' ? '#dcfce7' : '#fee2e2',
                        color: event.status === 'open' ? '#166534' : '#991b1b'
                      }}>
                        {event.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => toggleStatus(event.id, event.status)}
                        style={{ padding: '0.4rem 0.75rem', background: event.status === 'open' ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        {event.status === 'open' ? 'Close Attendance' : 'Re-open Attendance'}
                      </button>
                    </td>
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