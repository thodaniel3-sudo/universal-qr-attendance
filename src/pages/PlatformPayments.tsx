import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, Badge, PageContainer } from '../components/UI';

export default function PlatformPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/platform-admin/login');

      const { data: pays } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      const { data: orgs } = await supabase.from('organizations').select('id, name, subscription_plan, subscription_expires_at, contract_status');

      setPayments(pays || []);
      setOrganizations(orgs || []);
      setLoading(false);
    }
    load();
  }, [navigate]);

  // Calculate analytics
  const successful = payments.filter(p => p.status === 'success');
  const now = new Date();

  const totalRevenue = successful.reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthlyRevenue = successful
    .filter(p => p.paid_at && new Date(p.paid_at).getMonth() === now.getMonth() && new Date(p.paid_at).getFullYear() === now.getFullYear())
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const activeSubscribers = organizations.filter(
    o => o.subscription_expires_at && new Date(o.subscription_expires_at) > now && o.contract_status === 'active'
  ).length;
  const expiredSubscribers = organizations.filter(
    o => o.subscription_expires_at && new Date(o.subscription_expires_at) <= now
  ).length;

  // MRR (Monthly Recurring Revenue)
  let mrr = 0;
  organizations.forEach(o => {
    if (!o.subscription_expires_at || new Date(o.subscription_expires_at) <= now) return;
    if (o.subscription_plan === 'weekly') mrr += 5000 * 4.33;
    else if (o.subscription_plan === 'monthly') mrr += 15000;
    else if (o.subscription_plan === 'yearly') mrr += 120000 / 12;
  });

  // Churn rate
  const churnRate = organizations.length > 0
    ? Math.round((expiredSubscribers / organizations.length) * 100)
    : 0;

  // Plan distribution
  const planCounts = {
    weekly: organizations.filter(o => o.subscription_plan === 'weekly').length,
    monthly: organizations.filter(o => o.subscription_plan === 'monthly').length,
    yearly: organizations.filter(o => o.subscription_plan === 'yearly').length,
  };

  // Revenue chart data (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const amount = successful.filter(p => p.paid_at?.startsWith(dayStr)).reduce((s, p) => s + p.amount, 0);
    return { date: dayStr, amount, label: d.toLocaleDateString('en', { weekday: 'short' }) };
  });
  const maxAmount = Math.max(...last7.map(d => d.amount), 1);

  return (
    <PageContainer
      title="Payments & Analytics"
      subtitle="Revenue, subscribers, and transaction history"
      action={<Link to="/platform-admin/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>}
    >
      {/* Analytics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Revenue</p>
          <p style={{ margin: '0.5rem 0 0', color: THEME.success, fontSize: '1.75rem', fontWeight: 700 }}>₦{totalRevenue.toLocaleString()}</p>
        </Card>
        <Card>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem', textTransform: 'uppercase' }}>This Month</p>
          <p style={{ margin: '0.5rem 0 0', color: THEME.primary, fontSize: '1.75rem', fontWeight: 700 }}>₦{monthlyRevenue.toLocaleString()}</p>
        </Card>
        <Card>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem', textTransform: 'uppercase' }}>MRR</p>
          <p style={{ margin: '0.5rem 0 0', color: THEME.text, fontSize: '1.75rem', fontWeight: 700 }}>₦{Math.round(mrr).toLocaleString()}</p>
        </Card>
        <Card>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem', textTransform: 'uppercase' }}>Active Subscribers</p>
          <p style={{ margin: '0.5rem 0 0', color: THEME.success, fontSize: '1.75rem', fontWeight: 700 }}>{activeSubscribers}</p>
        </Card>
        <Card>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem', textTransform: 'uppercase' }}>Expired</p>
          <p style={{ margin: '0.5rem 0 0', color: THEME.danger, fontSize: '1.75rem', fontWeight: 700 }}>{expiredSubscribers}</p>
        </Card>
        <Card>
          <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem', textTransform: 'uppercase' }}>Churn Rate</p>
          <p style={{ margin: '0.5rem 0 0', color: churnRate > 20 ? THEME.danger : THEME.primary, fontSize: '1.75rem', fontWeight: 700 }}>{churnRate}%</p>
        </Card>
      </div>

      {/* Plan distribution */}
      <Card style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: THEME.text, marginBottom: '1rem' }}>Plan Distribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div><p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem' }}>Weekly</p><p style={{ margin: '0.25rem 0 0', color: THEME.text, fontSize: '1.5rem', fontWeight: 700 }}>{planCounts.weekly}</p></div>
          <div><p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem' }}>Monthly</p><p style={{ margin: '0.25rem 0 0', color: THEME.text, fontSize: '1.5rem', fontWeight: 700 }}>{planCounts.monthly}</p></div>
          <div><p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.75rem' }}>Yearly</p><p style={{ margin: '0.25rem 0 0', color: THEME.text, fontSize: '1.5rem', fontWeight: 700 }}>{planCounts.yearly}</p></div>
        </div>
      </Card>

      {/* Revenue chart (last 7 days) */}
      <Card style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: THEME.text, marginBottom: '1.5rem' }}>Revenue (Last 7 Days)</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '150px' }}>
          {last7.map(d => (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontSize: '0.7rem', color: THEME.textMuted, marginBottom: '0.25rem' }}>₦{(d.amount / 100).toLocaleString()}</div>
              <div style={{
                width: '100%',
                height: `${(d.amount / maxAmount) * 100}%`,
                minHeight: '4px',
                background: THEME.primary,
                borderRadius: '4px 4px 0 0',
              }} />
              <div style={{ fontSize: '0.75rem', color: THEME.textMuted, marginTop: '0.5rem' }}>{d.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment history */}
      <Card>
        <h3 style={{ color: THEME.text, marginBottom: '1rem' }}>Recent Transactions</h3>
        {loading ? (
          <p style={{ color: THEME.textMuted }}>Loading...</p>
        ) : payments.length === 0 ? (
          <p style={{ color: THEME.textMuted }}>No payments yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: THEME.text }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}`, textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: THEME.textMuted }}>Date</th>
                  <th style={{ padding: '0.75rem', color: THEME.textMuted }}>Organization</th>
                  <th style={{ padding: '0.75rem', color: THEME.textMuted }}>Plan</th>
                  <th style={{ padding: '0.75rem', color: THEME.textMuted }}>Amount</th>
                  <th style={{ padding: '0.75rem', color: THEME.textMuted }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: '0.75rem', color: THEME.textMuted }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem' }}>{p.organization_name}</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{p.plan}</td>
                    <td style={{ padding: '0.75rem' }}>₦{p.amount.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <Badge type={p.status === 'success' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}>{p.status.toUpperCase()}</Badge>
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