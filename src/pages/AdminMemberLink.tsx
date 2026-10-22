import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, PageContainer } from '../components/UI';

export default function AdminMemberLink() {
  const navigate = useNavigate();
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      const orgId = user.app_metadata?.org_id;
      if (orgId) {
        const { data } = await supabase.from('organizations').select('slug, name').eq('id', orgId).single();
        if (data) {
          setOrgSlug(data.slug);
          setOrgName(data.name);
        }
      }
    }
    load();
  }, [navigate]);

  const registrationLink = orgSlug
    ? `${window.location.origin}/register?org=${orgSlug}`
    : '';

  function copyLink() {
    if (!registrationLink) return;
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <PageContainer
      title="Member Registration Link"
      subtitle="Share this link with your members so they can register"
      action={<Link to="/admin/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>}
    >
      <Card style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>
          {orgName ? `${orgName}` : 'Loading...'}
        </h2>
        <p style={{ color: THEME.textMuted, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          When members open this link, they will be locked to your organization and cannot select a different one. Send this only to your own members.
        </p>

        <div style={{ background: THEME.input, padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', wordBreak: 'break-all' }}>
          <code style={{ color: THEME.text, fontSize: '0.9rem' }}>
            {registrationLink || 'Loading...'}
          </code>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={copyLink} disabled={!registrationLink}>
            {copied ? '✅ Copied!' : 'Copy Link'}
          </Button>
          <Button variant="outline" onClick={() => window.open(registrationLink, '_blank')} disabled={!registrationLink}>
            Open in New Tab
          </Button>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', borderLeft: `4px solid ${THEME.primary}` }}>
          <h3 style={{ fontSize: '1rem', color: THEME.text, marginBottom: '0.5rem' }}>How to share it</h3>
          <ul style={{ color: THEME.textMuted, fontSize: '0.9rem', paddingLeft: '1.5rem', margin: 0 }}>
            <li>Send it in your official WhatsApp group</li>
            <li>Include it in your weekly bulletin or email</li>
            <li>Pin it on your organization's social media</li>
            <li>Do NOT share it publicly — only with your own members</li>
          </ul>
        </div>
      </Card>
    </PageContainer>
  );
}