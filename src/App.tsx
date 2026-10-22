import { Routes, Route, Link } from 'react-router-dom';
import PlatformLogin from './pages/PlatformLogin';
import PlatformDashboard from './pages/PlatformDashboard';
import NewOrganization from './pages/NewOrganization';
import OrgLogin from './pages/OrgLogin';
import OrgDashboard from './pages/OrgDashboard';
import MemberRegister from './pages/MemberRegister';
import AdminScan from './pages/AdminScan'; 
import ScannerStandalone from './pages/ScannerStandalone';
import AdminEvents from './pages/AdminEvents';
import AdminMembers from './pages/AdminMembers';
import AdminAttendance from './pages/AdminAttendance';
import { THEME, Button, Card } from './components/UI';

function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Bar */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}` }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          <span style={{ color: THEME.primary }}>QR</span>Attendance
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/register">
            <Button variant="outline" style={{ padding: '0.5rem 1rem' }}>Member Login</Button>
          </Link>
          <Link to="/admin/login">
            <Button variant="primary" style={{ padding: '0.5rem 1rem' }}>Admin Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ display: 'inline-block', padding: '0.25rem 1rem', background: 'rgba(59, 130, 246, 0.1)', color: THEME.primary, borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem', border: `1px solid rgba(59, 130, 246, 0.2)` }}>
          Secure • Fast • Reliable
        </div>
        
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, maxWidth: '800px', marginBottom: '1.5rem' }}>
          Universal QR Code <br />
          <span style={{ color: THEME.primary }}>Attendance Management</span>
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: THEME.textMuted, maxWidth: '600px', marginBottom: '3rem' }}>
          The smartest way to track attendance for churches, schools, and businesses. 
          Generate secure QR codes, verify members with photos, and export reports instantly.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/admin/login">
            <Button variant="primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Login to Dashboard
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="success" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Register as Member
            </Button>
          </Link>
        </div>
      </main>

      {/* Feature Section */}
      <section style={{ padding: '4rem 2rem', borderTop: `1px solid ${THEME.border}`, background: '#0a0f1c' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📸</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Photo Verification</h3>
            <p style={{ color: THEME.textMuted, fontSize: '0.9rem' }}>Scanners pop up the member's photo instantly to prevent proxy attendance.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instant Scanning</h3>
            <p style={{ color: THEME.textMuted, fontSize: '0.9rem' }}>High-speed browser-based camera scanning. No extra hardware required.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Live Reports</h3>
            <p style={{ color: THEME.textMuted, fontSize: '0.9rem' }}>View attendance history in real-time and download CSV reports for accounting.</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', color: THEME.textMuted, borderTop: `1px solid ${THEME.border}`, fontSize: '0.875rem' }}>
        <p>© {new Date().getFullYear()} QR Attendance Platform. All rights reserved.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/platform-admin/login" style={{ color: THEME.textMuted, textDecoration: 'none', margin: '0 1rem' }}>Platform Admin</Link>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<MemberRegister />} />
      
      {/* Platform Admin Routes */}
      <Route path="/platform-admin/login" element={<PlatformLogin />} />
      <Route path="/platform-admin/dashboard" element={<PlatformDashboard />} />
      <Route path="/platform-admin/organizations/new" element={<NewOrganization />} />
      
      {/* Organization Admin Routes */}
      <Route path="/admin/login" element={<OrgLogin />} />
      <Route path="/admin/dashboard" element={<OrgDashboard />} />
      <Route path="/admin/events" element={<AdminEvents />} />
      <Route path="/admin/members" element={<AdminMembers />} />
      <Route path="/admin/attendance" element={<AdminAttendance />} />
      
      {/* The Scanner */}
      <Route path="/admin/scan" element={<AdminScan />} />
      <Route path="/admin/scanner" element={<ScannerStandalone />} />
    </Routes>
  );
}