import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Input, Select, PageContainer } from '../components/UI';

export default function AdminCSVExport() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState<string>('');
  const [recordCount, setRecordCount] = useState<number | null>(null);

  // Filters
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Load org events on mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      const orgId = user.app_metadata?.org_id;

      if (orgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', orgId)
          .single();
        if (org) setOrgName(org.name);

        const { data: evts } = await supabase
          .from('events')
          .select('id, name')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });
        if (evts) setEvents(evts);
      }
    }
    init();
  }, [navigate]);

  async function previewCount() {
    // Query the count client-side for feedback
    const { data: { user } } = await supabase.auth.getUser();
    const orgId = user?.app_metadata?.org_id;
    if (!orgId) return;

    let query = supabase
      .from('attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    if (selectedEvent !== 'all') query = query.eq('event_id', selectedEvent);
    if (dateFrom) query = query.gte('checked_in_at', dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      query = query.lt('checked_in_at', end.toISOString());
    }

    const { count } = await query;
    setRecordCount(count ?? 0);
  }

  useEffect(() => {
    previewCount();
  }, [selectedEvent, dateFrom, dateTo, search]);

  async function downloadCSV() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          event_id: selectedEvent,
          date_from: dateFrom || null,
          date_to: dateTo || null,
          search: search || null,
        }),
      });

      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${orgName.replace(/\s+/g, '_')}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setSelectedEvent('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
  }

  return (
    <PageContainer
      title="Download Attendance CSV"
      subtitle={orgName ? `Export attendance records for ${orgName}` : 'Loading...'}
      action={<Link to="/admin/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>}
    >
      <Card style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '1.5rem' }}>
          Filter Records
        </h2>

        <Select label="Event" value={selectedEvent} onChange={(e: any) => setSelectedEvent(e.target.value)}>
          <option value="all">All Events</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </Select>

        <Input
          label="Search by Member Name, ID, or Email"
          placeholder="e.g., John, MAT2024001, john@email.com"
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e: any) => setDateFrom(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e: any) => setDateTo(e.target.value)}
          />
        </div>

        <div style={{
          marginTop: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: THEME.input,
          borderRadius: '0.5rem',
          borderLeft: `4px solid ${THEME.primary}`
        }}>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.875rem' }}>
            {recordCount === null ? 'Counting records...' : (
              <>
                <strong style={{ color: THEME.text }}>{recordCount}</strong> attendance record{recordCount === 1 ? '' : 's'} will be exported.
              </>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={downloadCSV}
            disabled={loading || recordCount === 0}
            style={{ flex: 1 }}
          >
            {loading ? 'Generating CSV...' : '📥 Download CSV'}
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '0.5rem',
          borderLeft: `4px solid ${THEME.success}`
        }}>
          <h3 style={{ fontSize: '1rem', color: THEME.text, marginBottom: '0.5rem' }}>
            What's included in the CSV
          </h3>
          <ul style={{ color: THEME.textMuted, fontSize: '0.9rem', paddingLeft: '1.5rem', margin: 0 }}>
            <li>Member name, ID number, email, phone</li>
            <li>Event name and event date</li>
            <li>Checked-in timestamp</li>
            <li>Verification status (Verified or Override)</li>
            <li>Override reason (if applicable)</li>
          </ul>
        </div>
      </Card>
    </PageContainer>
  );
}