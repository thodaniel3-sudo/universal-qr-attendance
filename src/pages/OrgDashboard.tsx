import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { THEME, Button, Card, PageContainer } from '../components/UI';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/admin/login');
      setEmail(user.email ?? null);
      const orgId = user.app_metadata?.org_id;
      if (orgId) {
        const { data } = await supabase.from('organizations').select('name, slug').eq('id', orgId).single();
        if (data) {
          setOrgName(data.name);
          setOrgSlug(data.slug);
        }
      }

      // Show welcome guide unless the admin dismissed it before
      const dismissed = localStorage.getItem('admin_welcome_dismissed');
      if (!dismissed) setShowWelcome(true);
    }
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const dismissWelcome = () => {
    localStorage.setItem('admin_welcome_dismissed', 'true');
    setShowWelcome(false);
  };

  const copyLink = () => {
    if (!orgSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/register?org=${orgSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <PageContainer 
      title={orgName || 'Dashboard'} 
      subtitle={`Admin: ${email}`}
      action={<Button variant="danger" onClick={handleLogout}>Sign out</Button>}
    >
      {/* WELCOME GUIDE FOR NEW ADMINS */}
      {showWelcome && (
        <Card style={{ 
          marginBottom: '2rem', 
          border: `2px solid ${THEME.primary}`,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ color: THEME.primary, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                👋 Welcome to {orgName || 'your dashboard'}!
              </h2>
              <p style={{ color: THEME.textMuted, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                Here's exactly what to do next, step by step. You'll be ready in 5 minutes.
              </p>
            </div>
            <button
              onClick={dismissWelcome}
              style={{
                background: 'transparent',
                border: 'none',
                color: THEME.textMuted,
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0 0.5rem',
                lineHeight: 1,
              }}
              title="Dismiss this guide"
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <Step
              number="1"
              title="Create an event"
              description="Go to Manage Events and create your first event (e.g., 'Sunday Service' or 'Math 101'). This is the destination you'll check people into. You can create as many events as you need."
              link="/admin/events"
              linkLabel="Manage Events"
            />
            <Step
              number="2"
              title="Share your member registration link"
              description="Go to Member Registration Link, copy your unique URL, and share it with your members via WhatsApp, email, or your bulletin. Only your members can register with this link — no one else."
              link="/admin/member-link"
              linkLabel="Get Registration Link"
            />
            <Step
              number="3"
              title="Scan your members' QR codes"
              description="When members arrive at your event, open the Scanner, select your event, and hold each member's QR code up to the camera. Their photo will appear — verify it matches the person, then confirm attendance."
              link="/admin/scanner"
              linkLabel="Open Scanner"
            />
            <Step
              number="4"
              title="View and export reports"
              description="After the event, go to Attendance History or Download CSV to see who attended, export the data to Excel, and analyze attendance trends."
              link="/admin/attendance"
              linkLabel="View Attendance"
            />
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: THEME.input, borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, color: THEME.textMuted, fontSize: '0.85rem' }}>
              💡 <strong>Quick tip:</strong> Share this link with members right now:{' '}
              <code style={{ color: THEME.primary, fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {orgSlug ? `${window.location.origin}/register?org=${orgSlug}` : 'Loading...'}
              </code>
              {orgSlug && (
                <button
                  onClick={copyLink}
                  style={{ background: 'transparent', border: 'none', color: THEME.primary, textDecoration: 'underline', cursor: 'pointer', marginLeft: '0.5rem', fontSize: '0.8rem' }}
                >
                  {copied ? '✅ Copied!' : 'Copy'}
                </button>
              )}
            </p>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <Button variant="outline" onClick={dismissWelcome}>Got it, hide this guide</Button>
          </div>
        </Card>
      )}

      {/* MAIN DASHBOARD CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        <Link to="/admin/scanner" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid ${THEME.success}`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Scan Attendance</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>Open the camera to verify members and check them in for active events.</p>
          </Card>
        </Link>

        <Link to="/admin/events" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid ${THEME.primary}`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Manage Events</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>Create lectures, services, or meetings and open them for scanning.</p>
          </Card>
        </Link>

        <Link to="/admin/members" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid #f59e0b`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Manage Members</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>View members, import from CSV, or deactivate accounts.</p>
          </Card>
        </Link>

        <Link to="/admin/attendance" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid #8b5cf6`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Attendance History</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>View who attended which events and export CSV reports.</p>
          </Card>
        </Link>

        <Link to="/admin/member-link" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid #06b6d4`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Member Registration Link</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>Get the unique link to share with your members.</p>
          </Card>
        </Link>

        <Link to="/admin/csv-export" style={{ textDecoration: 'none' }}>
          <Card style={{ cursor: 'pointer', borderTop: `4px solid #ec4899`, height: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: THEME.text, marginBottom: '0.5rem' }}>Download CSV</h2>
            <p style={{ color: THEME.textMuted, margin: 0 }}>Export attendance with date, event, and member filters.</p>
          </Card>
        </Link>

      </div>
    </PageContainer>
  );
}

function Step({ number, title, description, link, linkLabel }: {
  number: string;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: THEME.input, borderRadius: '0.5rem' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: THEME.primary,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, color: THEME.text, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: '0.25rem 0 0.5rem 0', color: THEME.textMuted, fontSize: '0.9rem' }}>{description}</p>
        <Link to={link}>
          <Button variant="primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>{linkLabel} →</Button>
        </Link>
      </div>
    </div>
  );
}