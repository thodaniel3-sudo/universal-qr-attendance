import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Select, Badge, PageContainer } from '../components/UI';

export default function AdminAttendance() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      const orgId = user.app_metadata?.org_id;
      
      const { data: eventsData } = await supabase.from('events').select('id, name').eq('organization_id', orgId).order('created_at', { ascending: false });
      if (eventsData) setEvents(eventsData);

      const { data: recordsData } = await supabase.from('attendance_records').select(`id, checked_in_at, photo_verified, organization_memberships ( full_name, member_reference, email ), events ( name )`).eq('organization_id', orgId).order('checked_in_at', { ascending: false });
      if (recordsData) setRecords(recordsData);
      setLoading(false);
    }
    load();
  }, [navigate]);

  const filteredRecords = records.filter(r => selectedEvent === 'all' ? true : r.events?.name === events.find(e => e.id === selectedEvent)?.name);

  async function downloadCSV() {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ event_id: selectedEvent }),
      });

      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageContainer title="Attendance History" subtitle="View and export attendance records for your organization" action={<Link to="/admin/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>}>
      <Card style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px' }}>
          <Select label="Filter by Event" value={selectedEvent} onChange={(e:any) => setSelectedEvent(e.target.value)}>
            <option value="all">All Events</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <Button variant="primary" onClick={downloadCSV} disabled={exporting || filteredRecords.length === 0}>
            {exporting ? 'Generating...' : 'Download CSV'}
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>Loading records...</p>
        ) : filteredRecords.length === 0 ? (
          <p style={{ textAlign: 'center', color: THEME.textMuted }}>No attendance records found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: THEME.text, minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}`, textAlign: 'left' }}>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Member</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>ID Number</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Event</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Checked In</th>
                  <th style={{ padding: '1rem', color: THEME.textMuted }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{record.organization_memberships?.full_name}</td>
                    <td style={{ padding: '1rem' }}>{record.organization_memberships?.member_reference}</td>
                    <td style={{ padding: '1rem' }}>{record.events?.name}</td>
                    <td style={{ padding: '1rem', color: THEME.textMuted }}>{new Date(record.checked_in_at).toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <Badge type={record.photo_verified ? 'success' : 'warning'}>{record.photo_verified ? 'Verified' : 'Override'}</Badge>
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